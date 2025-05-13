/* SoloPopup.tsx – v10
 * -------------------------------------------------------------
 *  • Uses simple background/border styles instead of images
 *  • onLayout measures content ONCE per step (no flicker)
 *  • Drop-down opens in 150 ms
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { verticalScale, moderateScale } from '@/constants/scaling';

const DUR    = 150;                   // fast tween
const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
  requiredHeight: number;
  children: ReactNode;
  disableBackdropClose?: boolean;
}

export default function SoloPopup({
  visible,
  onClose,
  onClosed,
  requiredHeight,
  children,
  disableBackdropClose = false,
}: Props) {
  const [mounted, setMounted] = useState(visible);

  const prog = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      prog.value = withTiming(1, { duration: DUR, easing: Easing.out(Easing.cubic) });
    } else {
      prog.value = withTiming(
        0,
        { duration: DUR, easing: Easing.in(Easing.cubic) },
        fin => {
          if (fin) {
            runOnJS(setMounted)(false);
            if (onClosed) runOnJS(onClosed)();
          }
        },
      );
    }
  }, [visible, onClosed]);

  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: interpolate(prog.value, [0, 1], [0, requiredHeight]),
  }));

  if (!mounted) return null;

  return (
    <Modal
      isVisible={mounted}
      backdropOpacity={0.75}
      onBackdropPress={disableBackdropClose ? undefined : onClose}
      style={styles.modal}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={DUR}
      animationOutTiming={DUR}
    >
      <View style={{ width: width * 0.85, alignItems: 'center' }}>
        <Animated.View style={[styles.panel, animatedPanelStyle]}>
          <View style={styles.inner}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  modal : { margin: 0, justifyContent: 'center', alignItems: 'center' },
  panel : {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0d1b2a', // Dark blue background
    borderWidth: moderateScale(4), // Thicker border
    borderColor: '#00ffff', // Bright cyan border
    borderRadius: moderateScale(12),
  },
  inner : {
    paddingHorizontal: moderateScale(12),
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
}); 