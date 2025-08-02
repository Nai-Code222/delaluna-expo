import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

type PhotonFeature = {
  properties: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id: number;
  };
  geometry: {
    coordinates: [number, number];
  };
};

interface EditProfileLocationAutocompleteProps {
  value: string;
  onInputChange: (text: string) => void;
  onSelect: (item: PhotonFeature) => void;
  error?: string | null;
  setError?: (err: string | null) => void;
  style?: any;
}

export default function EditProfileLocationAutocomplete({
  value,
  onInputChange,
  onSelect,
  error,
  setError,
  style,
}: EditProfileLocationAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!showResults || value.length < 3) {
      setResults([]);
      return;
    }
    const handler = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`)
        .then(res => res.json())
        .then(json => setResults(json.features))
        .catch(e => {});
    }, 300);
    return () => clearTimeout(handler);
  }, [value, showResults]);

  // Validation: show error if blurred and not selected
  useEffect(() => {
    if (touched && !value.trim()) {
      setError?.('Place of birth is required');
    } else {
      setError?.(null);
    }
  }, [touched, value, setError]);

  return (
    <View>
      <TextInput
        style={[styles.input, style]}
        placeholder="Type your birth city…"
        placeholderTextColor="#fff"
        value={value}
        onChangeText={text => {
          onInputChange(text);
          setShowResults(true);
          setTouched(false);
          setError?.(null);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => {
          setTouched(true);
          setShowResults(false);
          if (!value.trim()) setError?.('Place of birth is required');
        }}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {showResults && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.properties.osm_id.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const { name, city, state, country } = item.properties;
            const label = [name, city, state, country].filter(Boolean).join(', ');
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onInputChange(label);
                  onSelect(item);
                  setShowResults(false);
                  setTouched(true);
                  setError?.(null);
                }}
              >
                <Text style={styles.itemText}>{label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    ...Platform.select({
      ios: { height: 44 },
      android: { height: 48 },
    }),
  },
  item: {
    padding: 12,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  itemText: { color: '#fff' },
  errorText: {
    color: 'red',
    marginBottom: 16,
    marginTop: -8,
    marginLeft: 4,
  },
});