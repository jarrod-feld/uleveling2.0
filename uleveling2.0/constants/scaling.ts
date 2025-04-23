import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
// Adjust these based on your design mockup's screen size
const guidelineBaseWidth = 375; // e.g., iPhone X width
const guidelineBaseHeight = 812; // e.g., iPhone X height

/**
 * Scales a size based on the screen width relative to the guideline base width.
 * @param size The size to scale.
 * @returns The scaled size.
 */
const scale = (size: number): number => (width / guidelineBaseWidth) * size;

/**
 * Scales a size based on the screen height relative to the guideline base height.
 * @param size The size to scale.
 * @returns The scaled size.
 */
const verticalScale = (size: number): number => (height / guidelineBaseHeight) * size;

/**
 * Scales a size based on the screen width, but with a factor to moderate the scaling.
 * Good for things like font sizes or elements that shouldn't scale linearly.
 * @param size The size to scale.
 * @param factor The moderation factor (default: 0.5). Higher factor scales less.
 * @returns The moderately scaled size.
 */
const moderateScale = (size: number, factor: number = 0.5): number => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale }; 