import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, StyleSheet } from "react-native";
import ConnectionLocationAutocomplete from "./connection-location-autocomplete.component";
import DelalunaToggle from "../component-utils/delaluna-toggle.component";
import { scale, verticalScale, moderateScale } from "@/utils/responsive";

interface Props {
  value: string;
  onChange: (values: Record<string, any>) => void;
  onRequestDismiss?: () => void;         // ⭐ NEW — parent tap-away dismissal
}

const DEFAULT_PLACE = {
  label: "I don't know",
  backendLabel: "Greenwich, UK",
  lat: 51.4769,
  lon: 0.0005,
  timezone: "UTC",
};

const ConnectionsPlaceOfBirthField = forwardRef(
  ({ value, onChange, onRequestDismiss }: Props, ref) => {
    const [isUnknown, setIsUnknown] = useState(
      value?.toLowerCase()?.includes("i don't") ?? false
    );

    /** This ref controls the autocomplete’s dismissSuggestions()  */
    const autocompleteRef = useRef<{ dismissSuggestions: () => void }>(null);

    /** Allow parent to call dismissSuggestions() */
    useImperativeHandle(ref, () => ({
      dismissSuggestions: () => {
        autocompleteRef.current?.dismissSuggestions();
      },
    }));

    /** SELECT from suggestions */
    const handleSelect = (place: any) => {
      setIsUnknown(false);

      onChange({
        "Place of Birth": place.label,
        isPlaceOfBirthUnknown: false,
        birthLat: place.lat,
        birthLon: place.lon,
        birthTimezone: place.timezone,
      });

      // ⭐ Do NOT reopen suggestions after selecting
      autocompleteRef.current?.dismissSuggestions();
      onRequestDismiss?.();
    };

    /** TYPING in search */
    const handleInputChange = (text: string) => {
      if (isUnknown) setIsUnknown(false);

      onChange({
        "Place of Birth": text,
        isPlaceOfBirthUnknown: false,
      });
    };

    /** Toggle for "I don't know" */
    const handleToggle = (val: boolean) => {
      setIsUnknown(val);

      // Always dismiss results when toggling
      autocompleteRef.current?.dismissSuggestions();
      onRequestDismiss?.();

      if (val) {
        // UI shows "I don't know" — backend uses Greenwich default
        onChange({
          "Place of Birth": "I don't know",
          isPlaceOfBirthUnknown: true,
          birthLat: DEFAULT_PLACE.lat,
          birthLon: DEFAULT_PLACE.lon,
          birthTimezone: DEFAULT_PLACE.timezone,
        });
      } else {
        onChange({
          "Place of Birth": "",
          isPlaceOfBirthUnknown: false,
        });
      }
    };

    return (
      <View>
        {/* FIELD BOX */}
        <View style={styles.wrapper}>
          <View style={styles.row}>
            <Text style={styles.label}>Place of Birth</Text>

            <View style={styles.right}>
              <ConnectionLocationAutocomplete
                ref={autocompleteRef}
                value={isUnknown ? "I don't know" : value}
                disabled={isUnknown}
                onSelect={handleSelect}
                onInputChange={handleInputChange}
                onResultsVisibilityChange={() => {}} // optional no-op
                onSubmitRequest={() => autocompleteRef.current?.dismissSuggestions()}
              />
            </View>
          </View>
        </View>

        {/* I DON'T KNOW TOGGLE */}
        <View style={styles.toggleRow}>
          <DelalunaToggle
            label="I don't know"
            value={isUnknown}
            onToggle={handleToggle}
          />
        </View>
      </View>
    );
  }
);

/* Styles */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(5),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    flex: 0.9,
    color: "#FFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
  right: {
    flex: 1.3,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
    paddingLeft: scale(10),
    justifyContent: "center",
  },
  toggleRow: {
    alignSelf: "flex-end",
    marginTop: verticalScale(10),
    marginRight: scale(5),
  },
});

export default ConnectionsPlaceOfBirthField;
