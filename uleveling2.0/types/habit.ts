export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitLog {
  date: Date;
  notes?: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  streak: number; // Current consecutive streak
  logs: HabitLog[];
  goal?: number; // e.g., target number of times per week/month
} 