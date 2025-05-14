import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';

export default function GoalsTitle() {
  return <Text style={styles.h}>Goals</Text>;
}

const FONT = { fontFamily: 'EuroStyle' };
const styles = StyleSheet.create({
  h: {
    ...FONT,
    fontSize: s(20),
    color: '#00ffff',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: vs(18),
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
}); 