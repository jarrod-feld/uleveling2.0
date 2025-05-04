import { StatCategory } from '@/components/roadmap/CategoryFilterNav';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Exclude<StatCategory, 'ALL'>;
  createdAt: Date;
  updatedAt: Date;
}

// NOTE: mockGoals is for development reference and testing ONLY.
// The application should fetch real data using RoadmapService.
export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Bench Press 100kg', description: 'Achieve a 1 rep max of 100kg on the bench press.', category: 'STR', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g2', title: 'Learn TypeScript Basics', description: 'Complete a basic TypeScript tutorial and understand core concepts.', category: 'INT', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g3', title: 'Run a 5k Marathon', description: 'Successfully complete a 5 kilometer run.', category: 'STR', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g4', title: 'Read "Clean Code"', description: 'Read and understand the principles in the book "Clean Code".', category: 'INT', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g5', title: 'Increase Sprint Speed', description: 'Improve 100m sprint time by 0.5 seconds.', category: 'VIT', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g6', title: 'Practice Public Speaking', description: 'Deliver a 5-minute presentation to a small group.', category: 'CHA', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g7', title: 'Master Git Discipline', description: 'Consistently use Git for version control following best practices.', category: 'DIS', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g8', title: 'Develop Networking Skills', description: 'Attend one networking event and make three new contacts.', category: 'CAR', createdAt: new Date(), updatedAt: new Date() },
  { id: 'g9', title: 'Learn UI Design Principles', description: 'Study and apply basic UI design principles to a small project.', category: 'CRE', createdAt: new Date(), updatedAt: new Date() },
]; 