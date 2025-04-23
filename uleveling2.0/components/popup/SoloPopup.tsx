/**
 * SoloPopup.tsx
 * ------------------------------------------------------------------
 * A gesture-free Solo-Leveling style pop-up window for React Native.
 * Uses:
 *   • react-native-modal for backdrop + native <Modal>
 *   • Reanimated 3 for the “iris-in / iris-out” animation
 *   • A ScrollView so tall content never pushes the bottom border off-screen
 *
 * Drop any JSX you want (title, body, Back / Next buttons) inside <SoloPopup>.
 * Everything between the blue top & bottom borders will animate together.
 */

import React, { ReactNode, useEffect } from 'react';
import { Dimensions, StyleSheet, ScrollView, Image, View } from 'react-native';
import Modal from 'react-native-modal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { verticalScale, moderateScale, scale } from '@/constants/scaling';

const BORDER_HEIGHT = moderateScale(30);     /* height of your PNG borders */
const DURATION      = 600;                   /* ms – open & close */
const { width }     = Dimensions.get('window');

interface SoloPopupProps {
  visible: boolean;          // show / hide the popup
  onClose: () => void;       // called when backdrop is tapped or .close() is triggered
  children: ReactNode;       // everything rendered inside the hologram
  widthPercent?: number;     // optional – default 0.85
}

export default function SoloPopup({
  visible,
  onClose,
  children,
  widthPercent = 0.85,
}: SoloPopupProps) {
  /* one shared value drives both open (0→1) and close (1→0) */
  const progress = useSharedValue(0);

  /* start / reverse animation whenever 'visible' changes */
  useEffect(() => {
    progress.value = withTiming(
      visible ? 1 : 0,
      {
        duration: DURATION,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      }
    );
  }, [visible]);

  /* style that mirrors Solo-Leveling window */
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { perspective: 1000 },
      { rotateX:  `${interpolate(progress.value, [0, 1], [-15, 0])}deg` },
      { scaleY :  progress.value },               // top & bottom grow from centre
    ],
  }));

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.75}
      useNativeDriver
      animationInTiming={0}           // we handle animation manually
      animationOutTiming={0}
      onBackdropPress={onClose}
      style={styles.wrapper}
    >
      <Animated.View style={[
        styles.shell,
        { width: width * widthPercent },
        sheetStyle,
      ]}>
        {/* BLUE TOP BORDER */}
        <Image
          source={require('@/assets/images/techno-border-top.png')}
          resizeMode="stretch"
          style={styles.topBorder}
        />

        {/* SCROLLABLE BODY – padding keeps content clear of borders */}
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>

        {/* BLUE BOTTOM BORDER */}
        <Image
          source={require('@/assets/images/techno-border-bottom.png')}
          resizeMode="stretch"
          style={styles.bottomBorder}
        />
      </Animated.View>
    </Modal>
  );
}

/* ------------------------- styles ------------------------- */
const styles = StyleSheet.create({
  wrapper: {                   // centres the modal
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shell: {                     // hologram frame
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  body: {                      // padding so text never overlaps borders
    paddingTop: BORDER_HEIGHT,
    paddingBottom: BORDER_HEIGHT,
    alignItems: 'center',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: BORDER_HEIGHT,
    zIndex: 10,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: BORDER_HEIGHT,
    zIndex: 10,
  },
});
