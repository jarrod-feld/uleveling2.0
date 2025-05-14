import { useState, useCallback } from 'react';
import { NotificationItem, QuestStatus, NotificationType } from '@/components/common/StatIncreasePopup';

// Re-initialize ID counter within the hook's scope if needed, or keep global
let notificationIdCounter = 0;
const generateNotificationId = () => `notif-${notificationIdCounter++}`;

// Define the maximum number of notifications to keep
const MAX_NOTIFICATIONS = 5; 

// Custom hook to manage notification state
export function useNotificationService() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Helper to add notification and manage queue size
  const addNotification = useCallback((newNotification: Omit<NotificationItem, 'id'>) => {
      setNotifications(prev => {
          const notificationWithId: NotificationItem = { ...newNotification, id: generateNotificationId() };
          let newState = [...prev, notificationWithId];
          if (newState.length > MAX_NOTIFICATIONS) {
             newState = newState.slice(-MAX_NOTIFICATIONS);
          }
          return newState;
       });
  }, []);

  // Keep original for stat increases
  const addStatNotification = useCallback((statLabel: string, amount: number) => {
    if (amount > 0) { // Only positive stats for now
        addNotification({
            type: 'stat',
            statLabel,
            amount,
        });
    }
  }, [addNotification]);

  // New function for quest status notifications
  const addQuestNotification = useCallback((questStatus: QuestStatus, questTitle: string) => {
    addNotification({
        type: 'quest',
        questStatus,
        questTitle,
    });
  }, [addNotification]);

  // Function for achievement notifications
  const addAchievementNotification = useCallback((achievementTitle: string) => {
      addNotification({
          type: 'achievement',
          achievementTitle,
      });
  }, [addNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Return all functions
  return {
    notifications,
    addStatNotification, 
    addQuestNotification,
    addAchievementNotification,
    clearNotifications,
  };
} 