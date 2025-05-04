import { Goal } from './roadmapData'; // Import Goal type if needed for reference
import { StatCategory } from '@/types/quest'; // Import StatCategory

export interface Quest {
  id: string;
  title: string;
  description: string; // Add description field
  goalId: string; // Make goalId non-nullable
  stats: [StatCategory, StatCategory?]; // Rename icons to stats
  status: 'active' | 'completed' | 'skipped'; // Add status if needed based on previous context
  progress: { current: number; total: number }; // Revert: Make progress non-optional
  statIncrements: { category: StatCategory; amount: number }[]; // Explicit non-DIS increments
  disciplineIncrementAmount: number; // Make mandatory (remove ?)
  completedAt?: Date; // Add optional completion timestamp
}

// Updated Mock Quests with descriptions
export const mockDailyQuests: Quest[] = [
  // STR Goal (g1: Bench Press 100kg)
  { id: 'q1', title: 'Log 1 Strength Training Session', description: 'Record your workout details, focusing on weights and reps.', goalId: 'g1', stats: ['STR'], status: 'active', progress: { current: 0, total: 1 }, statIncrements: [{ category: 'STR', amount: 1 }], disciplineIncrementAmount: 1 },
  // INT Goal (g2: Learn TypeScript Basics)
  { id: 'q2', title: 'Study TypeScript for 30 minutes', description: 'Focus on understanding interfaces and types.', goalId: 'g2', stats: ['INT'], status: 'active', progress: { current: 0, total: 30 }, statIncrements: [{ category: 'INT', amount: 1 }], disciplineIncrementAmount: 1 },
  // STR & VIT Goal (g3: Run a 5k Marathon)
  { id: 'q3', title: 'Run 3 kilometers', description: 'Maintain a steady pace and track your time.', goalId: 'g3', stats: ['STR', 'VIT'], status: 'active', progress: { current: 0, total: 3 }, statIncrements: [{ category: 'STR', amount: 1 }, { category: 'VIT', amount: 1 }], disciplineIncrementAmount: 2 }, // Example: DIS +2
  // INT Goal (g4: Read "Clean Code")
  { id: 'q4', title: 'Read 10 pages of "Clean Code"', description: 'Take notes on key principles for writing maintainable code.', goalId: 'g4', stats: ['INT'], status: 'active', progress: { current: 0, total: 10 }, statIncrements: [{ category: 'INT', amount: 1 }], disciplineIncrementAmount: 1 },
  // VIT Goal (g5: Increase Sprint Speed)
  { id: 'q5', title: 'Complete 15-min Stretching Routine', description: 'Focus on dynamic stretches before activity or static after.', goalId: 'g5', stats: ['VIT'], status: 'active', progress: { current: 0, total: 15 }, statIncrements: [{ category: 'VIT', amount: 1 }], disciplineIncrementAmount: 1 },
  // CHA Goal (g6: Practice Public Speaking)
  { id: 'q6', title: 'Practice Presentation for 15 mins', description: 'Rehearse timings and delivery for upcoming presentation.', goalId: 'g6', stats: ['CHA'], status: 'completed', progress: { current: 15, total: 15 }, completedAt: new Date(Date.now() - 86400000), statIncrements: [{ category: 'CHA', amount: 1 }], disciplineIncrementAmount: 1 },
  // INT Goal (g7: Master Git Discipline) - DIS is implicit
  { id: 'q7', title: 'Review & Commit Code (1 PR/Commit)', description: 'Review code changes carefully and write a clear commit message.', goalId: 'g7', stats: ['INT'], status: 'active', progress: { current: 0, total: 1 }, statIncrements: [{ category: 'INT', amount: 1 }], disciplineIncrementAmount: 3 }, // Example: Only INT explicit, but DIS +3
  // CAR Goal (g8: Develop Networking Skills)
  { id: 'q8', title: 'Reach out to 1 new contact', description: 'Connect with someone new in your professional network.', goalId: 'g8', stats: ['CAR'], status: 'skipped', progress: { current: 0, total: 1 }, statIncrements: [{ category: 'CAR', amount: 1 }], disciplineIncrementAmount: 1 },
  // CRE Goal (g9: Learn UI Design Principles)
  { id: 'q9', title: 'Sketch 3 UI Ideas', description: 'Explore different layouts and interactions for a new feature.', goalId: 'g9', stats: ['CRE'], status: 'active', progress: { current: 1, total: 3 }, statIncrements: [{ category: 'CRE', amount: 1 }], disciplineIncrementAmount: 1 },
  // VIT Goal (g5: General Health)
  { id: 'q10', title: 'Drink 2 Liters of Water', description: 'Stay hydrated throughout the day for better health and focus.', goalId: 'g5', stats: ['VIT'], status: 'active', progress: { current: 1, total: 2 }, statIncrements: [{ category: 'VIT', amount: 1 }], disciplineIncrementAmount: 1 },
]; 