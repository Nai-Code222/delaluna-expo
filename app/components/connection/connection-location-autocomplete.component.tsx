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
import { scale, verticalScale } from '@/src/utils/responsive';
import DelalunaToggle from '../component-utils/delaluna-toggle.component';

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
  label: string;
  lat: number;
  lon: number;
  timezone: string;
};

interface LocationAutocompleteProps {
  /** Controlled text value */
  value: string;
  onInputChange?: (text: string) => void;
  onResultsVisibilityChange?: (visible: boolean) => void;
  onSelect: (place: SelectedPlace) => void;
  onSubmitRequest?: () => void;
  /** ✅ Optional default location for “I don’t know” */
  defaultLocation?: SelectedPlace;
}

export default function ConnectionLocationAutocomplete({
  value,
  onSelect,
  onResultsVisibilityChange,
  onInputChange,
  onSubmitRequest,
  defaultLocation,
}: LocationAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showResults, setShowResults] = useState<boolean>(true);
  const [isUnknown, setIsUnknown] = useState<boolean>(false);

  useEffect(() => {
    const q = (value || '').trim();
    const idk = q.toLowerCase() === "i don't know" || q.toLowerCase() === 'i don’t know';

    if (!showResults || q.length < 3 || idk || isUnknown) {
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
  }, [value, showResults, onResultsVisibilityChange, isUnknown]);

  /** ✅ Handle toggle click */
  const handleToggle = (val: boolean) => {
    setIsUnknown(val);

    if (val) {
      // Use default location if available
      if (defaultLocation) {
        onInputChange?.(defaultLocation.label);
        onSelect(defaultLocation);
      } else {
        onInputChange?.("I don't know");
      }
      setResults([]);
      setShowResults(false);
      onResultsVisibilityChange?.(false);
    } else {
      onInputChange?.('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Input field */}
      <View style={[styles.inputRow]}>
        <TextInput
          style={[
            styles.input,
            { paddingRight: 40, opacity: isUnknown ? 0.5 : 1 },
          ]}
          placeholder="Type your birth city…"
          placeholderTextColor="#fff"
          value={value}
          editable={!isUnknown}
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

        {/* Clear button */}
        {!!value?.length && !isUnknown && (
          <TouchableOpacity
            onPress={() => {
              onInputChange?.('');
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

      {/* ✅ I don’t know toggle */}
      <View style={styles.toggleWrapper}>
        <DelalunaToggle
          label="I don’t know"
          value={isUnknown}
          onToggle={handleToggle}
        />
      </View>

      {/* Autocomplete results */}
      {showResults && results.length > 0 && (
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
  container: { width: '100%' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: scale(25),
    paddingHorizontal: scale(15),
    color: '#fff',
    height: verticalScale(45),
    marginBottom: verticalScale(Platform.OS === 'ios' ? 10 : 5),
    alignSelf: 'center',
  },
  clearBtn: {
    marginLeft: 8,
    width: scale(25),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: scale(10),
    top: scale(25),
    marginTop: -15,
  },
  clearText: {
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    fontWeight: '700',
  },
  toggleWrapper: {
    alignSelf: 'flex-start',
    marginTop: verticalScale(2),
    marginBottom: verticalScale(8),
    marginLeft: scale(4),
  },
  item: {
    padding: 12,
    backgroundColor: '#1C2541',
    borderBottomWidth: 1,
    borderBottomColor: '#3A506B',
  },
  itemText: { color: '#fff' },
});
