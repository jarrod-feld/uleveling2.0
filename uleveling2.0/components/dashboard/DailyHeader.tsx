import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';
import HeaderTitleBox from '@/components/dashboard/header/HeaderTitleBox';
import TimerBar       from '@/components/dashboard/header/TimerBar';
import GoalsTitle     from '@/components/dashboard/header/GoalsTitle';

export default function DailyHeader() {
  return (
    <View style={styles.card}>
      <HeaderTitleBox />
      <TimerBar />
      <GoalsTitle />
      <Text style={styles.warn}>
        WARNING: Failure to complete a goal will result in a penalty.{ '\n'}
        Skip a goal to avoid penalty to Discipline Stat.
      </Text>
    </View>
  );
}

/* styles */
const FONT = { fontFamily:'PressStart2P' };
const styles = StyleSheet.create({
  card: {
    width: '90%',
    paddingHorizontal: s(12),
    paddingVertical: vs(14),
    marginHorizontal: s(20),
  },
  warn: {
    ...FONT,
    fontSize:s(8),
    color:'#ff3b3b',
    marginTop:vs(10),
    lineHeight:vs(10),
    textShadowColor: 'rgba(255, 59, 59, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    textAlign:'center',
  },
}); 