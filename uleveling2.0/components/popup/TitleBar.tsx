import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { verticalScale, scale, moderateScale } from '@/constants/scaling';

interface Props {
  text: string;
}

export default function TitleBar({ text }: Props) {
  return (
    <View style={styles.box}>
      <FontAwesome
        name="exclamation-circle"
        size={moderateScale(22)}
        color="#ffffff"
        style={{ marginRight: scale(10) }}
      />
      <Text style={styles.txt}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: moderateScale(1.5),
    borderColor: '#26c6ff',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(18),
    borderRadius: moderateScale(4),
    marginBottom: verticalScale(25),
    /* subtle outer glow */
    shadowColor: '#26c6ff',
    shadowOpacity: 0.9,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: 0 },
  },
  txt: {
    color: '#ffffff',
    fontSize: moderateScale(18, 0.4),
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'PublicSans-Bold',
    textShadowColor: '#26c6ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
