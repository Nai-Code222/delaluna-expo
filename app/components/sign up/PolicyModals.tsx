// components/PolicyModals.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import Markdown from 'react-native-markdown-display';


interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
  textContent?: string;
  title: string;
}


export function PolicyModal({
  visible,
  onClose,
  textContent,
  title,
}: PolicyModalProps) {
  const [content, setContent] = useState<string>('');

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.header}>
  <Text style={styles.title}>{title}</Text>
  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
    <Text style={styles.closeText}>Close</Text>
  </TouchableOpacity>
</View>


        {visible && textContent && (
          <ScrollView contentContainerStyle={styles.textContainer}>
            <Markdown style={markdownStyles}>
  {textContent}
</Markdown>

          </ScrollView>
        )}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  closeText: {
    color: '#0000EE', // ✅ match link color
    fontSize: 16,
    fontWeight: '500',
  },
  textContainer: {
    padding: 16,
  },
  textContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

import { TextStyle } from 'react-native';

const markdownStyles: { [key: string]: TextStyle } = {
  body: { color: '#333', fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, alignSelf: 'center', },
  heading2: { fontSize: 20, fontWeight: 'bold', marginTop: 16, alignSelf: 'center',  },
  heading3: { fontSize: 18, fontWeight: '600', marginTop: 12, alignSelf: 'center',  },
  strong: { fontWeight: 'bold' },
  link: { color: '#1C2541', textDecorationLine: 'underline' },
};

