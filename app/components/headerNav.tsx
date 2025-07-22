// components/HeaderNav.tsx

import React from 'react'
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

type HeaderNavProps = {
  title?: string
  leftIconName?: React.ComponentProps<typeof Ionicons>['name']
  leftLabel?: string
  onLeftPress?: () => void
  rightIconSource?: ImageSourcePropType
  rightLabel?: string
  onRightPress?: () => void
}

export default function HeaderNav({
  title,
  leftIconName,
  leftLabel,
  onLeftPress,
  rightIconSource,
  rightLabel,
  onRightPress,
}: HeaderNavProps) {
  return (
    <>
      {/* 1) just fill the notch/status-bar on iOS; harmless on Android */}
      <SafeAreaView edges={['top']} style={styles.safeArea} />

      {/* 2) the fixed-height nav bar */}
      <View style={styles.navBar}>
        {/* LEFT BUTTON (or placeholder) */}
        {leftIconName || leftLabel ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.sideButton}>
            {leftIconName && <Ionicons name={leftIconName} size={24} color="#fff" />}
            {leftLabel && <Text style={styles.buttonText}>{leftLabel}</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.sideButton} />
        )}

        {/* TITLE always flex:1 and textAlign:center */}
        {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titlePlaceholder} />}

        {/* RIGHT BUTTON (icon or label) or placeholder */}
        {rightIconSource || rightLabel ? (
          <TouchableOpacity onPress={onRightPress} style={styles.sideButton}>
            {rightIconSource && <Image source={rightIconSource} style={styles.icon} />}
            {rightLabel && <Text style={styles.buttonText}>{rightLabel}</Text>}
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
    backgroundColor: '#513877',
    width: '100%',
  },
  navBar: {
    height: 45,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#513877',
  },
  sideButton: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
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
    color: '#fff',
    fontSize: 16,

  },
})
