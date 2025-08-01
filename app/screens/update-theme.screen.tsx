// ChangeThemeScreen.tsx
import React, { useContext, useRef } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import HeaderNav from '../components/headerNav'
import { ThemeContext, Theme } from '../../themecontext';

export default function ChangeThemeScreen() {
  const { theme, setThemeKey, themes } = useContext(ThemeContext);
  const router = useRouter();
  const originalKey = useRef(theme.key);

  const handleSelect = (key: string) => setThemeKey(key);
  const handleApply = () => router.replace('/screens/profile.screen');
  const handleCancel = () => {
    setThemeKey(originalKey.current);
    router.replace('/screens/profile.screen');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderNav
        title="Change Theme"
        leftIconName="arrow-back"
        onLeftPress={handleCancel}
        rightLabel="Apply"
        onRightPress={handleApply}
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
                  { backgroundColor: item.colors.primary },
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
