import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Dimensions,
} from "react-native";
import tzlookup from "@photostructure/tz-lookup";

type PhotonFeature = {
  properties: {
    name: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id: number;
  };
  geometry: { coordinates: [number, number] };
};

export type SelectedPlace = {
  label: string; // "Los Angeles, California, US"
  lat: number;
  lon: number;
  timezone: string;
};

interface EditProfileLocationAutocompleteProps {
  value: string;
  onChange: (text: string) => void;
  onSelect: (place: SelectedPlace) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  listStyle?: ViewStyle;
}

export default function EditProfileLocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter your birth city...",
  containerStyle,
  inputStyle,
  listStyle,
}: EditProfileLocationAutocompleteProps) {
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [showList, setShowList] = useState(false);
  const isSelecting = useRef(false);
  const blurTimeout = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);
  const AUTOCOMPLETE_WIDTH = Dimensions.get("window").width - 40;

  // 🌍 Fetch Photon suggestions
  async function fetchPhotonSuggestions(query: string) {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      const json = await res.json();
      setResults(json.features || []);
    } catch (err) {
      console.warn("⚠️ Photon fetch failed", err);
      setResults([]);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (showList && value.length >= 3) fetchPhotonSuggestions(value);
    }, 350);
    return () => clearTimeout(handler);
  }, [value, showList]);

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => {
      if (!isSelecting.current) setShowList(false);
    }, 150);
  };

  const handleSelectItem = (item: PhotonFeature) => {
    isSelecting.current = true;
    const { name, city, state, country } = item.properties;
    const label = [name, city, state, country].filter(Boolean).join(", ");
    const [lon, lat] = item.geometry.coordinates;

    let timezone = "UTC";
    try {
      timezone = tzlookup(lat, lon);
    } catch {}

    const selectedPlace: SelectedPlace = { label, lat, lon, timezone };

    // ⏳ Update local state only (don’t push to Firestore yet)
    onChange(label);
    onSelect(selectedPlace);
    setShowList(false);

    setTimeout(() => {
      isSelecting.current = false;
    }, 300);
  };

  return (
    <View
      style={[
        styles.container,
        { width: AUTOCOMPLETE_WIDTH, minHeight: 50 },
        containerStyle,
      ]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          setShowList(true);
        }}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={[styles.input, inputStyle]}
        onFocus={() => setShowList(true)}
        onBlur={handleBlur}
        autoCorrect={false}
        keyboardType="default"
      />

      {showList && results.length > 0 && (
        <View
          style={[
            styles.listContainer,
            {
              position: "absolute",
              top: 54,
              left: 0,
              width: "100%",
              zIndex: Platform.OS === "ios" ? 999 : 1,
            },
            listStyle,
          ]}
        >
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(item) => item.properties.osm_id.toString()}
            renderItem={({ item }) => {
              const { name, city, state, country } = item.properties;
              const label = [name, city, state, country]
                .filter(Boolean)
                .join(", ");
              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemText}>{label}</Text>
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 200 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(142, 68, 173, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 14,
  },
  listContainer: {
    backgroundColor: "rgba(20, 20, 35, 0.98)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(142, 68, 173, 0.4)",
    shadowColor: "#8E44AD",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 10,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  itemText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
