// components/ErrorModal.tsx
import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'

export default function AlertModal({
  visible,
  message,
  onClose,
}: {
  visible: boolean
  message: string
  onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={50} tint="light" style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.container}>
              <Text style={styles.title}>Error</Text>
              <Text style={styles.message}>{message}</Text>
              <TouchableOpacity onPress={onClose} style={styles.okButton}>
                <Text style={styles.okText}>OK</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  gradient: {
    padding: 24,
    borderRadius: 16,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  okButton: {
    backgroundColor: '#6FFFE9',
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  okText: {
    color: '#1C2541',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
