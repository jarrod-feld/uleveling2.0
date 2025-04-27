import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';

export default function GoalsTitle() {
  return <Text style={styles.h}>Goals</Text>;
}

const FONT = { fontFamily: 'PressStart2P' };
const styles = StyleSheet.create({
  h: {
    ...FONT,
    fontSize: s(18),
    color: '#fff',
    textAlign: 'center',
    marginTop: vs(18),
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
}); 