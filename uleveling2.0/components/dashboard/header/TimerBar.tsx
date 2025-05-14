import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet/*, ActivityIndicator*/ } from 'react-native';
import { Info } from 'phosphor-react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';
import ProgressWheel from './ProgressWheel';

// Helper function to format milliseconds into HH:MM:SS
function formatTime(ms: number): string {
  if (ms < 0) ms = 0; // Ensure time doesn't go negative
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// No longer needs a time prop
// interface Props { time: string }
export default function TimerBar(/*{ time }: Props*/) {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // Use 24 for midnight

     

      const totalDayMs = midnight.getTime() - startOfDay.getTime();
      const elapsedMs = now.getTime() - startOfDay.getTime();
      const diff = midnight.getTime() - now.getTime(); // Remaining time

      

      setTimeLeft(formatTime(diff));

      // Calculate and set progress (elapsed proportion)
      const elapsedProportion = Math.max(0, Math.min(1, elapsedMs / totalDayMs));
     
      setProgress(prevProgress => {
        if (Math.abs(prevProgress - elapsedProportion) > 0.0001) { 
            
        }
        return elapsedProportion;
      });
    };

    // Calculate immediately
    calculateTime();

    // Set up interval to update every second
    const timerId = setInterval(calculateTime, 1000);

    // Clear interval on unmount
    return () => clearInterval(timerId);
  }, []);

  return (
    <View style={styles.row}>
      {/* <ActivityIndicator size={s(28)} color="#ffffff" /> */}
      <ProgressWheel 
        size={s(28)} 
        strokeWidth={1}
        color="#ffffff"
        activeColor="#000000"
        progress={progress}
        segments={20}
      />
      <Text style={styles.time}>{timeLeft}</Text>
      <Info size={s(18)} color="#fff" style={styles.infoIcon} />
    </View>
  );
}

const FONT = { fontFamily: 'TrajanPro-Regular' };
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(17),
  },
  time: {
    ...FONT,
    fontSize: s(16),
    color: '#00ffff',
    marginLeft: s(10),
    minWidth: s(80),
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  infoIcon: {
    marginLeft: s(8),
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  }
}); 