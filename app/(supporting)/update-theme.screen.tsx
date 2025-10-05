// ChangeThemeScreen.tsx
import React, { useContext, useRef, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme-context } from '@/app/theme-context'
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '@/firebaseConfig';
import { StatusBar } from 'expo-status-bar'; // added
import HeaderNav from '@/app/components/component-utils/header-nav';


type Params = {
  userID: string;
};

export default function ChangeThemeScreen() {
  const { theme, setThemeKey, themes } = useContext(theme-context);
  const router = useRouter();
  const originalKey = useRef<string | null>(null);
  const db = getFirestore();
  const params = useLocalSearchParams<Params>();

  // Set originalKey only once on mount
  useEffect(() => {
    if (originalKey.current === null) {
      originalKey.current = theme.key;
    }
  }, []);

  const handleSelect = (key: string) => setThemeKey(key);

  const handleApply = async () => {
    const userID = params.userID;
    console.log('Applying theme:', theme.key);
    // Add or update themeKey field in Firestore for this user
    if (userID) {
      console.log('User ID:', userID);
      try {
        await setDoc(
          doc(db, 'users', auth.currentUser!.uid),
          { themeKey: theme.key },
          { merge: true }
        ).finally(() => {
          // show success message
          console.log('Theme updated successfully');
        });
      } catch (err) {
        console.error('Failed to save themeKey to user doc:', err);
        // Optionally show an error message to the user here
        return;
      }
    }
    router.replace('/app/(supporting)/profile.screen');
  };

  const handleCancel = () => {
    if (originalKey.current) setThemeKey(originalKey.current);
    router.replace('/app/(supporting)/profile.screen');
  };

  // Helper to render background
  function renderBackground(children: React.ReactNode) {
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return (
        <ImageBackground
          source={theme.backgroundImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
      );
    }
    if (theme.backgroundType === 'gradient' && theme.gradient) {
      return (
        <LinearGradient
          colors={theme.gradient.colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: Math.cos((theme.gradient.angle ?? 0) * Math.PI / 180), y: Math.sin((theme.gradient.angle ?? 0) * Math.PI / 180) }}
          style={StyleSheet.absoluteFill}
        >
          {children}
        </LinearGradient>
      );
    }
    // fallback to solid color
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background }]}>
        {children}
      </View>
    );
  }

  return renderBackground(
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <HeaderNav
        title="Change Color Theme"
        leftIconName="arrow-back"
        onLeftPress={handleCancel}
        rightLabel="Apply"
        onRightPress={handleApply}
        backgroundColor={theme.colors.headerBg} 
        textColor={theme.colors.headerText}
      />

      <FlatList
        data={Object.values(themes)}
        keyExtractor={t => t.key}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => {
          const isSelected = item.key === theme.key;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleSelect(item.key)}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: item.colors.headerBg },
                  isSelected && { borderWidth: 2, borderColor: theme.colors.headerText },
                ]}
              />
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 16,
  },
  label: { fontSize: 16 },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 16,
    opacity: 0.2,
  },
});
