/* SoloPopup.tsx – v10
 * -------------------------------------------------------------
 *  • Uses simple background/border styles instead of images
 *  • onLayout measures content ONCE per step (no flicker)
 *  • Drop-down opens in 150 ms
 */

import React, { ReactNode, useEffect, useRef, useState } from 'react';
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
import { scale, verticalScale, moderateScale } from '@/constants/scaling';

const DUR    = 150;                   // fast tween
const PAD_V  = verticalScale(10);
const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
  minHeight?: number;
  children: ReactNode;
}

export default function SoloPopup({
  visible,
  onClose,
  onClosed,
  minHeight = verticalScale(320),
  children,
}: Props) {
  const [mounted, setMounted] = useState(visible);

  /* height of interior panel (no borders) */
  const panelH = useSharedValue(minHeight);
  const prog   = useSharedValue(0);

  /* run onLayout only once per step to avoid post-open re-measuring */
  const measured = useRef(false);

  const onLayout = (e: any) => {
    if (measured.current) return;              // already measured
    measured.current = true;
    const h = e.nativeEvent.layout.height;
    const target = Math.max(minHeight, h + PAD_V * 2);
    panelH.value = target;
  };

  /* open / close lifecycle */
  useEffect(() => {
    measured.current = false;                  // reset for next step
  }, [children]);                              // new step children mounted

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
  }, [visible]);

  /* Animated style for the panel (height, opacity) */
  const animatedPanelStyle = useAnimatedStyle(() => ({
    height : interpolate(prog.value, [0, 1], [0, panelH.value]),
    opacity: prog.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      isVisible={mounted}
      backdropOpacity={0.75}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={{ width: width * 0.85, alignItems: 'center' }}>
        {/* Animated container with background and border */}
        <Animated.View style={[styles.panel, animatedPanelStyle]}>
          {/* Content area with layout measurement */}
          <View onLayout={onLayout} style={styles.inner}>
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
    backgroundColor: '#555555',
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(2),
    borderColor: '#FFFFFF',
  },
  inner : {
    paddingHorizontal: scale(12),
    paddingVertical  : PAD_V,
    alignItems: 'center',
    width: '100%',
  },
});
