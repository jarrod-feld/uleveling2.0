export type QuestStatus = 'pending' | 'active' | 'completed' | 'failed';

export type StatCategory = 'STR' | 'INT' | 'VIT' | 'CHA' | 'DIS' | 'CRE' | 'CAR';

export interface QuestObjective {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  reward: { experience?: number; items?: string[] }; // Example reward structure
  deadline?: Date;
} 