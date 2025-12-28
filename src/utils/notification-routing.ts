// src/utils/notification-routing.ts

import { router } from "expo-router";

type NotificationData = {
  type?: string;
  userId?: string;
  [key: string]: any;
};

export function handleNotificationDeepLink(data: NotificationData) {
  if (!data?.type) return;

  switch (data.type) {
    case "birthChartComplete":
      router.push("/main/birth-chart");
      break;

    // Future:
    // case "compatibilityComplete":
    //   if (data.connectionId) {
    //     router.push(`/main/compatibility/${data.connectionId}`);
    //   }
    //   break;
    //
    // case "dailyTarotReady":
    //   router.push("/main/daily-tarot");
    //   break;
    //
    // case "dailyHoroscopeReady":
    //   router.push("/main/horoscope");
    //   break;

    default:
      break;
  }
}