import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../constants/scaling';
import { OnboardingData } from '../../app/onboarding'; // Adjust path if needed
import TimePicker from './step5/TimePicker'; // Import the new component

// Helper to get parts from Date - Now includes all parts again
const getTimeParts = (date: Date | null | undefined) => {
    if (!date) {
        // Default to reasonable times if null
        return { hour: '7', minute: '00', period: 'AM' }; // Default wake time parts
    }
    let hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour; // Handle midnight/noon (0 -> 12)
    return { hour: hour.toString(), minute, period };
};

interface Step5SleepScheduleProps {
  onboardingData: OnboardingData;
  setOnboardingData: (updater: (prevData: OnboardingData) => OnboardingData) => void;
  handleNext: () => void;
}

const Step5SleepSchedule: React.FC<Step5SleepScheduleProps> = ({
  onboardingData,
  setOnboardingData,
  handleNext,
}) => {

  const currentWakeParts = getTimeParts(onboardingData.sleepWakeTime?.wake);
  const currentSleepParts = getTimeParts(onboardingData.sleepWakeTime?.sleep);

  // Function to update the Date object in the main state - Simplified
  const updateTime = (
    timeType: 'wake' | 'sleep',
    part: 'hour' | 'minute' | 'period',
    value: string | undefined
  ) => {
      if (value === undefined) return;

      setOnboardingData((prevData: OnboardingData) => {
          const existingTime = prevData.sleepWakeTime?.[timeType];
          const currentParts = getTimeParts(existingTime); // Get parts from existing Date or default

          const newParts = { ...currentParts, [part]: value };

          let hour24 = parseInt(newParts.hour, 10);
          if (newParts.period === 'PM' && hour24 !== 12) {
              hour24 += 12;
          } else if (newParts.period === 'AM' && hour24 === 12) {
              hour24 = 0; // Midnight case
          }

          // Create or update the Date object
          const newDate = existingTime ? new Date(existingTime) : new Date(); // Use existing date or create new
          newDate.setHours(hour24, parseInt(newParts.minute, 10), 0, 0);

          const updatedSleepWakeTime = {
              ...prevData.sleepWakeTime,
              // Ensure both wake and sleep exist in the object
              wake: timeType === 'wake' ? newDate : (prevData.sleepWakeTime?.wake ?? null),
              sleep: timeType === 'sleep' ? newDate : (prevData.sleepWakeTime?.sleep ?? null),
          };

          // Log the updated times whenever a picker changes
          console.log('Updated Sleep/Wake Times:', {
              wake: updatedSleepWakeTime.wake?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) ?? 'Not set',
              sleep: updatedSleepWakeTime.sleep?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) ?? 'Not set',
          });


          return {
              ...prevData,
              sleepWakeTime: updatedSleepWakeTime,
          };
      });
  };

  return (
    <View style={styles.contentWrapper}>
      <Text style={styles.labelText}>Typical Sleep Schedule:</Text>

      {/* Bedtime Section */}
      <View style={styles.timeSection}>
        <Text style={styles.pickerLabel}>Bedtime</Text>
        <TimePicker
            hour={currentSleepParts.hour}
            minute={currentSleepParts.minute}
            period={currentSleepParts.period}
            onTimeChange={(part, value) => updateTime('sleep', part, value)}
        />
      </View>

      {/* Wake-up Time Section */}
       <View style={styles.timeSection}>
        <Text style={styles.pickerLabel}>Wake-up</Text>
         <TimePicker
            hour={currentWakeParts.hour}
            minute={currentWakeParts.minute}
            period={currentWakeParts.period}
            onTimeChange={(part, value) => updateTime('wake', part, value)}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10), // Reverted padding
  },
  labelText: {
    color: '#cccccc',
    fontSize: moderateScale(16, 0.3),
    marginBottom: verticalScale(10), // Reverted margin
    fontWeight: 'normal',
    textAlign: 'center',
    textShadowColor: 'rgba(204, 204, 204, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  timeSection: {
      width: '100%',
      alignItems: 'center',
      marginBottom: verticalScale(10), // Reverted space between sections
  },
  pickerLabel: {
    color: '#cccccc',
    fontSize: moderateScale(14, 0.3),
    marginBottom: verticalScale(5), // Reverted margin
    textShadowColor: '#cccccc',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    fontFamily: 'PublicSans-Regular',
  },
  timePickerRow: {
    fontWeight: 'bold',
    marginHorizontal: scale(3),
    fontFamily: 'PublicSans-Bold',
  },
});

export default Step5SleepSchedule;