import "expo-router/entry";
import { enableScreens } from "react-native-screens";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { handleNotificationDeepLink } from "@/utils/notification-routing";


enableScreens();

// Configure how notifications behave in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Deep-link handler for push notifications.
 * Listens when user taps a notification and navigates to the correct screen.
 */
function useNotificationDeepLinks() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (!data?.type) return;

        switch (data.type) {
          case "birthChartComplete":
            console.log("Chart is ready!");
            break;
          default:
            break;
        }
      }
    );

    return () => sub.remove();
  }, []);
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "SpaceMono-Regular": require("./assets/fonts/SpaceMono-Regular.ttf"),
    "Futura-Medium": require("./assets/fonts/Futura Md BT Medium.ttf"),
    "Futura-Light": require("./assets/fonts/Futura light.ttf"),
    "Futura-Book": require("./assets/fonts/Futura Bk BT Book.ttf"),
    "Futura-Generic": require("./assets/fonts/futura-generic.ttf"),
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handleNotificationDeepLink(data);
  });

  useNotificationDeepLinks();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }} />
    </NavigationContainer>
  );
}
