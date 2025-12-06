import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  TextInputProps,
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
  disabled?: boolean;
  onFocus?: () => void;
  returnKeyType?: TextInputProps["returnKeyType"];
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
}

const ConnectionLocationAutocomplete = forwardRef<
  { dismissSuggestions: () => void; focus: () => void },
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
      disabled = false,
      onFocus,
      returnKeyType,
      blurOnSubmit,
      onSubmitEditing,
    },
    ref
  ) => {
    const [results, setResults] = useState<PhotonFeature[]>([]);
    const [showResults, setShowResults] = useState<boolean>(false);
    const textInputRef = useRef<TextInput>(null);

    // ⭐ prevents reopening suggestions after selecting a result
    const justSelectedRef = useRef(false);

    /* ------------------------------------------------------------------
     * EXPOSE DISMISS METHOD TO PARENT
     * ------------------------------------------------------------------*/
    useImperativeHandle(ref, () => ({
      dismissSuggestions: () => {
        setShowResults(false);
        onResultsVisibilityChange?.(false);
      },
      focus: () => {
        textInputRef.current?.focus();
      },
    }));

    /* ------------------------------------------------------------------
     * FETCH RESULTS (debounced)
     * ------------------------------------------------------------------*/
    useEffect(() => {
      if (disabled) {
        setResults([]);
        setShowResults(false);
        return;
      }

      const q = (value || "").trim();

      if (q.length < 3) {
        setResults([]);
        setShowResults(false);
        onResultsVisibilityChange?.(false);
        return;
      }

      // ⭐ Prevent suggestions from reopening immediately after selecting a place
      if (justSelectedRef.current) {
        justSelectedRef.current = false; // reset once suppressed
        return;
      }

      const handler = setTimeout(() => {
        fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q.toLowerCase())}&limit=8`)
          .then(async (res) => {
            const text = await res.text();
            try {
              return JSON.parse(text);
            } catch (err) {
              console.warn("❌ Photon returned non-JSON:", text.slice(0, 200));
              return { features: [] };
            }
          })
          .then((json) => {
            if (!json || !Array.isArray(json.features)) {
              console.warn("⚠️ Photon returned invalid structure:", json);
              setResults([]);
              setShowResults(false);
              onResultsVisibilityChange?.(false);
              return;
            }

            console.log("🌍 Photon results:", json.features.length);

            setResults(json.features as PhotonFeature[]);
            setShowResults(true);
            onResultsVisibilityChange?.(true);
          })
          .catch((err) => {
            console.warn("❌ Photon error:", err);
            setResults([]);
            setShowResults(false);
            onResultsVisibilityChange?.(false);
          });
      }, 250);

      return () => clearTimeout(handler);
    }, [value, disabled]);

    /* ------------------------------------------------------------------
     * LOCAL DISMISS ON BLUR
     * ------------------------------------------------------------------*/
    const handleBlur = () => {
      setShowResults(false);
      onResultsVisibilityChange?.(false);
    };

    /* ------------------------------------------------------------------
     * RENDER
     * ------------------------------------------------------------------*/
    return (
      <View
        style={[styles.container, disabled && { opacity: 0.4 }]}
        pointerEvents={disabled ? "none" : "auto"}
      >
        {/* INPUT FIELD */}
        <TextInput
          ref={textInputRef}
          style={styles.input}
          placeholder="Type your birth city..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          editable={!disabled}
          value={value}
          onChangeText={(text) => {
            onInputChange?.(text);
          }}
          onFocus={() => {
            onFocus?.();
            // Only show if results already fetched
            if (value && value.length >= 3 && results.length > 0) {
              setShowResults(true);
              onResultsVisibilityChange?.(true);
            }
          }}
          onBlur={handleBlur}
          autoCorrect={false}
          returnKeyType={
            returnKeyType ??
            (Platform.select({
              ios: "done",
              android: "send",
            }) as any)
          }
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={() => {
            onSubmitRequest?.();
            onSubmitEditing?.();
          }}
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

                    // Block next auto-fetch so suggestions don't reopen
                    justSelectedRef.current = true;

                    let timezone = "UTC";
                    try {
                      timezone = tzlookup(lat, lon);
                    } catch {}

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
);

export default ConnectionLocationAutocomplete;

/* Styles */
const styles = StyleSheet.create({
  container: { width: "100%" },
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
  itemText: { color: "#FFFFFF" },
});
