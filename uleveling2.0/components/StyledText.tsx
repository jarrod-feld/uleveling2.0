import { Text, TextProps } from './Themed';
import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../constants/scaling';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}

const BORDER_COLOR = '#00ffff'; // Match popup border
const BUTTON_BG_COLOR = 'rgba(0, 30, 40, 0.7)'; // Dark translucent blue

// Example style for selectable options (like checkboxes, source buttons)
const selectableButtonStyle = {
  borderWidth: moderateScale(1.5),
  borderColor: BORDER_COLOR,
  backgroundColor: BUTTON_BG_COLOR, // Default background
  paddingVertical: verticalScale(12),
  paddingHorizontal: scale(20),
  borderRadius: moderateScale(4), // Less rounded corners
  marginBottom: verticalScale(12),
  width: '90%', // Adjust as needed
  alignItems: 'center',
  justifyContent: 'center',
};

const selectableButtonText = {
  color: BORDER_COLOR, // Cyan text
  fontSize: moderateScale(16, 0.4),
  fontWeight: 'bold',
  textAlign: 'center',
};

// Style for when the button is selected/active
const selectedButtonStyle = {
  backgroundColor: 'rgba(0, 255, 255, 0.3)', // Highlight background
  borderColor: '#00dddd', // Slightly darker cyan border
};

// Example style for action buttons (like "Next")
// Note: Applying this directly to the built-in Button component is limited.
// For full control, replace <Button> with <TouchableOpacity> + <Text>
const actionButtonStyle = { // Style for the TouchableOpacity container
  borderWidth: moderateScale(1.5),
  borderColor: BORDER_COLOR,
  backgroundColor: BUTTON_BG_COLOR,
  paddingVertical: verticalScale(12),
  paddingHorizontal: scale(30),
  borderRadius: moderateScale(4),
  marginTop: verticalScale(20), // Adjust spacing as needed
};

const actionButtonText = { // Style for the Text inside TouchableOpacity
  color: BORDER_COLOR,
  fontSize: moderateScale(16, 0.4),
  fontWeight: 'bold',
  textAlign: 'center',
};

// Style for disabled action buttons
const disabledActionButtonStyle = {
    borderColor: '#557777', // Dimmed border
    backgroundColor: 'rgba(0, 30, 40, 0.4)', // More transparent background
};

const disabledActionButtonText = {
    color: '#557777', // Dimmed text
};

const styles = StyleSheet.create({
  pickerItemText: {
    color: '#aaa', // Dimmer color for non-selected items
    fontSize: moderateScale(20, 0.4),
  },
  pickerActiveItemText: {
    color: '#fff', // Bright color for the selected item
    fontSize: moderateScale(24, 0.4),
    fontWeight: 'bold',
  },
});
