import { StatCategory } from '@/components/roadmap/CategoryFilterNav';

export interface Goal {
  id: string;
  title: string;
  category: Exclude<StatCategory, 'ALL'>;
}

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Bench Press 100kg', category: 'STR' },
  { id: 'g2', title: 'Learn TypeScript Basics', category: 'INT' },
  { id: 'g3', title: 'Run a 5k Marathon', category: 'STR' },
  { id: 'g4', title: 'Read "Clean Code"', category: 'INT' },
  { id: 'g5', title: 'Increase Sprint Speed', category: 'VIT' },
  { id: 'g6', title: 'Practice Public Speaking', category: 'CHA' },
  { id: 'g7', title: 'Master Git Discipline', category: 'DIS' },
  { id: 'g8', title: 'Develop Networking Skills', category: 'CAR' },
  { id: 'g9', title: 'Learn UI Design Principles', category: 'CRE' },
]; 