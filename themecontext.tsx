// app/ThemeContext.tsx
import React, { createContext, useState, ReactNode } from 'react';

// 1) Define your Theme shape
export interface Theme {
  key: string;
  colors: {
    headerBg: string;
    headerText: string;
    background: string;
    primary: string;
    text: string;
  };
}

// 2) Inline your themes (you can move these out later if you like)
const allThemes: Record<string, Theme> = {
  default: {
    key: 'default',
    colors: {
      headerBg: '#513877',   // ← match your original
      headerText: '#fff',
      background: '#240046',
      primary: '#BCA8F4',    // ← match your original inactive tint
      text: '#fff',
    },
  },
  yellow: {
    key: 'yellow',
    colors: {
      headerBg: '#D4A017',
      headerText: '#FFF',
      background: '#C99B24',
      primary: '#F4D35E',
      text: '#FFF',
    },
  },
  green: {
    key: 'green',
    colors: {
      headerBg: '#2A9D8F',
      headerText: '#FFF',
      background: '#21867A',
      primary: '#8FCB9B',
      text: '#FFF',
    },
  },
  // …add more as needed
};

// 3) Create Context with defaults
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

// 4) Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<string>('default');

  const setThemeKeySafe = (key: string) => {
    if (allThemes[key]) setThemeKey(key);
  };

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
