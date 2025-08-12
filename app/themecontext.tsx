// app/ThemeContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import { useAuth } from './backend/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '@/firebaseConfig';

// Import your default background image
const mainBg = require('./assets/images/mainBackground.png');
const blueBg = require('./assets/images/blueTheme.png');
const greenBg = require('./assets/images/greenTheme.png');
const orangeBg = require('./assets/images/orangeTheme.png');
const redBg = require('./assets/images/redTheme.png');
const yellowBg = require('./assets/images/yellowTheme.png');
const pinkBg = require('./assets/images/pinkTheme.png');

// 2) Define your Theme shape
export interface ThemeColors {
  background: ColorValue;             // solid background color for the theme
  headerBg: string;
  headerText: string;
  primary: string;
  activeTab: string;
  inactiveTabs: string;
  text: string;
  overlay?: string; // optional overlay color for themes that need it
}

export interface ThemeGradient {
  colors: string[];
  angle: number; // degrees
}

export interface Theme {
  key: string;
  colors: ThemeColors;
  backgroundType: 'image' | 'gradient';
  backgroundImage?: ImageSourcePropType;
  gradient?: ThemeGradient;
  blendMode: 'difference';
}

// 3) Declare all theme variants
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
    backgroundImage: mainBg, // uses app/assets/images/mainBackground.png
    blendMode: 'difference',
  },
  yellow: {
    key: 'yellow',
    colors: {
      background: '#b79606ff', // main color from gradient
      headerBg: '#fbc810ff',
      headerText: '#fbfbfbff',
      primary: '#cda120ff',
      activeTab: '#fbfbfbff',
      inactiveTabs: '#ad881aff',
      text: '#e5e4e4ff',
    },
    backgroundType: 'image',
    backgroundImage: yellowBg, // uses app/assets/images/yellowTheme.png
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
    backgroundImage: pinkBg, // uses app/assets/images/pinkTheme.png
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
    backgroundImage: blueBg, // uses app/assets/images/blueTheme.png
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
    backgroundImage: greenBg, // uses app/assets/images/greenTheme.png
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
    backgroundImage: orangeBg, // uses app/assets/images/orangeTheme.png
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
    backgroundImage: redBg, // uses app/assets/images/redTheme.png
    blendMode: 'difference',
  },
};

// 4) Context definition
export interface ThemeContextType {
  theme: Theme;
  setThemeKey: (key: string) => void;
  themes: Record<string, Theme>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: allThemes.default,
  setThemeKey: () => { },
  themes: allThemes,
});

// 5) Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const db = getFirestore();

  // Load theme key from Firestore when user changes
  useEffect(() => {
    async function fetchTheme() {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
          const themeKeyFromDb = userDoc.exists() ? userDoc.data().themeKey : 'default';
          setThemeKey(themeKeyFromDb && allThemes[themeKeyFromDb] ? themeKeyFromDb : 'default');
        } catch (e) {
          setThemeKey('default');
        }
      } else {
        setThemeKey('default');
      }
      setLoading(false);
    }
    fetchTheme();
  }, [user]);

  // Save theme key to Firestore whenever it changes
  const setThemeKeySafe = async (key: string) => {
    if (allThemes[key]) {
      setThemeKey(key);
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser!.uid), { themeKey: key }, { merge: true });
        } catch (err) {
          console.error('Failed to persist theme key:', err);
        }
      }
    }
  };

  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: allThemes[themeKey],
        setThemeKey: setThemeKeySafe,
        themes: allThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// 6) Export themes map
export const themes = allThemes;

export default ThemeProvider;
