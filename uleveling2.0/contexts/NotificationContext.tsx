import React, { createContext, useContext, ReactNode } from 'react';
import { useNotificationService as useNotificationServiceHook } from '@/services/NotificationService'; // Rename import
import { NotificationItem, QuestStatus } from '@/components/common/StatIncreasePopup'; // Use the original path

// Define the shape of the context data
interface NotificationContextType {
  notifications: NotificationItem[];
  addStatNotification: (statLabel: string, amount: number) => void;
  addQuestNotification: (questStatus: QuestStatus, questTitle: string) => void;
  clearNotifications: () => void;
}

// Create the context with a default undefined value
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

// Create the provider component
export function NotificationProvider({ children }: NotificationProviderProps) {
  // Use the hook internally to get the state and functions
  const notificationService = useNotificationServiceHook();

  // The value provided will be the object returned by the hook
  const value: NotificationContextType = {
    notifications: notificationService.notifications,
    addStatNotification: notificationService.addStatNotification,
    addQuestNotification: notificationService.addQuestNotification,
    clearNotifications: notificationService.clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to consume the context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
} 