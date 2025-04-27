import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Picker from 'react-native-wheel-picker-expo'; // Import the specific picker
import { verticalScale as vs, moderateScale as ms, scale as s } from '@/constants/scaling';

interface Props {
  label: string;
  initialTime?: string; // Optional, defaults to 12:00 AM
  onTimeChange: (time: string) => void;
}

const COLOR = {
  white: '#ffffff',
  green: '#26e07f',
  disabled: '#aaaaaa',
  border: '#00ffff',
  bg: '#0d1b2a',
  highlight: '#00ffff30', // Lighter highlight for the picker indicator
};

// --- Data Sources for Pickers --- Needs string values for this library
const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

// --- Helper Functions --- (Keep the same logic, but ensure state uses strings)
function parseTime(timeString?: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  if (!timeString) return { hour: '12', minute: '00', period: 'AM' };
  try {
    const [time, periodStr] = timeString.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    const period = periodStr?.toUpperCase() === 'PM' ? 'PM' : 'AM';
    const hourNum = parseInt(hourStr, 10);
    const minuteNum = parseInt(minuteStr, 10);

    if (isNaN(hourNum) || isNaN(minuteNum) || hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
      throw new Error('Invalid time format');
    }
    return { hour: hourStr, minute: minuteStr.padStart(2, '0'), period };

  } catch (e) {
    console.error("Error parsing time:", timeString, e);
    return { hour: '12', minute: '00', period: 'AM' };
  }
}

function formatTime(hour: string, minute: string, period: 'AM' | 'PM'): string {
  return `${hour}:${minute} ${period}`;
}

// --- Component --- Uses Picker from react-native-wheel-picker-expo
export default function TimePickerTriple({ label, initialTime, onTimeChange }: Props) {
  const initialState = parseTime(initialTime);
  const [hour, setHour] = useState<string>(initialState.hour);
  const [minute, setMinute] = useState<string>(initialState.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialState.period);

  // Update parent component when time changes
  useEffect(() => {
    const newTime = formatTime(hour, minute, period);
    // console.log("[TimePickerTriple] Time Changed:", newTime); // Debug log
    onTimeChange(newTime);
  }, [hour, minute, period, onTimeChange]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        {/* Hour Picker */}
        <Picker
          haptics // Enable haptic feedback
          height={ms(120)} // Reduced height
          width={s(65)}   // Slightly reduced width
          initialSelectedIndex={hours.indexOf(hour)}
          items={hours.map(h => ({ label: h, value: h }))}
          onChange={({ item }) => setHour(item.value)}
          backgroundColor={COLOR.bg}
          selectedStyle={{ borderColor: COLOR.border, borderWidth: 2 }} // Style the selected item indicator
        />
        <Text style={styles.separator}>:</Text>
        {/* Minute Picker */}
        <Picker
          haptics
          height={ms(120)} // Reduced height
          width={s(65)}   // Slightly reduced width
          initialSelectedIndex={minutes.indexOf(minute)}
          items={minutes.map(m => ({ label: m, value: m }))}
          onChange={({ item }) => setMinute(item.value)}
          backgroundColor={COLOR.bg}
          selectedStyle={{ borderColor: COLOR.border, borderWidth: 2 }}
        />
        {/* Period Picker */}
        <Picker
          haptics
          height={ms(120)} // Reduced height
          width={s(65)}   // Slightly reduced width
          initialSelectedIndex={periods.indexOf(period)}
          items={periods.map(p => ({ label: p, value: p }))}
          onChange={({ item }) => setPeriod(item.value as 'AM' | 'PM')}
          backgroundColor={COLOR.bg}
          selectedStyle={{ borderColor: COLOR.border, borderWidth: 2 }}
        />
      </View>
    </View>
  );
}

// --- Styles --- (Adjusted for react-native-wheel-picker-expo)
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: vs(10), // Reduced vertical margin
    width: '90%',
  },
  label: {
    fontFamily: 'PressStart2P',
    fontSize: ms(12), // Reduced label font size
    color: COLOR.white,
    marginBottom: vs(8), // Reduced bottom margin
    alignSelf: 'flex-start',
    marginLeft: '5%',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: ms(90), // Match reduced picker height
    overflow: 'hidden',
  },
  // Styles for item text within the picker
  itemText: {
    fontFamily: 'PressStart2P',
    fontSize: ms(18), // Reduced item font size
    color: COLOR.disabled,
    textAlign: 'center',
  },
  itemTextSelected: {
    color: COLOR.white,
    fontFamily: 'PressStart2P',
  },
  separator: {
    fontFamily: 'PressStart2P',
    fontSize: ms(20), // Reduced separator font size slightly
    color: COLOR.white,
    textAlignVertical: 'center',
    paddingHorizontal: ms(3), // Reduced padding
    lineHeight: ms(120), // Match reduced picker height
  },
}); 