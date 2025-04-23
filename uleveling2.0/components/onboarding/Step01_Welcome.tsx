import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { verticalScale, moderateScale } from '@/constants/scaling';

export default function Step01_Welcome() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.txt}>
        You have acquired the qualifications{'\n'}
        to become the <Text style={styles.bold}>“Player”</Text>.{'\n'}
        Will you accept?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    minHeight: verticalScale(100),
    width: '90%', 
    alignItems: 'center' },
  txt: {
    color: '#ffffff',
    fontSize: moderateScale(18, 0.4),
    textAlign: 'center',
    lineHeight: verticalScale(30),
    textShadowColor: '#26c6ff',
    textShadowRadius: 8,
    fontFamily: 'PublicSans-Regular',
  },
  bold: { fontWeight: 'bold' },
});
