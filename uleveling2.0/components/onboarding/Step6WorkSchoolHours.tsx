import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { OnboardingData } from '../../app/onboarding';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';

// Helper function to map string array to picker data format
const mapToPickerData = (arr: string[]) => arr.map(item => ({ value: item, label: item }));

// Data source for hours (0-24)
const HOURS_OPTIONS = Array.from({ length: 25 }, (_, i) => i.toString());
const hoursPickerData = mapToPickerData(HOURS_OPTIONS);

interface Step6WorkSchoolHoursProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  handleNext: () => void;
}

const Step6WorkSchoolHours: React.FC<Step6WorkSchoolHoursProps> = ({
  onboardingData,
  setOnboardingData,
  handleNext,
}) => {

  // Update state directly from picker
  const handleHoursSelection = (
    key: 'work' | 'school',
    item: { value?: string } | null | undefined
  ) => {
    const newValue = item?.value; // Extract value (string)
    if (newValue !== undefined) { 
      setOnboardingData(prev => ({
        ...prev,
        workSchoolHours: {
          ...prev.workSchoolHours,
          [key]: newValue, // Store the selected string value
        }
      }));
    }
  };

  // Define shared styles/props for consistency
  const pickerHeight = verticalScale(90); // Adjust overall picker height
  const pickerWidth = scale(80);

  // Render overlay function for WORK picker
  const renderWorkOverlay = () => {
    const workItemHeight = moderateScale(40); // Height passed to WheelPicker
    const halfItemHeight = workItemHeight / 2;
    const centerOffset = pickerHeight / 2; 
    const topPosition = centerOffset - halfItemHeight;
    const bottomPosition = centerOffset - halfItemHeight; // Measured from bottom edge, so same calc

    return (
      <View style={styles.overlayContainer} pointerEvents="none">
        {/* Position lines relative to the center based on item height */}
        <View style={[styles.highlightLine, { top: topPosition }]} />
        <View style={[styles.highlightLine, { bottom: bottomPosition }]} />
      </View>
    );
  };

  // Render overlay function for SCHOOL picker
  const renderSchoolOverlay = () => {
    const schoolItemHeight = moderateScale(45); // Height passed to WheelPicker
    const halfItemHeight = schoolItemHeight / 2;
    const centerOffset = pickerHeight / 2;
    const topPosition = centerOffset - halfItemHeight;
    const bottomPosition = centerOffset - halfItemHeight; // Measured from bottom edge

    return (
      <View style={styles.overlayContainer} pointerEvents="none">
        {/* Position lines relative to the center based on item height */}
        <View style={[styles.highlightLine, { top: topPosition }]} />
        <View style={[styles.highlightLine, { bottom: bottomPosition }]} />
      </View>
    );
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.labelText}>Hours per day spent on:</Text>
      {onboardingData.lifeStatus.working && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Work:</Text>
          <View style={[styles.pickerContainer, { height: pickerHeight, width: pickerWidth }]}>
            <WheelPicker
              data={hoursPickerData}
              value={onboardingData.workSchoolHours.work || '0'} // Default to '0' if null
              onValueChanged={({ item }) => handleHoursSelection('work', item)}
              itemHeight={moderateScale(40)} // Adjusted height
              itemTextStyle={styles.pickerItemText}
              style={{ width: '100%', height: pickerHeight }}
              renderOverlay={renderWorkOverlay}
            />
          </View>
        </View>
      )}
      {onboardingData.lifeStatus.school && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>School:</Text>
           <View style={[styles.pickerContainer, { height: pickerHeight, width: pickerWidth }]}>
             <WheelPicker
               data={hoursPickerData}
               value={onboardingData.workSchoolHours.school || '0'} // Default to '0' if null
               onValueChanged={({ item }) => handleHoursSelection('school', item)}
               itemHeight={moderateScale(45)} // Adjusted height
               itemTextStyle={styles.pickerItemText}
               style={{ width: '100%', height: pickerHeight }}
               renderOverlay={renderSchoolOverlay}
             />
           </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    inputContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: scale(15),
        paddingVertical: verticalScale(20),
        justifyContent: 'space-around', // Changed from space-between
       
    },
    labelText: {
        color: '#cccccc', // Lighter grey
        fontSize: moderateScale(16, 0.3), // Smaller font size
        marginBottom: verticalScale(20), // Reduced margin
        fontWeight: 'normal', // Normal weight
        textAlign: 'center',
        textShadowColor: 'rgba(204, 204, 204, 0.6)', // Dimmer shadow
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6, // Reduced radius
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%', // Increased width
        marginBottom: verticalScale(60), // Increased margin
    },
    inputLabel: {
        color: '#ccc',
        fontSize: moderateScale(16, 0.4),
        marginRight: scale(10),
        fontFamily: 'PublicSans-Regular',
    },
    pickerContainer: {
      position: 'relative', // For overlay
      height: verticalScale(80),
    },
    pickerItemText: {
      fontSize: moderateScale(18, 0.4),
      color: '#aaa',
      fontFamily: 'PublicSans-Regular',
    },
    pickerSelectedItemText: {
      fontSize: moderateScale(20, 0.4),
      color: '#ffffff',
      fontWeight: 'bold',
      textShadowColor: '#ffffff',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },
    overlayContainer: {
      ...StyleSheet.absoluteFillObject, 
      justifyContent: 'center',
      alignItems: 'center',
    },
    highlightLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: moderateScale(2),
      backgroundColor: '#ffffff',
    },
    overlaySelectedText: {
      fontSize: moderateScale(20, 0.4),
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    pickerActiveItemText: {
      fontSize: moderateScale(20, 0.4),
      color: '#fff',
      fontWeight: 'bold',
      fontFamily: 'PublicSans-Bold',
    },
});

export default Step6WorkSchoolHours;