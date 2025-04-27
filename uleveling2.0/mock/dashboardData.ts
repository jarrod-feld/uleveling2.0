import { Goal } from './roadmapData'; // Import Goal type if needed for reference

export interface Quest {
  id: string;
  title: string;
  goalId: string; // Make goalId non-nullable
  icon: 'brain' | 'dumbbell' | 'heart'; // Assuming these are the possible icons
  status: 'active' | 'completed' | 'skipped'; // Add status if needed based on previous context
  progress: { current: number; total: number }; // Add progress property
}

// Updated Mock Quests with specific metrics
export const mockDailyQuests: Quest[] = [
  // STR Goal (g1: Bench Press 100kg)
  { id: 'q1', title: 'Log 1 Strength Training Session', goalId: 'g1', icon: 'dumbbell', status: 'active', progress: { current: 0, total: 1 } }, // Metric: 1 session
  // INT Goal (g2: Learn TypeScript Basics)
  { id: 'q2', title: 'Study TypeScript for 30 minutes', goalId: 'g2', icon: 'brain', status: 'active', progress: { current: 0, total: 30 } }, // Metric: 30 minutes
  // STR Goal (g3: Run a 5k Marathon)
  { id: 'q3', title: 'Run 3 kilometers', goalId: 'g3', icon: 'dumbbell', status: 'active', progress: { current: 0, total: 3 } }, // Metric: 3 kilometers
  // INT Goal (g4: Read "Clean Code")
  { id: 'q4', title: 'Read 10 pages of "Clean Code"', goalId: 'g4', icon: 'brain', status: 'active', progress: { current: 0, total: 10 } }, // Metric: 10 pages
  // VIT Goal (g5: Increase Sprint Speed)
  { id: 'q5', title: 'Complete 15-min Stretching Routine', goalId: 'g5', icon: 'heart', status: 'active', progress: { current: 0, total: 15 } }, // Metric: 15 minutes 
  // CHA Goal (g6: Practice Public Speaking)
  { id: 'q6', title: 'Practice Presentation for 15 mins', goalId: 'g6', icon: 'brain', status: 'completed', progress: { current: 15, total: 15 } }, // Metric: 15 minutes (Completed)
  // DIS Goal (g7: Master Git Discipline)
  { id: 'q7', title: 'Review & Commit Code (1 PR/Commit)', goalId: 'g7', icon: 'brain', status: 'active', progress: { current: 0, total: 1 } }, // Metric: 1 PR/Commit
  // CAR Goal (g8: Develop Networking Skills)
  { id: 'q8', title: 'Reach out to 1 new contact', goalId: 'g8', icon: 'brain', status: 'skipped', progress: { current: 0, total: 1 } }, // Metric: 1 contact (Skipped)
  // CRE Goal (g9: Learn UI Design Principles)
  { id: 'q9', title: 'Sketch 3 UI Ideas', goalId: 'g9', icon: 'brain', status: 'active', progress: { current: 1, total: 3 } }, // Metric: 3 ideas
  // VIT Goal (g5: Increase Sprint Speed / General Health)
  { id: 'q10', title: 'Drink 2 Liters of Water', goalId: 'g5', icon: 'heart', status: 'active', progress: { current: 1, total: 2 } }, // Metric: 2 Liters
]; 