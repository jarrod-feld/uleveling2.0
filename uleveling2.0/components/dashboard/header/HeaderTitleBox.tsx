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

const FONT = { fontFamily: 'PressStart2P' };
const styles = StyleSheet.create({
  box: {
    
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: vs(6),
    paddingHorizontal: s(20),
    alignItems: 'center',
  },
  txt: {
    ...FONT,
    fontSize: s(20),
    color: '#fff',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
}); 