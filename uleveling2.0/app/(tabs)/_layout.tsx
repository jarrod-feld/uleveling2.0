import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import TabBar from '@/components/common/TabBar';
import { verticalScale as vs, moderateScale } from '@/constants/scaling';
import { useNotificationContext } from '@/contexts/NotificationContext';

import Dashboard     from '@/app/(tabs)/dashboard';
import Roadmap       from '@/app/(tabs)/roadmap';
import Stats         from '@/app/(tabs)/stats';
import Leaderboard   from '@/app/(tabs)/leaderboard';
import Achievements  from '@/app/(tabs)/achievements';
import StatIncreasePopup from '@/components/common/StatIncreasePopup';

const TAB_HEIGHT = vs(620);
const DUR = 170;
const { width } = Dimensions.get('window');

const routes = {
  dashboard   : Dashboard,
  roadmap     : Roadmap,
  stats       : Stats,
  leaderboard : Leaderboard,
  achievements: Achievements,
} as const;
export type TabKey = keyof typeof routes;

type AnimationState = 'idle' | 'closing' | 'opening';

export default function TabsLayout() {
  const [key, setKey] = useState<TabKey>('dashboard');
  const [targetKey, setTargetKey] = useState<TabKey | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const prog = useSharedValue(1);
  const isInitialMount = useRef(true);

  const { notifications } = useNotificationContext();

  useEffect(() => {
    if (animationState === 'closing') {
      prog.value = withTiming(0, { duration: DUR, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished && targetKey) {
          runOnJS(setKey)(targetKey);
          runOnJS(setTargetKey)(null);
          runOnJS(setAnimationState)('opening');
        }
      });
    } else if (animationState === 'opening') {
      prog.value = withTiming(1, { duration: DUR, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(setAnimationState)('idle');
        }
      });
    }
  }, [animationState, targetKey, prog]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, []);

  const change = (next: TabKey) => {
    if (key !== next && animationState === 'idle') {
      setTargetKey(next);
      setAnimationState('closing');
    }
  };

  const Current = routes[key];

  const animatedPanelStyle = useAnimatedStyle(() => {
    const height = interpolate(prog.value, [0, 1], [0, TAB_HEIGHT]);
    const opacity = interpolate(prog.value, [0, 0.5, 1], [0, 0.5, 1]);
    return { height, opacity };
  });

  const shouldRenderContent = animationState === 'idle' || animationState === 'opening';

  return (
    <>
      <View style={styles.root}>
        <View style={{ flex: 1 }} />
        <Animated.View style={[styles.panel, animatedPanelStyle]}>
          {shouldRenderContent && (
            <View style={styles.inner}><Current /></View>
          )}
        </Animated.View>
        <TabBar active={key} onChange={change} disabled={animationState !== 'idle'} />
      </View>
      <StatIncreasePopup />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  panel: {
    width: width * 0.9,
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#0d1b2a',
    borderWidth: moderateScale(4),
    borderColor: '#00ffff',
    marginBottom: vs(10),
  },
  inner: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: vs(10),
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
}); 