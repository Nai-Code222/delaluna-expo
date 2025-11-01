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
import DelalunaToggle from "./delaluna-toggle.component";
import LocationAutocomplete from "../sign-up/location-autocomplete";

type FieldType = "text" | "date" | "time" | "location";

interface FieldConfig {
    label: string;
    type?: FieldType;
    placeholder?: string;
    value?: string;
    hasUnknownToggle?: boolean;
}

interface DelalunaInputRowProps<T extends string | boolean | number = string | boolean | number> {
    fields: FieldConfig[];
    onChange: (values: Record<string, T>) => void;
    mode?: "new" | "edit";
}



export default function DelalunaInputRow({
    fields,
    onChange,
    mode = "new",
}: DelalunaInputRowProps) {
    const [formValues, setFormValues] = useState<Record<string, string>>(
        Object.fromEntries(
            fields.map((f) => [f.label, f.value || f.placeholder || ""])
        )
    );
    const [unknownStates, setUnknownStates] = useState<Record<string, boolean>>({});
    const [activePicker, setActivePicker] = useState<string | null>(null);

    /** handle text/date/time changes */
    const handleChange = (label: string, val: string) => {
        const updated = { ...formValues, [label]: val };
        setFormValues(updated);
        onChange({ ...updated, ...unknownStates });
    };

    /** handle “I don’t know” toggle */
    const handleUnknownToggle = (label: string, val: boolean) => {
        const newValue = val ? "I don't know" : "";
        const updated = { ...formValues, [label]: newValue };
        const newUnknown = { ...unknownStates, [label]: val };
        setFormValues(updated);
        setUnknownStates(newUnknown);
        onChange({ ...updated, ...newUnknown });
    };

    /** handle date selection */
    const handleDateConfirm = (label: string, date: Date) => {
        handleChange(label, date.toLocaleDateString());
        setActivePicker(null);
    };

    /** handle time selection */
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
                const isUnknown = unknownStates[field.label];

                return (
                    <View key={field.label} style={styles.row}>
                        {/* Label */}
                        <Text style={styles.label}>{field.label}</Text>

                        {/* Input types */}
                        {field.type === "date" ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => setActivePicker(field.label)}
                                    activeOpacity={0.7}
                                    style={styles.inputBox}
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
                                <TouchableOpacity
                                    onPress={() => setActivePicker(field.label)}
                                    activeOpacity={0.7}
                                    style={styles.inputBox}
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
                            <View style={{ flex: 1 }}>
                                <LocationAutocomplete
                                    value={isUnknown ? "I don't know" : value}
                                    onInputChange={(text) => handleChange(field.label, text)}
                                    onResultsVisibilityChange={() => { }}
                                    onSelect={(place) => {
                                        handleChange(field.label, place.label);
                                        onChange({
                                            ...formValues,
                                            [field.label]: place.label,
                                            birthLat: place.lat,
                                            birthLon: place.lon,
                                            birthTimezone: place.timezone,
                                        });
                                    }}
                                    onSubmitRequest={() => { }}
                                />
                            </View>
                        ) : (
                            <TextInput
                                value={value}
                                placeholder={field.placeholder}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                onChangeText={(t) => handleChange(field.label, t)}
                                style={styles.inputBox}
                            />
                        )}

                        {/* Toggle */}
                        {field.hasUnknownToggle && (
                            <DelalunaToggle
                                label="I don’t know"
                                value={!!isUnknown}
                                onToggle={(v) => handleUnknownToggle(field.label, v)}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

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
