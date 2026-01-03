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

  dailyCards: Record<string, DailyDrawnTarotCard>;
  cardsLoading: boolean;

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
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SignupUserRecord | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [birthChart, setBirthChart] = useState<any | null>(null);
  const [birthChartStatus, setBirthChartStatus] = useState<string | null>(null);
  const [birthChartError, setBirthChartError] = useState<string | null>(null);
  const [birthChartLoading, setBirthChartLoading] = useState<boolean>(false);
  const [birthChartPremiumUnlocked, setBirthChartPremiumUnlocked] = useState<boolean>(false);
  const [horoscopes, setHoroscopes] =
    useState<Record<string, HoroscopeResult>>({});
  const [horoscopeLoading, setHoroscopeLoading] = useState(true);
  const [dailyCards, setDailyCards] =
    useState<Record<string, DailyDrawnTarotCard>>({});
  // --- Safe maps for downstream consumers (never undefined) ---
  const safeHoroscopes = horoscopes ?? {};
  const safeDailyCards = dailyCards ?? {};

  // --- Derived available dates and default date ---
  const availableDates = useMemo(() => {
    const hDates = Object.keys(safeHoroscopes);
    const cDates = Object.keys(safeDailyCards);
    return Array.from(new Set([...hDates, ...cDates])).sort();
  }, [safeHoroscopes, safeDailyCards]);

  const defaultDate = availableDates.at(-1) ?? null;

  // --- Single authoritative readiness flag ---
  const isAppReady =
    !!authUser &&
    !!profile &&
    availableDates.length > 0 &&
    !initializing;
  const [cardsLoading, setCardsLoading] = useState(true);
  const [horoscopeReady, setHoroscopeReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);

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
        setProfile(null);
        setHoroscopes({});
        setDailyCards({});
        setHoroscopeReady(false);
        setCardsReady(false);
        setInitializing(false); // ✅ logout is immediate
        if (unsubscribeProfile) unsubscribeProfile();
        return;
      }

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
        setBirthChartStatus(data.status ?? null);
        setBirthChartError(data.error ?? null);
        setBirthChartLoading(data.status && data.status !== "complete");
        setBirthChartPremiumUnlocked(!!data.premiumUnlocked);
      }, (err) => {
        console.warn("birth chart listener error:", err);
        setBirthChart(null);
        setBirthChartStatus(null);
        setBirthChartError("listener_error");
        setBirthChartLoading(false);
        setBirthChartPremiumUnlocked(false);
      });

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
            setCardsLoading(false);
            setCardsReady(true);
          } else {
            setCardsLoading(true);
            setCardsReady(false);
          }
        },
        (err) => {
          console.warn("cards listener error:", err);
          setDailyCards({});
          setCardsLoading(false);
          setCardsReady(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeChart) unsubscribeChart();
      if (unsubscribeHoroscope) unsubscribeHoroscope();
      if (unsubscribeCards) unsubscribeCards();
    };
  }, []);

  useEffect(() => {
    
    // Logged out → app ready immediately
    if (!authUser) {
      setInitializing(false);
      return;
    }

    // Defensive log if horoscope day exists without matching cards
    if (horoscopeReady && !cardsReady) {
      const horoscopeDates = Object.keys(safeHoroscopes);
      const cardDates = Object.keys(safeDailyCards);
      const missingCards = horoscopeDates.filter(date => !cardDates.includes(date));
      
    }

    // Logged in → wait for required data (both horoscopes and cards)
    if (profile && horoscopeReady && cardsReady) {
      console.log("✨ App READY (profile + horoscope + cards)");
      setInitializing(false);

      // Explicitly hide splash on iOS once app is truly ready
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authUser, profile, horoscopeReady, cardsReady, safeHoroscopes, safeDailyCards]);

  // TODO: TEMP: disable birth chart auto-routing during v1
  // useEffect(() => {
  //   if (!birthChartStatus) return;
  //   if (birthChartStatus === "placements_ready") {
  //     router.push("/birth-chart");
  //   }
  // }, [birthChartStatus]);

  // TODO: Trigger birthchart generate
  const regenerateBirthChart = () => {
    // placeholder: will trigger cloud function
    console.log("Regenerate birth chart requested");
  };

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
    dailyCards: safeDailyCards,
    cardsLoading,
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
    cardsLoading,
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