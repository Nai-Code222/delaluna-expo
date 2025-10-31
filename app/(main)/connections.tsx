import React, { useContext } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemeContext } from "../theme-context";
import AddConnectionButton from "../components/buttons/add-connection-button.component";
import DelalunaContainer from "../components/component-utils/delaluna-container.component";
import useRenderBackground from "../hooks/useRenderBackground";

export default function ConnectionsScreen() {
  const { theme } = useContext(ThemeContext);
  const goToNewConnectionScreen = () => router.replace("../(supporting)/single-connection-create.screen");
  const renderBackground = useRenderBackground();

  
  return renderBackground(
    <DelalunaContainer style={styles.centered}>
      <AddConnectionButton
        onPress={goToNewConnectionScreen}
      />
    </DelalunaContainer>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    flexDirection: "column", // 👈 stack icon above text
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
    height: "15%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(142, 68, 173, 0.60)",
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: "center",
    bottom: 20,
    paddingVertical: 10,
  },
  icon: {
    width: 40,
    height: 40,
    tintColor: "#fff", // optional for Delaluna glow effect
    resizeMode: "contain",
    marginBottom: 8, // space between icon and text
  },
  addText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
