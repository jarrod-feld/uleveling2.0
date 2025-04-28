import { useState, useCallback } from 'react';
import { NotificationItem, QuestStatus } from '@/components/common/StatIncreasePopup';

// Re-initialize ID counter within the hook's scope if needed, or keep global
let notificationIdCounter = 0;
const generateNotificationId = () => `notif-${notificationIdCounter++}`;

// Define the maximum number of notifications to keep
const MAX_NOTIFICATIONS = 5; 

// Custom hook to manage notification state
export function useNotificationService() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Keep original for stat increases
  const addStatNotification = useCallback((statLabel: string, amount: number) => {
    if (amount > 0) { // Only positive stats for now
        console.log(`[useNotificationService] addStatNotification called: Label=${statLabel}, Amount=${amount}`);
        const newNotification: NotificationItem = {
            id: generateNotificationId(),
            type: 'stat', // Set type
            statLabel,
            amount,
        };
        setNotifications(prev => {
           let newState = [...prev, newNotification];
           if (newState.length > MAX_NOTIFICATIONS) {
               newState = newState.slice(-MAX_NOTIFICATIONS);
           }
           console.log(`[useNotificationService] Updated notifications state:`, JSON.stringify(newState));
           return newState;
        });
    }
  }, []);

  // New function for quest status notifications
  const addQuestNotification = useCallback((questStatus: QuestStatus, questTitle: string) => {
    console.log(`[useNotificationService] addQuestNotification called: Status=${questStatus}, Title=${questTitle}`);
    const newNotification: NotificationItem = {
        id: generateNotificationId(),
        type: 'quest', // Set type
        questStatus,
        questTitle,
    };
    setNotifications(prev => {
       let newState = [...prev, newNotification];
       if (newState.length > MAX_NOTIFICATIONS) {
           newState = newState.slice(-MAX_NOTIFICATIONS);
       }
       console.log(`[useNotificationService] Updated notifications state:`, JSON.stringify(newState));
       return newState;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    console.log('[useNotificationService] clearNotifications called');
    setNotifications([]);
  }, []);

  // Return all functions
  return {
    notifications,
    addStatNotification, 
    addQuestNotification,
    clearNotifications,
  };
} 