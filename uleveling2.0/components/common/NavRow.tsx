import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { verticalScale, moderateScale, scale } from '@/constants/scaling';

interface Props {
  isStepOne: boolean;
  isLast   : boolean;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function NavRow({
  isStepOne, isLast, nextDisabled = false, backDisabled = false, onBack, onNext,
}: Props) {
  return (
    <View style={styles.row}>
      <NavButton
        label={isStepOne ? '[No]' : '[Back]'}
        colour="#ffffff"
        onPress={onBack}
        disabled={backDisabled}
      />
      {!isLast && (
        <NavButton
          label={isStepOne ? '[Yes]' : '[Next]'}
          colour="#00ff00"
          onPress={onNext}
          disabled={nextDisabled}
        />
      )}
    </View>
  );
}

function NavButton({
  label, colour, onPress, disabled = false,
}: { label: string; colour: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        { borderColor: colour },
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[
        styles.txt,
        { color: colour },
        disabled && styles.txtDisabled,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  btn: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderWidth: scale(2),
    borderRadius: moderateScale(5),
  },
  txt: {
    fontSize: moderateScale(12, 0.4),
    fontFamily: 'PressStart2P',
  },
  btnDisabled: { borderColor: '#555' },
  txtDisabled: { color: '#888' },
});