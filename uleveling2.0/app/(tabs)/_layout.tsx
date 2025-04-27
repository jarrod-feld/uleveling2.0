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

import Dashboard     from '@/app/(tabs)/dashboard';
import Roadmap       from '@/app/(tabs)/roadmap';
import Stats         from '@/app/(tabs)/stats';
import Leaderboard   from '@/app/(tabs)/leaderboard';
import Achievements  from '@/app/(tabs)/achievements';
import { UserProvider } from '@/contexts/UserContext';

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

  console.log(`-- TabsLayout Render -- Key: ${key}, Target: ${targetKey}, State: ${animationState}`);

  useEffect(() => {
    console.log(`Effect [animationState] triggered. State: ${animationState}`);
    if (animationState === 'closing') {
      console.log('  -> State=closing: Starting close animation (prog 1->0)');
      prog.value = withTiming(0, { duration: DUR, easing: Easing.in(Easing.cubic) }, (finished) => {
        console.log(`    -> Close Animation Finished: ${finished}`);
        if (finished && targetKey) {
          console.log(`       -> Setting key=${targetKey}, state=opening`);
          runOnJS(setKey)(targetKey);
          runOnJS(setTargetKey)(null);
          runOnJS(setAnimationState)('opening');
        }
      });
    } else if (animationState === 'opening') {
      console.log('  -> State=opening: Starting open animation (prog 0->1)');
      prog.value = withTiming(1, { duration: DUR, easing: Easing.out(Easing.cubic) }, (finished) => {
        console.log(`    -> Open Animation Finished: ${finished}`);
        if (finished) {
          console.log('       -> Setting state=idle');
          runOnJS(setAnimationState)('idle');
        }
      });
    }
  }, [animationState, targetKey, prog]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
        // Optional: Handle any logic needed after initial mount if state starts other than idle
        // Currently starts idle, so this isn't strictly needed
    }
  }, []);

  const change = (next: TabKey) => {
    console.log(`Change Function Called: next=${next}, currentKey=${key}, state=${animationState}`);
    if (key !== next && animationState === 'idle') {
      console.log(`  -> Starting change from ${key} to ${next}`);
      setTargetKey(next);
      setAnimationState('closing');
    } else {
      console.log('  -> Change ignored (already target key or animating)');
    }
  };

  const Current = routes[key];

  const animatedPanelStyle = useAnimatedStyle(() => {
    const height = interpolate(prog.value, [0, 1], [0, TAB_HEIGHT]);
    const opacity = interpolate(prog.value, [0, 0.5, 1], [0, 0.5, 1]);
    return { height, opacity };
  });

  const shouldRenderContent = animationState === 'idle' || animationState === 'opening';

  if (shouldRenderContent) {
    console.log(`+++ Preparing to render <Current /> component for key: ${key} (State: ${animationState}) +++`);
  }

  return (
    <View style={styles.root}>
      <UserProvider>
        <View style={{ flex: 1 }} />

        <Animated.View style={[styles.panel, animatedPanelStyle]}>
          {shouldRenderContent && (
            <View style={styles.inner}>
              <Current />
            </View>
          )}
        </Animated.View>

        <TabBar active={key} onChange={change} disabled={animationState !== 'idle'} />
      </UserProvider>
    </View>
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
  },
}); 