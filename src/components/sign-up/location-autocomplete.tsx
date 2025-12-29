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
import tzlookup from '@photostructure/tz-lookup';

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

export type SelectedPlace = {
  label: string;   // "Miami, Florida, US"
  lat: number;
  lon: number;
  timezone: string; // IANA
};

interface LocationAutocompleteProps {
  /** Controlled text value */
  value: string;

  /** Called as the user types or the parent forces a new value */
  onInputChange?: (text: string) => void;

  /** Emits true when the results list is visible, false when hidden */
  onResultsVisibilityChange?: (visible: boolean) => void;

  /** Called when an item is tapped */
  onSelect: (place: SelectedPlace) => void;

  /** Called when user presses Enter/Return on the keyboard */
  onSubmitRequest?: () => void;
}

export default function LocationAutocomplete({
  value,
  onSelect,
  onResultsVisibilityChange,
  onInputChange,
  onSubmitRequest,
}: LocationAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showResults, setShowResults] = useState<boolean>(true);

  useEffect(() => {
    const q = (value || '').trim();
    const idk = q.toLowerCase() === "i don't know" || q.toLowerCase() === 'i don’t know';

    if (!showResults || q.length < 3 || idk) {
      setResults([]);
      onResultsVisibilityChange?.(false);
      return;
    }

    onResultsVisibilityChange?.(true);
    const handler = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
        .then(res => res.json())
        .then(json => setResults(json.features || []))
        .catch(e => console.warn('Photon lookup failed', e));
    }, 300);
    return () => clearTimeout(handler);
  }, [value, showResults, onResultsVisibilityChange]);


  return (
    <View style={styles.container}>
      <View style={[styles.inputRow]}>
        <TextInput
          style={[styles.input, { paddingRight: 40 }]} // space for the clear button
          placeholder="Type your birth city…"
          placeholderTextColor="#fff"
          value={value}
          onChangeText={(text) => {
            onInputChange?.(text);
            setShowResults(true);
            onResultsVisibilityChange?.(text.length > 0);
          }}
          autoCorrect={false}
          onSubmitEditing={() => onSubmitRequest?.()}
          returnKeyType={Platform.select({ ios: 'done', android: 'send' }) as any}
          blurOnSubmit
          enablesReturnKeyAutomatically
        />

        {/* Custom light '×' clear */}
        {!!value?.length && (
          <TouchableOpacity
            onPress={() => {
              onInputChange?.('');              // just clear
              setResults([]);
              setShowResults(false);
              onResultsVisibilityChange?.(false);
            }}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>×</Text>
          </TouchableOpacity>
        )}

      </View>

      {showResults && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.properties.osm_id.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const { name, city, state, country } = item.properties;
            const label = [name, city, state, country].filter(Boolean).join(', ');
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  const [lon, lat] = item.geometry.coordinates;
                  let timezone = 'UTC';
                  try { timezone = tzlookup(lat, lon); } catch { }
                  onSelect({ label, lat, lon, timezone });
                  setShowResults(false);
                  onResultsVisibilityChange?.(false);
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
  container: {
    width: '93%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(142,68,173,0.6)',
    paddingHorizontal: 15,
    height: 48,
    width: '100%',
    position: 'relative'
  },
  inputWrapper: { position: 'relative' },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 0,
    fontSize: 16,
  },
  clearBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    fontWeight: '700',
  },
  item: {
    padding: 12,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  itemText: { color: '#fff' },
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     