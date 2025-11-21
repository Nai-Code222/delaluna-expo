import * as Localization from "expo-localization";

const getTimezone = () => {
  const calendars = Localization.getCalendars();

  const tz =
    calendars?.[0]?.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  return tz;
};

export default getTimezone;
