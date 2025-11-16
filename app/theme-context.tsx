// app/ThemeContext.tsx
import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../src/backend/auth-context';


// ===== Images =====
const deafult = require('@/assets/colors/default-theme.png');
const blueTheme = require('@/assets/colors/blue-theme.png');
const greenTheme = require('@/assets/colors/green-theme.png');
const orangeTheme = require('@/assets/colors/orange-theme.png');
const redTheme = require('@/assets/colors/red-theme.png');
const yellowTheme = require('@/assets/colors/yellow-theme.png');
const pinkTheme = require('@/assets/colors/pink-theme.png');

export interface Theme {
  key: string;
  colors: ThemeColors;
  backgroundType: 'image' | 'gradient';
  backgroundImage?: ImageSourcePropType;
  gradient?: ThemeGradient;
  blendMode: 'difference';
  isDark?: boolean;
}

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
    backgroundImage: deafult,
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
    backgroundImage: yellowTheme,
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
    backgroundImage: pinkTheme,
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
    backgroundImage: blueTheme,
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
    backgroundImage: greenTheme,
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
    backgroundImage: orangeTheme,
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
    backgroundImage: redTheme,
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

  const currentTheme = {
  ...allThemes[themeKey],
  isDark: (() => {
    const t = allThemes[themeKey];
    // 🌙 Simple heuristic: check brightness of background or header
    const bg = t.colors.background.toString().toLowerCase();
    const header = t.colors.headerBg.toString().toLowerCase();
    const darkColors = ["#000", "#1c2541", "#240046", "#013220", "#000080"];
    return darkColors.some((c) => bg.includes(c) || header.includes(c));
  })(),
};

  return (
<ThemeContext.Provider value={{ theme: currentTheme, themeKey, setThemeKey, themes: allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export map for pickers
export const themes = allThemes;
export default ThemeProvider;
