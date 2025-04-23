/* SoloPopup.tsx – v9
 * -------------------------------------------------------------
 *  • onLayout measures content ONCE per step (no flicker)
 *  • GIF is full height from start; wrapper reveals it
 *  • Drop-down opens in 150 ms, borders stay flush
 */

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Image, View, ImageBackground } from 'react-native';
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

const BORDER = moderateScale(30);     // blue PNG height
const DUR    = 150;                   // fast tween
const PAD_V  = verticalScale(20);
const { width } = Dimensions.get('window');

/* wrap ImageBackground so we can animate its style */
const AnimatedBG = Animated.createAnimatedComponent(ImageBackground);

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

  /* wrapper height & opacity */
  const clipStyle = useAnimatedStyle(() => ({
    height : interpolate(prog.value, [0, 1], [0, panelH.value]),
    opacity: prog.value,
  }));

  /* bottom border tracks bottom edge */
  const bottomBorder = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(prog.value, [0, 1], [0, panelH.value]) }],
  }));

  /* GIF is rendered at full height from the start */
  const gifStyle = useAnimatedStyle(() => ({ height: panelH.value }));

  if (!mounted) return null;

  return (
    <Modal
      isVisible={mounted}
      backdropOpacity={0.75}
      onBackdropPress={onClose}
      animationIn="none"
      animationOut="none"
      style={styles.modal}
      useNativeDriver
    >
      <View style={{ width: width * 0.85, alignItems: 'center' }}>
        {/* fixed top border */}
        <Image
          source={require('@/assets/img/techno-border-top.png')}
          style={styles.border}
          resizeMode="stretch"
        />

        {/* animated bottom border */}
        <Animated.Image
          source={require('@/assets/img/techno-border-bottom.png')}
          style={[styles.border, bottomBorder]}
          resizeMode="stretch"
        />

        {/* clipping wrapper grows to reveal full-height GIF */}
        <Animated.View style={[styles.panel, clipStyle]}>
          <AnimatedBG
            source={require('@/assets/img/techno-background.gif')}
            style={[styles.bg, gifStyle]}
            imageStyle={{ resizeMode: 'stretch', width: '100%', height: '100%' }}
          >
            {/* first (and only) height measure happens here */}
            <View onLayout={onLayout} style={styles.inner}>
              {children}
            </View>
          </AnimatedBG>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  modal : { margin: 0, justifyContent: 'center', alignItems: 'center' },
  border: { position: 'absolute', top: 0, width: '100%', height: BORDER, zIndex: 10 },
  panel : { width: '100%', overflow: 'hidden' },
  bg    : { width: '100%', alignItems: 'center' },
  inner : {
    paddingHorizontal: scale(12),
    paddingVertical  : PAD_V,
    alignItems: 'center',
  },
});
