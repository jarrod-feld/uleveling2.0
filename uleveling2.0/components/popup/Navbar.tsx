import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { verticalScale, moderateScale, scale } from '@/constants/scaling';

interface NavRowProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

export default function NavRow({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextDisabled = false,
}: NavRowProps) {
  const isFirst = currentStep === 1;
  const isLast  = currentStep === totalSteps;

  return (
    <View style={styles.row}>
      {!isFirst && (
        <NavButton
          label="[Back]"
          onPress={onBack}
        />
      )}

      {!isLast && (
        <NavButton
          label={isFirst ? '[Yes]' : '[Next]'}
          onPress={onNext}
          disabled={nextDisabled}
        />
      )}
    </View>
  );
}

/* -------- helper button -------- */
function NavButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[
        styles.txt,
        disabled && styles.txtDisabled,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginTop: verticalScale(25),
    marginBottom: verticalScale(10),
  },
  btn: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(20),
    borderWidth: 1,
    borderRadius: moderateScale(5),
    borderColor: '#00ffff',
  },
  txt: {
    fontSize: moderateScale(16, 0.4),
    fontWeight: 'bold',
    color: '#00ffff',
  },
  btnDisabled: { borderColor: '#555' },
  txtDisabled: { color: '#888' },
});
