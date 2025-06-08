import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
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

interface LocationAutocompleteProps {
  /** Controlled text value */
  value: string;

  /** Called as the user types or the parent forces a new value */
  onInputChange: (text: string) => void;

  /** Emits true when the results list is visible, false when hidden */
  onResultsVisibilityChange?: (visible: boolean) => void; 

  /** Called when an item is tapped */
  onSelect: (item: PhotonFeature) => void;
}


export function LocationAutocomplete({
  value,
  onSelect,
  onResultsVisibilityChange,
  onInputChange, // New prop
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showResults, setShowResults] = useState<boolean>(true);

  useEffect(() => {
    if (!showResults || query.length < 3) {
      setResults([]);
      onResultsVisibilityChange?.(false); // Notify parent that results are hidden
      return;
    }
    onResultsVisibilityChange?.(true); // Notify parent that results are visible
    const timer = setTimeout(async () => {
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          query
        )}&limit=5`;
        const resp = await fetch(url);
        const json = await resp.json();
        setResults(json.features);
      } catch (e) {
        console.warn('Photon lookup failed', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, showResults]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your birth city…"
          placeholderTextColor="#fff"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowResults(true); // Show results when typing
            onResultsVisibilityChange?.(text.length > 0); // Notify parent about input state
            onInputChange?.(text); // Notify parent about input value
          }}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      {showResults && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.properties.osm_id.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const { name, city, state, country } = item.properties;
            const label = [name, city, state, country]
              .filter(Boolean)
              .join(', ');
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  setQuery(label); // Show selection in the input
                  setShowResults(false); // Hide the list
                  onInputChange?.(label); // Notify parent about the selected value
                }}
              >
                <Text style={styles.itemText}>{label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { width: '90%' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    alignContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#3A506B',
    color: '#fff',
    padding: 12,
    borderRadius: 24,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#5BC0BE',
    borderRadius: 24,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 18,
  },
  item: {
    padding: 12,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  itemText: { color: '#fff' },
});