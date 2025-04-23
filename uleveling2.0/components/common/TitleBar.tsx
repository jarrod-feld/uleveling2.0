import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { scale, verticalScale, moderateScale } from '@/constants/scaling';

interface Props { text: string }

export default function TitleBar({ text }: Props) {
  return (
    <View style={styles.box}>
      <FontAwesome
        name="exclamation-circle"
        size={moderateScale(22)}
        color="#ffffff"
        style={{ marginRight: scale(8) }}
      />
      <Text style={styles.txt}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: '#ffffff',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(18),
    borderRadius: moderateScale(4),
    marginBottom: verticalScale(25),
    shadowColor: '#ffffff',
    shadowOpacity: 0.9,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: 0 },
    marginTop: verticalScale(20),   // ← tweak this number to taste

    /* subtle glow */
  },
  txt: {
    color: '#ffffff',
    fontSize: moderateScale(20, 0.4),
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'PublicSans-Bold',
    textShadowColor: '#26c6ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
