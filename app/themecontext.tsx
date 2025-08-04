// app/ThemeContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  text: string;
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
      headerBg:   '#513877',
      headerText: '#ffffff',
      primary:    '#BCA8F4',
      text:       '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: mainBg, // uses app/assets/images/mainBackground.png
    blendMode: 'difference',
  },
  yellow: {
    key: 'yellow',
    colors: {
      background: '#FDD017', // main color from gradient
      headerBg:   '#FDD017',
      headerText: '#ffffff',
      primary:    '#F4C430',
      text:       '#6B0F1A',
    },
    backgroundType: 'image',
    backgroundImage: yellowBg, // uses app/assets/images/yellowTheme.png
    blendMode: 'difference',
  },
  pink: {
    key: 'pink',
    colors: {
      background: '#B91372',
      headerBg:   '#B91372',
      headerText: '#ffffff',
      primary:    '#6B0F1A',
      text:       '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: pinkBg, // uses app/assets/images/pinkTheme.png
    blendMode: 'difference',
  },
  blue: {
    key: 'blue',
    colors: {
      background: '#000080',
      headerBg:   '#000080',
      headerText: '#ffffff',
      primary:    '#00BFFF',
      text:       '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: blueBg, // uses app/assets/images/blueTheme.png
    blendMode: 'difference',
  },
  green: {
    key: 'green',
    colors: {
      background: '#013220',
      headerBg:   '#013220',
      headerText: '#ffffff',
      primary:    '#39FF14',
      text:       '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: greenBg, // uses app/assets/images/greenTheme.png
    blendMode: 'difference',
  },
  orange: {
    key: 'orange',
    colors: {
      background: '#FFA500',
      headerBg:   '#FFA500',
      headerText: '#ffffff',
      primary:    '#E76D2C',
      text:       '#ffffff',
    },
    backgroundType: 'image',
    backgroundImage: orangeBg, // uses app/assets/images/orangeTheme.png
    blendMode: 'difference',
  },
  red: {
    key: 'red',
    colors: {
      background: '#D3011C',
      headerBg:   '#D3011C',
      headerText: '#ffffff',
      primary:    '#65000B',
      text:       '#ffffff',
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
  setThemeKey: () => {},
  themes: allThemes,
});

// 5) Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  // Load theme key from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedKey = await AsyncStorage.getItem('themeKey');
        if (storedKey && allThemes[storedKey]) {
          setThemeKey(storedKey);
        }
      } catch (e) {
        // ignore error, fallback to default
      }
      setLoading(false);
    })();
  }, []);

  // Save theme key to AsyncStorage whenever it changes
  const setThemeKeySafe = (key: string) => {
    if (allThemes[key]) {
      setThemeKey(key);
      AsyncStorage.setItem('themeKey', key).catch(() => {});
    }
  };

  if (loading) {
    // Optionally, render nothing or a splash/loading screen
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

// Add a default export for ThemeProvider to satisfy the requirement
export default ThemeProvider;
