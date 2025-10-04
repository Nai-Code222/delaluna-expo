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
import { scale, verticalScale } from '@/app/screen-utils/responsive';

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


// ...imports unchanged...

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
  container: { width: '90%' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2541',
    width: '100%',
  },
  inputWrapper: { position: 'relative' },
  input: {
    flex: 1, 
    backgroundColor: '#3A506B', 
    borderRadius: scale(24), 
    paddingHorizontal: scale(15), 
    color: '#fff', 
    height: verticalScale(35), 
    marginBottom: verticalScale(Platform.OS === 'ios' ? 10 : 5), 
    alignSelf: 'center', borderWidth: 1,
    borderColor: 'rgba(142, 68, 173, 0.6)',
  },
  clearBtn: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: 'rgba(255,255,255,0.65)',               // lighter “×”
    fontSize: 18,
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
