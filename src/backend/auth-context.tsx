// AuthContext provides authentication state and user-related data throughout the app.
// It manages Firebase auth status, user profile, birth chart data, horoscopes, daily tarot cards,
// and readiness flags that indicate when data is loaded and the app is ready for interaction.

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { SignupUserRecord } from '@/services/finishUserSignup.service';
import type { HoroscopeResult } from "@/types/horoscope.types";
import { DailyDrawnTarotCard } from '@/types/tarot-cards.type';
import { requestBirthChartGeneration } from "@/services/client.birthChart.service";

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * AuthContextType defines the shape of the authentication-related state and functions
 * that are exposed to the rest of the app via context.
 * It includes user auth info, profile data, birth chart status, horoscopes, daily tarot cards,
 * loading and readiness flags, and functions to trigger birth chart regeneration.
 */
type AuthContextType = {
  authUser: User | null;
  profile: SignupUserRecord | null;
  initializing: boolean;

  birthChart: any | null;
  birthChartStatus: string | null;
  birthChartError: string | null;
  birthChartLoading: boolean;
  birthChartPremiumUnlocked: boolean;
  regenerateBirthChart: () => void;

  horoscopes: Record<string, HoroscopeResult>;
  horoscopeLoading: boolean;
  horoscopeReady: boolean; // ← ADD THIS

  dailyCards: Record<string, DailyDrawnTarotCard>;
  cardsLoading: boolean;
  cardsReady: boolean; // ← ADD THIS

  availableDates: string[];
  defaultDate: string | null;
  isAppReady: boolean;
};

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  initializing: true,
  birthChart: null,
  birthChartStatus: null,
  birthChartError: null,
  birthChartLoading: false,
  birthChartPremiumUnlocked: false,
  regenerateBirthChart: () => { },
  horoscopes: {},
  horoscopeLoading: true,
  dailyCards: {},
  cardsLoading: true,
  availableDates: [],
  defaultDate: null,
  isAppReady: false,
  horoscopeReady: false, // ← ADD THIS
  cardsReady: false, 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Firebase authenticated user object or null if not logged in
  const [authUser, setAuthUser] = useState<User | null>(null);
  // User profile data fetched from Firestore (custom user record)
  const [profile, setProfile] = useState<SignupUserRecord | null>(null);
  // Flag indicating if initial auth/profile loading is in progress
  const [initializing, setInitializing] = useState(true);
  // User's birth chart data from Firestore
  const [birthChart, setBirthChart] = useState<any | null>(null);
  // Status string representing birth chart generation state
  const [birthChartStatus, setBirthChartStatus] = useState<string | null>(null);
  // Error string related to birth chart generation or fetching
  const [birthChartError, setBirthChartError] = useState<string | null>(null);
  // Loading flag for birth chart generation/fetching
  const [birthChartLoading, setBirthChartLoading] = useState<boolean>(false);
  // Flag indicating if premium features for birth chart are unlocked
  const [birthChartPremiumUnlocked, setBirthChartPremiumUnlocked] = useState<boolean>(false);
  // Map of horoscopes keyed by date string
  const [horoscopes, setHoroscopes] =
    useState<Record<string, HoroscopeResult>>({});
  // Loading flag for horoscopes data
  const [horoscopeLoading, setHoroscopeLoading] = useState(true);
  // Map of daily tarot cards keyed by date string
  const [dailyCards, setDailyCards] =
    useState<Record<string, DailyDrawnTarotCard>>({});

  // --- Safe maps for downstream consumers (never undefined) ---
  // These ensure consumers always receive an object, simplifying null checks downstream
  const safeHoroscopes = horoscopes ?? {};
  const safeDailyCards = dailyCards ?? {};

  // --- Derived available dates and default date ---
  // Combine dates from horoscopes and daily cards into a sorted unique list
  // This enables date-based UI components to know which dates have data available
  const availableDates = useMemo(() => {
    const hDates = Object.keys(safeHoroscopes);
    const cDates = Object.keys(safeDailyCards);
    return Array.from(new Set([...hDates, ...cDates])).sort();
  }, [safeHoroscopes, safeDailyCards]);

  // Default date is the most recent date available or null if none
  const defaultDate = availableDates.at(-1) ?? null;

  // --- Cards/Horoscope readiness states (must be declared before isAppReady) ---
  // Flags indicating whether horoscope and daily card data are fully loaded and valid
  // These are used to gate UI rendering or interactions dependent on this data
  const [horoscopeReady, setHoroscopeReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);
  // Cards loading is inverse of cardsReady
  const cardsLoading = !cardsReady;

  // --- Single authoritative readiness flag ---
  // This flag indicates if the app has completed initial loading and is ready for user interaction
  // It requires that auth initialization is done and either user is logged out or profile is loaded
  const isAppReady = useMemo(() => {
  // Case 1: User is not logged in
  // No Firestore data is required to render auth screens
  if (!authUser) {
    return !initializing;
  }

  // Case 2: User is logged in
  // We must wait for all required Home data
  return (
    !initializing &&
    !!profile &&
    horoscopeReady &&
    cardsReady
  );
}, [
  authUser,
  initializing,
  profile,
  horoscopeReady,
  cardsReady,
]);

  /**
   * Auth + Firestore listener orchestration
   *
   * This effect sets up Firebase authentication state listener and Firestore listeners for:
   * - User profile document
   * - User birth chart document
   * - User horoscope collection
   * - User daily tarot cards collection
   *
   * It updates corresponding state variables on data changes, handles loading and error states,
   * and cleans up all listeners on unmount or auth state change.
   */
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeChart: (() => void) | null = null;
    let unsubscribeHoroscope: (() => void) | null = null;
    let unsubscribeCards: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);
      // Set initializing true once per auth transition to avoid UI flashes and redundant updates.
      setInitializing(true);

      if (!firebaseUser) {
        // User logged out, clear all user-specific data and flags
        setProfile(null);
        setHoroscopes({});
        setDailyCards({});
        setHoroscopeReady(false);
        setCardsReady(false);
        setInitializing(false); // logout is immediate
        if (unsubscribeProfile) unsubscribeProfile();
        return;
      }

      // User logged in, subscribe to user profile Firestore document
      const ref = doc(db, "users", firebaseUser.uid);

      unsubscribeProfile = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as SignupUserRecord) : null);
        },
        (err) => {
          console.warn("profile listener error:", err);
          setProfile(null);
        }
      );

      // Subscribe to birth chart document for the user
      const chartRef = doc(db, "users", firebaseUser.uid, "birthChart", "default");
      unsubscribeChart = onSnapshot(chartRef, (snap) => {
        if (!snap.exists()) {
          setBirthChart(null);
          setBirthChartStatus(null);
          setBirthChartError(null);
          setBirthChartLoading(false);
          setBirthChartPremiumUnlocked(false);
          return;
        }
        const data = snap.data();
        setBirthChart(data);
        setBirthChartStatus(data.status?.state ?? null);
        setBirthChartError(data.error ?? null);
        setBirthChartLoading(
          data.status === "pending" || data.status === "processing"
        );
        setBirthChartPremiumUnlocked(!!data.premiumUnlocked);
      }, (err) => {
        console.warn("birth chart listener error:", err);
        setBirthChart(null);
        setBirthChartStatus(null);
        setBirthChartError("listener_error");
        setBirthChartLoading(false);
        setBirthChartPremiumUnlocked(false);
      });

      // Subscribe to horoscopes collection for the user
      const horoscopeCollectionRef = collection(
        db,
        "users",
        firebaseUser.uid,
        "horoscope"
      );

      unsubscribeHoroscope = onSnapshot(
        horoscopeCollectionRef,
        (snapshot) => {
          const next: Record<string, HoroscopeResult> = {};
          let hasValidDay = false;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data?.status?.state === "complete" && data?.result) {
              next[docSnap.id] = data.result as HoroscopeResult;
              hasValidDay = true;
            }
          });
          setHoroscopes(next);
          setHoroscopeLoading(!hasValidDay);
          setHoroscopeReady(hasValidDay);
        },
        (err) => {
          console.warn("horoscope collection listener error:", err);
          setHoroscopes({});
          setHoroscopeLoading(false);
          setHoroscopeReady(false);
        }
      );

      // Subscribe to daily tarot cards collection for the user
      const cardsCollectionRef = collection(db, "users", firebaseUser.uid, "cards");

      unsubscribeCards = onSnapshot(
        cardsCollectionRef,
        (snapshot) => {
          const cardsMap: Record<string, DailyDrawnTarotCard> = {};
          let hasValidDay = false;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (Array.isArray(data?.cards) && data.cards.length > 0) {
              cardsMap[docSnap.id] = data as DailyDrawnTarotCard;
              hasValidDay = true;
            }
          });

          setDailyCards(cardsMap);
          if (hasValidDay) {
            setCardsReady(true);
          } else {
            setCardsReady(false);
          }
        },
        (err) => {
          console.warn("cards listener error:", err);
          setDailyCards({});
          setCardsReady(false);
        }
      );
    });

    // Cleanup all listeners on unmount or auth state change
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeChart) unsubscribeChart();
      if (unsubscribeHoroscope) unsubscribeHoroscope();
      if (unsubscribeCards) unsubscribeCards();
    };
  }, []);

  /**
   * Splash screen / readiness handling
   *
   * This effect manages the splash screen visibility and the initializing flag based on
   * authentication and profile loading state.
   * - When logged out, the app is ready immediately and splash screen is hidden.
   * - When logged in, the app waits for profile data before hiding splash screen and marking ready.
   */
  useEffect(() => {
    // Logged out → app ready immediately
    if (!authUser) {
      setInitializing(false);
      SplashScreen.hideAsync().catch(() => {});
      return;
    }

    // Logged in → profile is the ONLY gate
    if (profile) {
      console.log("✨ App READY (auth + profile)");
      setInitializing(false);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authUser, profile, horoscopes, dailyCards]);

  /**
   * regenerateBirthChart triggers a forced regeneration of the user's birth chart.
   * It is called when the user explicitly requests a refresh of their birth chart data.
   * The function sets loading states and handles errors accordingly.
   */
  const regenerateBirthChart = async () => {
    if (!authUser) return;

    try {
      setBirthChartLoading(true);

      await requestBirthChartGeneration({
        force: true,
      });

      console.log("🔁 Birth chart regeneration requested");
    } catch (err) {
      console.error("❌ Failed to regenerate birth chart", err);
      setBirthChartError("generation_failed");
      setBirthChartLoading(false);
    }
  };

  /**
   * contextValue is memoized with useMemo to prevent unnecessary re-renders of context consumers.
   * It only updates when any of the dependencies change, improving performance.
   */
  const contextValue = useMemo(() => ({
    authUser,
    profile,
    initializing,
    birthChart,
    birthChartStatus,
    birthChartError,
    birthChartLoading,
    birthChartPremiumUnlocked,
    regenerateBirthChart,
    horoscopes: safeHoroscopes,
    horoscopeLoading,
    horoscopeReady, // ← ADD THIS
    dailyCards: safeDailyCards,
    cardsLoading,
    cardsReady, // ← ADD THIS
    availableDates,
    defaultDate,
    isAppReady,
  }), [
    authUser,
    profile,
    initializing,
    birthChart,
    birthChartStatus,
    birthChartError,
    birthChartLoading,
    birthChartPremiumUnlocked,
    horoscopeLoading,
    horoscopeReady, // ← ADD THIS
    cardsLoading,
    cardsReady, // ← ADD THIS
    availableDates,
    defaultDate,
    isAppReady,
    safeHoroscopes,
    safeDailyCards,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;