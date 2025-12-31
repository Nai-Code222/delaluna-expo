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
  regenerateBirthChart: () => {},
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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeChart: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setInitializing(false);
        if (unsubscribeProfile) unsubscribeProfile();
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);

      unsubscribeProfile = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as SignupUserRecord) : null);
          setInitializing(false);
        },
        (err) => {
          console.warn("profile listener error:", err);
          setProfile(null);
          setInitializing(false);
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
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeChart) unsubscribeChart();
    };
  }, []);




  useEffect(() => {
    if (!birthChartStatus) return;
    if (birthChartStatus === "placements_ready") {
      router.push("/birth-chart");
    }
  }, [birthChartStatus]);

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
  }), [authUser, profile, initializing, birthChart, birthChartStatus, birthChartError, birthChartLoading, birthChartPremiumUnlocked]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;