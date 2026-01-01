import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { SignupUserRecord } from '@/services/finishUserSignup.service';
import { router } from "expo-router";

type AuthContextType = {
  authUser: User | null;
  profile: SignupUserRecord | null;        // replace with UserRecord type once ready
  initializing: boolean;      // true until BOTH auth + profile are loaded
  birthChart: any | null;
  birthChartStatus: string | null;
  birthChartError: string | null;
  birthChartLoading: boolean;
  birthChartPremiumUnlocked: boolean;
  regenerateBirthChart: () => void;
  horoscope: any | null;
  horoscopeLoading: boolean;
  dailyCards: any | null;
  cardsLoading: boolean;
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
  horoscope: null,
  horoscopeLoading: true,
  dailyCards: null,
  cardsLoading: true,
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
  const [horoscope, setHoroscope] = useState<any | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(true);
  const [dailyCards, setDailyCards] = useState<any | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [horoscopeReady, setHoroscopeReady] = useState(false);
  const [cardsReady, setCardsReady] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeChart: (() => void) | null = null;
    let unsubscribeHoroscope: (() => void) | null = null;
    let unsubscribeCards: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setInitializing(true);
      setAuthUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setHoroscope(null);
        setDailyCards(null);
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

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const horoscopeRef = doc(db, "users", firebaseUser.uid, "horoscope", today);

      unsubscribeHoroscope = onSnapshot(
        horoscopeRef,
        (snap) => {
          if (!snap.exists()) {
            setHoroscope(null);
            setHoroscopeLoading(true);
            return;
          }

          const data = snap.data();

          if (data?.status?.state === "complete" && data?.result) {
            console.log("🔮 Horoscope READY", {
              date: today,
              hasResult: true,
            });

            setHoroscope(data.result);
            setHoroscopeLoading(false);
            setHoroscopeReady(true); // ✅ READY ONLY AFTER CLEAN DATA
          }
        },
        (err) => {
          console.warn("horoscope listener error:", err);
          setHoroscope(null);
          setHoroscopeLoading(false);
        }
      );

      const cardsRef = doc(db, "users", firebaseUser.uid, "cards", today);

      unsubscribeCards = onSnapshot(
        cardsRef,
        (snap) => {
          if (!snap.exists()) {
            setDailyCards(null);
            setCardsLoading(true);
            return;
          }

          const data = snap.data();

          if (Array.isArray(data?.cards) && data.cards.length > 0) {
            console.log("🃏 Cards READY", {
              count: data.cards.length,
              date: today,
            });

            setDailyCards(data);
            setCardsLoading(false);
            setCardsReady(true);
          }
        },
        (err) => {
          console.warn("cards listener error:", err);
          setDailyCards(null);
          setCardsLoading(false);
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
    console.log("🧠 App readiness check", {
      authUser: !!authUser,
      profile: !!profile,
      horoscopeReady,
      cardsReady,
      initializing,
    });

    // Logged out → app ready immediately
    if (!authUser) {
      console.log("🚪 Logged out → app ready");
      setInitializing(false);
      return;
    }

    // Logged in → wait for required data
    if (profile && horoscopeReady && cardsReady) {
      console.log("✨ App READY (profile + horoscope + cards)");
      setInitializing(false);
    }
  }, [authUser, profile, horoscopeReady, cardsReady]);

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
    horoscope,
    horoscopeLoading,
    dailyCards,
    cardsLoading,
  }), [authUser, profile, initializing, birthChart, birthChartStatus, birthChartError, birthChartLoading, birthChartPremiumUnlocked, horoscope, horoscopeLoading, dailyCards, cardsLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;