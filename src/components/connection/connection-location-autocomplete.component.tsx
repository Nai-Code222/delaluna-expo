import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import tzlookup from "@photostructure/tz-lookup";
import { scale, verticalScale } from "@/utils/responsive";

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
  value: string;
  onInputChange?: (text: string) => void;
  onResultsVisibilityChange?: (visible: boolean) => void;
  onSelect: (place: SelectedPlace) => void;
  onSubmitRequest?: () => void;
  defaultLocation?: SelectedPlace;
  disabled?: boolean; // ✅ NEW
}

const ConnectionLocationAutocomplete = forwardRef<
  { dismissSuggestions: () => void },
  LocationAutocompleteProps
>(
  (
    {
      value,
      onSelect,
      onResultsVisibilityChange,
      onInputChange,
      onSubmitRequest,
      defaultLocation,
      disabled = false, // ✅ default false
    },
    ref
  ) => {
    const [results, setResults] = useState<PhotonFeature[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);

    /** Expose dismiss */
    useImperativeHandle(ref, () => ({
      dismissSuggestions: () => {
        setShowResults(false);
        onResultsVisibilityChange?.(false);
      },
    }));

    useEffect(() => {
      if (disabled) {
        setResults([]);
        setShowResults(false);
        return;
      }

      const q = (value || "").trim();

      if (q.length < 3) {
        setResults([]);
        onResultsVisibilityChange?.(false);
        return;
      }

      onResultsVisibilityChange?.(true);

      const handler = setTimeout(() => {
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`)
          .then((res) => res.json())
          .then((json) => setResults(json.features || []))
          .catch(() => {});
      }, 300);

      return () => clearTimeout(handler);
    }, [value, disabled]);

    return (
      <View
        style={[
          styles.container,
          disabled && { opacity: 0.4 }, // fade effect
        ]}
        pointerEvents={disabled ? "none" : "auto"} // block touches
      >
        {/* INPUT */}
        <TextInput
          style={styles.input}
          placeholder="Type your birth city..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          editable={!disabled}
          value={value}
          onChangeText={(text) => {
            onInputChange?.(text);
            setShowResults(true);
            onResultsVisibilityChange?.(true);
          }}
          autoCorrect={false}
          returnKeyType={Platform.select({ ios: "done", android: "send" }) as any}
          onSubmitEditing={() => onSubmitRequest?.()}
        />

        {/* RESULTS LIST */}
        {showResults && results.length > 0 && !disabled && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.properties.osm_id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const { name, city, state, country } = item.properties;
              const label = [name, city, state, country].filter(Boolean).join(", ");

              return (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    const [lon, lat] = item.geometry.coordinates;
                    let timezone = "UTC";

                    try {
                      timezone = tzlookup(lat, lon);
                    } catch {}

                    onSelect({
                      label,
                      lat,
                      lon,
                      timezone,
                    });

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
);

export default ConnectionLocationAutocomplete;

/* Styles */
const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: verticalScale(10),
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  itemText: {
    color: "#FFFFFF",
  },
});
