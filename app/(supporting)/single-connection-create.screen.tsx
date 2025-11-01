import React, { useContext, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ThemeContext } from "../theme-context";
import DelalunaContainer from "../components/component-utils/delaluna-container.component";
import useRenderBackground from "../hooks/useRenderBackground";
import DelalunaToggle from "../components/component-utils/delaluna-toggle.component";
import DelalunaInputRow from "../components/component-utils/delaluna-input-form.component";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import HeaderNav from "../components/component-utils/header-nav";


export default function SingleConnectionCreateScreen() {
  const { theme } = useContext(ThemeContext);
  const renderBackground = useRenderBackground();

  const [isMe, setIsMe] = useState(true);
  const nonUserLabelList: string[] = ["First Name", "Last Name", "Birthday", "Place of Birth", "Time of Birth"];
  const userLabelList: string[] = ["First Name", "Last Name", "Sun Sign Sign", "Moon Sign", "Rising Sign"];

  return renderBackground(
    
    <View style={styles.container}>
      <ExpoStatusBar style="light" />
            <HeaderNav
              title="New Connection"
              leftLabel="Cancel"
              rightLabel="Save"
              
            />
      <View style={styles.container}>
        <View style={styles.userRow}>
          <Text style={styles.text}>First Individual</Text>
          <View style={styles.toggleRow}>
            <DelalunaToggle
              label="Me"
              value={isMe}
              onToggle={(val) => setIsMe(val)}
            />
          </View>
          

        </View>
        <View style={styles.div}></View>

      </View>

      {/* 👥 Second Individual */}
      <View style={styles.container}>
        <View style={styles.userRow}>
          <Text style={styles.text}>Second Individual</Text>
        </View>
        <View style={styles.div}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    height: "100%",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 15
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  div: {
    backgroundColor: "rgba(255, 255, 255, 0.23)",
    height: "0.5%",
    width: "100%",
    borderRadius: 4,
  },
  header:{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 15
  }
});
