import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Keep Animated import for now, but comment out usage
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
const ANIMATION_DURATION = 300; // Duration of slide/fade animation

// Define notification types
type NotificationType = 'stat' | 'quest';
export type QuestStatus = 'Completed' | 'Skipped' | 'Undone'; // Export this type

// Updated NotificationItem interface
export interface NotificationItem {
  id: string; 
  type: NotificationType;
  statLabel?: string; // Optional: only for 'stat' type
  amount?: number;    // Optional: only for 'stat' type
  questTitle?: string; // Optional: only for 'quest' type
  questStatus?: QuestStatus; // Optional: only for 'quest' type
}

interface NotificationPopupProps {
  // No props needed now
}

// Create a unique ID generator (simple example)
let notificationIdCounter = 0;
const generateNotificationId = () => `notif-${notificationIdCounter++}`;

// Rename component BACK to StatIncreasePopup
export default function StatIncreasePopup({ }: NotificationPopupProps) {
  const { notifications, clearNotifications } = useNotificationContext();

  const insets = useSafeAreaInsets();
  // Comment out animation shared values
  // const translateY = useSharedValue(-100); 
  // const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Comment out animated style generation
  /*
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
      top: insets.top + vs(10),
    };
  });
  */
  // Use a simple static style for now
  const staticStyle = {
      top: insets.top + vs(10),
      opacity: isVisible ? 1 : 0, // Control opacity with state
  };

  const hidePopup = useCallback(() => {
    // Comment out animation calls
    // translateY.value = withTiming(-100, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) });
    // opacity.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
    //   if (finished) { ... }
    // });
    // Directly set state and clear notifications
    setIsVisible(false);
    clearNotifications();
  // Comment out animation values from dependencies
  }, [clearNotifications]); 

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // Clear any existing timeout before evaluating conditions
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    if (notifications.length > 0 && !isVisible) {
      setIsVisible(true);
      // No animation calls for now
      timeoutId = setTimeout(hidePopup, POPUP_DURATION);
      timeoutRef.current = timeoutId; 

    } else if (notifications.length > 0 && isVisible) {
       // Already visible, just reset the timer
      timeoutId = setTimeout(hidePopup, POPUP_DURATION);
       timeoutRef.current = timeoutId;

    } else if (notifications.length === 0 && isVisible) {
      // Notifications cleared while visible, hide immediately
      // Existing timeout was already cleared above
      runOnJS(hidePopup)(); // Ensure hidePopup runs on JS thread if needed
    } else {
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
          clearTimeout(timeoutId);
      }
    };
  }, [notifications, isVisible, hidePopup]); // Dependencies remain the same for now

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  // Use regular View and static style for now
  return (
    <View style={[styles.container, staticStyle]}>
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
        </View>
      ))}
    </View>
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
}); 