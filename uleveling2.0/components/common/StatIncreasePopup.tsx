import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming, 
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale as s, verticalScale as vs, moderateScale as ms } from '@/constants/scaling';
import { useNotificationContext } from '@/contexts/NotificationContext';

const FONT_FAMILY = 'PressStart2P';
const POPUP_DURATION = 5000; // How long the popup stays visible
const ANIMATION_DURATION = 150; // Duration of slide/fade animation - Made faster
const INITIAL_TRANSLATE_Y = vs(-10); // Initial off-screen position (above) - Adjusted for shorter travel
const POPUP_TOP_OFFSET = vs(10); // Pre-calculated vertical offset for the top style

// Define notification types
export type NotificationType = 'stat' | 'quest' | 'achievement'; // Add achievement
export type QuestStatus = 'Completed' | 'Skipped' | 'Undone'; // Export this type

// Updated NotificationItem interface
export interface NotificationItem {
  id: string;
  type: NotificationType;
  statLabel?: string; // Optional: only for 'stat' type
  amount?: number;    // Optional: only for 'stat' type
  questTitle?: string; // Optional: only for 'quest' type
  questStatus?: QuestStatus; // Optional: only for 'quest' type
  achievementTitle?: string; // Optional: only for 'achievement' type
}

interface NotificationPopupProps {
  // No props needed now
}

// Create a unique ID generator (simple example)
// let notificationIdCounter = 0; // This will be managed by NotificationService
// const generateNotificationId = () => `notif-${notificationIdCounter++}`;

// Rename component BACK to StatIncreasePopup
export default function StatIncreasePopup({ }: NotificationPopupProps) {
  const { notifications, clearNotifications } = useNotificationContext();

  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(INITIAL_TRANSLATE_Y); 
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false); // Tracks if the component should render and manage timers
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      top: insets.top + POPUP_TOP_OFFSET, // Use pre-calculated offset
    };
  });

  const hidePopup = useCallback(() => {
    // Animate out
    translateY.value = withTiming(INITIAL_TRANSLATE_Y, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
      if (finished) {
        runOnJS(setIsVisible)(false); 
        runOnJS(clearNotifications)(); 
      }
    });
  }, [clearNotifications, translateY, opacity]); 

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (notifications.length > 0) {
      if (!isVisible) {
        runOnJS(setIsVisible)(true); 
        translateY.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
        opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
      } 
      timeoutRef.current = setTimeout(() => {
        runOnJS(hidePopup)();
      }, POPUP_DURATION);
    } else { 
      if (isVisible) {
        runOnJS(hidePopup)(); 
      } 
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notifications, isVisible, hidePopup, translateY, opacity]); 

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {notifications.map((notif) => (
        <View key={notif.id} style={styles.notificationRow}>
          {/* Conditional Rendering based on type */} 
          {notif.type === 'stat' && (
            <Text style={styles.textStat}>
              +{notif.amount} {notif.statLabel}
            </Text>
          )}
          {notif.type === 'quest' && (
            <Text style={styles.textQuest} numberOfLines={1} ellipsizeMode="tail">
              {notif.questStatus}: {notif.questTitle}
            </Text>
          )}
          {/* Add rendering for achievement type */}
          {notif.type === 'achievement' && (
            <Text style={styles.textAchievement} numberOfLines={1} ellipsizeMode="tail">
              Achievement Unlocked: {notif.achievementTitle}
            </Text>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 42, 53, 0.9)', // Use existing BG color
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: '#00ffff', // Cyan border
    shadowColor: '#00ffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 1000, // Ensure it's above other content
    maxWidth: '80%', // Prevent overly wide popups
  },
  notificationRow: {
    marginBottom: vs(4), // Add spacing between notifications
  },
  // Style for Stat notifications
  textStat: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(11),
    color: '#26e07f', // Green color for stats
    textAlign: 'center',
  },
  // Style for Quest notifications
  textQuest: {
    fontFamily: FONT_FAMILY,
    fontSize: ms(10),
    color: '#ffffff', // White color for quests
    textAlign: 'center',
  },
  // Style for Achievement notifications
  textAchievement: {
      fontFamily: FONT_FAMILY,
      fontSize: ms(10),
      color: '#ffd700', // Gold color for achievements
      textAlign: 'center',
  },
}); 