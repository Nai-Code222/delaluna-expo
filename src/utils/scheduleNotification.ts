// src/utils/scheduleNotification.ts

import * as Notifications from "expo-notifications";

type ScheduleOptions = {
  title: string;
  body: string;
  data?: Record<string, string>;
  secondsFromNow: number;
};

export async function scheduleLocalNotification(options: ScheduleOptions) {
  const { title, body, data, secondsFromNow } = options;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
      repeats: false,
    },
  });
}