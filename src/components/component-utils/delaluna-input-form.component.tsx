import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { scale, verticalScale, moderateScale } from "@/src/utils/responsive";
import ConnectionLocationAutocomplete from "../connection/connection-location-autocomplete.component";

export type FieldType = "text" | "date" | "time" | "location";

export interface FieldConfig {
  label: string;
  type: FieldType;
  placeholder?: string;
  value?: string | number;
  editable?: boolean;
}

export interface DelalunaInputRowProps {
  fields: FieldConfig[];
  onChange: (values: Record<string, any>) => void;
  onScrollToggle?: (enabled: boolean) => void;
}

export default function DelalunaInputRow({
  fields,
  onChange,
  onScrollToggle,
}: DelalunaInputRowProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.label, String(f.value ?? "")]))
  );

  const [activePicker, setActivePicker] = useState<string | null>(null);

  const handleChange = (label: string, val: string) => {
    const updated = { ...formValues, [label]: val };
    setFormValues(updated);
    onChange(updated);
  };

  const handleDateConfirm = (label: string, date: Date) => {
    handleChange(label, date.toLocaleDateString());
    setActivePicker(null);
  };

  const handleTimeConfirm = (label: string, date: Date) => {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    handleChange(label, `${h}:${m}`);
    setActivePicker(null);
  };

  return (
    <View style={styles.container}>
      {fields.map((field) => {
        const value = formValues[field.label];
        const isEditable = field.editable ?? true;

        return (
          <View key={field.label}>
            <View style={styles.row}>
              <Text style={styles.label}>{field.label}</Text>

              {/* DATE FIELD */}
              {field.type === "date" ? (
                <>
                  <TouchableOpacity
                    onPress={() => isEditable && setActivePicker(field.label)}
                    style={styles.inputBox}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.text, !value && { opacity: 0.6 }]}>
                      {value || field.placeholder || "Select date"}
                    </Text>
                  </TouchableOpacity>

                  {activePicker === field.label && (
                    <DateTimePickerModal
                      isVisible
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onConfirm={(d) => handleDateConfirm(field.label, d)}
                      onCancel={() => setActivePicker(null)}
                    />
                  )}
                </>
              ) : field.type === "time" ? (
                <>
                  {/* TIME FIELD */}
                  <TouchableOpacity
                    onPress={() => isEditable && setActivePicker(field.label)}
                    style={styles.inputBox}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.text, !value && { opacity: 0.6 }]}>
                      {value || field.placeholder || "Select time"}
                    </Text>
                  </TouchableOpacity>

                  {activePicker === field.label && (
                    <DateTimePickerModal
                      isVisible
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onConfirm={(d) => handleTimeConfirm(field.label, d)}
                      onCancel={() => setActivePicker(null)}
                    />
                  )}
                </>
              ) : field.type === "location" ? (
                // LOCATION AUTOCOMPLETE
                <View style={styles.inputBox}>
                  <ConnectionLocationAutocomplete
                    value={value}
                    onInputChange={(text) => handleChange(field.label, text)}
                    onResultsVisibilityChange={(visible) =>
                      onScrollToggle?.(!visible)
                    }
                    onSelect={(place) => {
                      handleChange(field.label, place.label);
                      onChange({
                        ...formValues,
                        [field.label]: place.label,
                        birthLat: place.lat,
                        birthLon: place.lon,
                        birthTimezone: place.timezone,
                      });
                      onScrollToggle?.(true);
                    }}
                  />
                </View>
              ) : (
                // NORMAL TEXT FIELD
                <TextInput
                  editable={isEditable}
                  value={value}
                  placeholder={field.placeholder}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  onChangeText={(t) => handleChange(field.label, t)}
                  style={[styles.inputBox, !isEditable && { opacity: 0.6 }]}
                />
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* 🎨 CLEAN STYLES — MATCH YOUR PURPLE THEME */
const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: verticalScale(12),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: scale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.6)",
  },
  label: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "700",
    flex: 0.9,
  },
  inputBox: {
    flex: 1.3,
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    paddingHorizontal: scale(10),
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
  },
});
