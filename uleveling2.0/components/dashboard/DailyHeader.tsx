import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';
import HeaderTitleBox from '@/components/dashboard/header/HeaderTitleBox';
import TimerBar       from '@/components/dashboard/header/TimerBar';
import GoalsTitle     from '@/components/dashboard/header/GoalsTitle';
import { X } from 'phosphor-react-native';
import { useAuth } from '@/contexts/UserContext';

export default function DailyHeader() {
  const { isWarningDismissedToday, dismissWarning } = useAuth();

  // --- Debug Log ---
  console.log(`[DailyHeader] Rendering - isWarningDismissedToday: ${isWarningDismissedToday}`);
  // -----------------

  return (
    <View style={styles.card}>
      <HeaderTitleBox />
      <TimerBar />
      <GoalsTitle />

      {!isWarningDismissedToday && (
        <View style={styles.warningBox}>
          <Text style={styles.warn}>
            WARNING: Failure to complete a goal will result in a penalty.{ '\n'}
            Skip a goal to avoid penalty to Discipline Stat.
          </Text>
          <Pressable onPress={dismissWarning} style={styles.closeButton}>
            <X size={s(12)} color="#ff3b3b" weight="bold" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

/* styles */
const FONT = { fontFamily:'TrajanPro-Bold' };
const styles = StyleSheet.create({
  card: {
    width: '90%',
    paddingHorizontal: s(12),
    paddingVertical: vs(14),
    marginHorizontal: s(20),
    alignItems: 'center',
   
    alignSelf: 'center',
  },
  warningBox: {
    marginTop: vs(10),
    padding: s(8),
    borderWidth: 1,
    borderColor: '#ff3b3b',
    backgroundColor: 'rgba(255, 59, 59, 0.1)',
    position: 'relative',
  },
  warn: {
    ...FONT,
    fontSize:s(8),
    color:'#ff3b3b',
    lineHeight:vs(10),
    textShadowColor: 'rgba(255, 59, 59, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    textAlign:'center',
    paddingRight: s(15),
  },
  closeButton: {
    position: 'absolute',
    top: s(5),
    right: s(5),
    padding: s(2),
  },
}); 