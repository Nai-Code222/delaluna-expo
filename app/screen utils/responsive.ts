// Temporary shim: migrate imports to src/utils/responsive then delete this file.
export * from '../../src/utils/responsive';

// Default export to satisfy expo-router's route expectation; renders nothing.
const ResponsiveShim = () => null;
export default ResponsiveShim;
// Base sizes from a common device (iPhone 14 / 390x844)
const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 600;

// Get screen dimensions (using React Native Dimensions API)
import { Dimensions } from 'react-native';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const scale = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
