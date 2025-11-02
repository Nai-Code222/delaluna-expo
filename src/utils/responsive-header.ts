import { Dimensions, Platform } from "react-native";
import { verticalScale } from "@/src/utils/responsive";

const { height } = Dimensions.get("window");
const isSmallScreen = height < 750;

export const HEADER_HEIGHT = Platform.OS === "ios"
  ? verticalScale(isSmallScreen ? 85 : 95)
  : verticalScale(isSmallScreen ? 68 : 75);
