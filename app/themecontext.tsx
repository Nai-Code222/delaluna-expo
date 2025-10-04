// app/ThemeContext.tsx
import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './backend/auth-context';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// ===== Images =====
const mainBg = require('./assets/images/mainBackground.png');
const blueBg = require('./assets/images/blueTheme.png');
const greenBg = require('./assets/images/greenTheme.png');
const orangeBg = require('./assets/images/orangeTheme.png');
const redBg = require('./assets/images/redTheme.png');
const yellowBg = require('./assets/images/yellowTheme.png');
const pinkBg = require('./assets/images/pinkTheme.png');

// ===== Types =====
export interface ThemeColors {
  background: ColorValue;
  headerBg: string;
  headerText: string;
  primary: string;
  activeTab: string;
  inactiveTabs: string;
  text: string;
  overlay?: string;
}
export interface ThemeGradient { colors: string[]; angle: number; }
export interface Theme {
  key: string;
  colors: ThemeColors;
  backgroundType: 'image' | 'gradient';
  backgroundImage?: ImageSourcePropType;
  gradient?: ThemeGradient;
  blendMode: 'difference';
}

// ===== Themes (unchanged) =====
const allThemes: Record<string, Theme> = {
  default: {
    key: 'default',
    colors: {
      background: '#240046',
      headerBg: '#513877',
      headerText: '#ffffff',
      primary: '#BCA8F4',
      activeTab: '#fbfbfbff',
      inactiveTabs: '#BCA8F4',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: mainBg,
    blendMode: 'difference',
  },
  yellow: {
    key: 'yellow',
    colors: {
      background: '#b79606ff',
      headerBg: '#fbc810ff',
      headerText: '#fbfbfbff',
      primary: '#cda120ff',
      activeTab: '#fbfbfbff',
      inactiveTabs: '#ad881aff',
      text: '#e5e4e4ff',
    },
    backgroundType: 'image',
    backgroundImage: yellowBg,
    blendMode: 'difference',
  },
  pink: {
    key: 'pink',
    colors: {
      background: '#B91372',
      headerBg: '#B91372',
      headerText: '#ffffff',
      primary: '#B91372',
      activeTab: '#ffffff',
      inactiveTabs: '#f79dd2ff',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: pinkBg,
    blendMode: 'difference',
  },
  blue: {
    key: 'blue',
    colors: {
      background: '#000080',
      headerBg: '#000080',
      headerText: '#ffffff',
      primary: '#00BFFF',
      activeTab: '#ffffff',
      inactiveTabs: '#9dd1f1ff',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: blueBg,
    blendMode: 'difference',
  },
  green: {
    key: 'green',
    colors: {
      background: '#013220',
      headerBg: '#013220',
      headerText: '#ffffff',
      primary: '#39FF14',
      activeTab: '#ffffff',
      inactiveTabs: '#98df8cff',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: greenBg,
    blendMode: 'difference',
  },
  orange: {
    key: 'orange',
    colors: {
      background: '#FFA500',
      headerBg: '#FFA500',
      headerText: '#ffffff',
      primary: '#E76D2C',
      activeTab: '#ffffff',
      inactiveTabs: '#a53e07ff',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: orangeBg,
    blendMode: 'difference',
  },
  red: {
    key: 'red',
    colors: {
      background: '#D3011C',
      headerBg: '#D3011C',
      headerText: '#ffffff',
      primary: '#D3011C',
      activeTab: '#ffffff',
      inactiveTabs: '#570510ff',
      text: '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: redBg,
    blendMode: 'difference',
  },
};

// ===== Storage keys & helpers =====
const GLOBAL_KEY = 'themeKey';
const UID_KEY = (uid: string) => `themeKey:uid:${uid}`;

export async function getCachedThemeForUid(uid: string): Promise<string | null> {
  try { return await AsyncStorage.getItem(UID_KEY(uid)); } catch { return null; }
}

// ===== Context =====
export interface ThemeContextType {
  theme: Theme;
  themeKey: string;
  setThemeKey: (key: string, uid?: string) => Promise<void>;
  themes: Record<string, Theme>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: allThemes.default,
  themeKey: 'default',
  setThemeKey: async () => {},
  themes: allThemes,
});

// ===== Provider =====
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const db = getFirestore();

  const [hydrated, setHydrated] = useState(false);
  const [themeKey, _setThemeKey] = useState<string>('default');

  // Set + persist (global + per-uid) and sync to Firestore (best effort)
  const setThemeKey = useCallback(
    async (key: string, uid?: string) => {
      if (!allThemes[key]) return;
      _setThemeKey(key);

      try {
        await AsyncStorage.setItem(GLOBAL_KEY, key);        // global fallback
        const u = uid ?? user?.uid;
        if (u) await AsyncStorage.setItem(UID_KEY(u), key); // per-uid cache
      } catch {}

      const targetUid = uid ?? user?.uid;
      if (targetUid) {
        try { await setDoc(doc(db, 'users', targetUid), { themeKey: key }, { merge: true }); } catch {}
      }
    },
    [db, user?.uid]
  );

  // Hydrate before first paint / when user changes:
  // 1) try per-uid cache, 2) Firestore, 3) global cache, 4) default
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let key = 'default';

      try {
        if (user?.uid) {
          const cachedUid = await AsyncStorage.getItem(UID_KEY(user.uid));
          if (cachedUid && allThemes[cachedUid]) {
            key = cachedUid; // instant, no flash
          } else {
            // fetch from Firestore (first login on this device)
            try {
              const snap = await getDoc(doc(db, 'users', user.uid));
              const k = snap.exists() ? String(snap.data().themeKey) : undefined;
              if (k && allThemes[k]) key = k;
            } catch {}
          }
        } else {
          const cachedGlobal = await AsyncStorage.getItem(GLOBAL_KEY);
          if (cachedGlobal && allThemes[cachedGlobal]) key = cachedGlobal;
        }
      } catch {}

      if (!cancelled) {
        _setThemeKey(key);
        setHydrated(true);
      }

      // Optional background sync: if we used cache, check Firestore and update for next time
      if (user?.uid) {
        getDoc(doc(db, 'users', user.uid))
          .then(snap => {
            const k = snap.exists() ? String(snap.data().themeKey) : undefined;
            if (k && allThemes[k] && k !== key && !cancelled) {
              _setThemeKey(k);
              AsyncStorage.setItem(UID_KEY(user.uid!), k).catch(() => {});
              AsyncStorage.setItem(GLOBAL_KEY, k).catch(() => {});
            }
          })
          .catch(() => {});
      }
    })();

    return () => { cancelled = true; };
  }, [user?.uid, db]);

  if (!hydrated) return null; // keeps splash showing until theme is ready

  return (
    <ThemeContext.Provider value={{ theme: allThemes[themeKey], themeKey, setThemeKey, themes: allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export map for pickers
export const themes = allThemes;
export default ThemeProvider;
