// components/HeaderNav.tsx

import React, { useContext } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { ThemeContext } from '../themecontext'

type HeaderNavProps = {
  title?: string
  leftIconName?: React.ComponentProps<typeof Ionicons>['name']
  leftLabel?: string
  onLeftPress?: () => void
  rightIconSource?: ImageSourcePropType
  rightLabel?: string
  onRightPress?: () => void

  /** Override the nav background (defaults to theme.colors.headerBg) */
  backgroundColor?: string
  /** Override the text/icon color (defaults to theme.colors.headerText) */
  textColor?: string
}

export default function HeaderNav({
  title,
  leftIconName,
  leftLabel,
  onLeftPress,
  rightIconSource,
  rightLabel,
  onRightPress,
  backgroundColor,
  textColor,
}: HeaderNavProps) {
  const { theme } = useContext(ThemeContext)

  // use provided props or fall back to theme
  const bg = backgroundColor ?? theme.colors.headerBg
  const tc = textColor       ?? theme.colors.headerText

  return (
    <>
      {/* notch / status‐bar filler */}
      <SafeAreaView
        edges={['top']}
        style={[styles.safeArea, { backgroundColor: bg }]}
      />

      {/* nav bar */}
      <View style={[styles.navBar, { backgroundColor: bg }]}>
        {/* Left */}
        {leftIconName || leftLabel ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.sideButton}>
            {leftIconName && (
              <Ionicons name={leftIconName} size={24} color={tc} />
            )}
            {leftLabel && (
              <Text style={[styles.buttonText, { color: tc }]}>
                {leftLabel}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.sideButton} />
        )}

        {/* Title */}
        {title ? (
          <Text style={[styles.title, { color: tc }]}>{title}</Text>
        ) : (
          <View style={styles.titlePlaceholder} />
        )}

        {/* Right */}
        {rightIconSource || rightLabel ? (
          <TouchableOpacity onPress={onRightPress} style={styles.sideButton}>
            {rightIconSource && (
              <Image
                source={rightIconSource}
                style={[styles.icon, { tintColor: tc }]}
              />
            )}
            {rightLabel && (
              <Text style={[styles.buttonText, { color: tc }]}>
                {rightLabel}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.sideButton} />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    width: '100%',
  },
  navBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  titlePlaceholder: {
    flex: 1,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: 16,
  },
})
