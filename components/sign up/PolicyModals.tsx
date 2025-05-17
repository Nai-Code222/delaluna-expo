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

interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
  uri?: string;
  localAsset?: any;
  title: string;
}

export function PolicyModal({
  visible,
  onClose,
  uri,
  localAsset,
  title,
}: PolicyModalProps) {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (localAsset) {
      (async () => {
        const [loaded] = await Asset.loadAsync(localAsset);
        const fileUri = loaded.localUri || loaded.uri;
        const text = await FileSystem.readAsStringAsync(fileUri || '');
        setContent(text);
      })();
    }
  }, [localAsset]);

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        {localAsset ? (
          <ScrollView contentContainerStyle={styles.textContainer}>
            <Text style={styles.textContent}>{content}</Text>
          </ScrollView>
        ) : (
          <WebView source={{ uri: uri || '' }} style={styles.webView} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#6FFFE9',
    fontSize: 16,
  },
  webView: {
    flex: 1,
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