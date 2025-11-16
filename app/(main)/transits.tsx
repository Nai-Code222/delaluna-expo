import React, { useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeContext } from "../theme-context";
import ExpandableDelalunaContainer from "../../src/components/component-utils/expandable-delaluna-container.component";
import useRenderBackground from "@/hooks/useRenderBackground";
import { scale, verticalScale } from "@/utils/responsive";
export default function TransitsScreen() {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const renderBackground = useRenderBackground();

  const fakeTransits: any[] = []; // aTODO  replace with Firestore or Gemini data later

  return renderBackground(
    <ScrollView
      style={[
        styles.scrollView,
        {
          paddingTop:
            Platform.OS === "android" ? insets.top + 12 : insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
      contentContainerStyle={[
        styles.content,
        fakeTransits.length === 0 && styles.centerContent,
      ]}
    >
      {fakeTransits.length === 0 ? (
        <Text style={styles.noDataText}>No transits available.</Text>
      ) : (
        fakeTransits.map((transit, index) => (
          <ExpandableDelalunaContainer
            key={index}
            title={transit.title}
            subtitle={transit.date}
            expandedContent={
              <View>
                <Text style={styles.expandedText}>{transit.description}</Text>
              </View>
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: scale(16),
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    color: "#FFFFFF",
    fontSize: scale(16),
    opacity: 0.6,
    textAlign: "center",
  },
  expandedText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    lineHeight: verticalScale(22),
    fontWeight: "400",
    textAlign: "left",
    opacity: 0.9,
  },
});
