import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale as s, verticalScale as vs } from '@/constants/scaling';

export default function HeaderTitleBox() {
  return (
    <View style={styles.box}>
      <Text style={styles.txt}>Daily Quest</Text>
    </View>
  );
}

const FONT = { fontFamily: 'TrajanPro-Bold' };
const styles = StyleSheet.create({
  box: {
    paddingVertical: vs(6),
    paddingHorizontal: s(20),
    alignItems: 'center',
  },
  txt: {
    ...FONT,
    fontSize: s(24),
    color: '#00ffff',
    textShadowColor: 'rgba(0, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
}); 