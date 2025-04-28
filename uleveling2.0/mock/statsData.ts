import {
  Barbell, Brain, Heart, Star, Lock, Briefcase, PaintBrush
} from 'phosphor-react-native';

// Define possible icon names explicitly if needed for type safety
export type StatIconName = 'Barbell' | 'Brain' | 'Heart' | 'Star' | 'Lock' | 'Briefcase' | 'PaintBrush';

export interface Stat {
  id: string;
  label: string; // e.g., "STR", "INT"
  baseValue: number; // Base stat value
  bonus: number; // Value gained from quests (green text)
  totalValue: number; // baseValue + bonus (main display)
  iconName: StatIconName; // Reference to the icon component
}

// Map icon names to actual components
export const STAT_ICONS: Record<StatIconName, React.ElementType> = {
  Barbell,
  Brain,
  Heart,
  Star,
  Lock,
  Briefcase,
  PaintBrush,
};

// Initial Base Stats (Example)
const baseStats = {
  STR: 50,
  INT: 60,
  VIT: 55,
  CHA: 45,
  DIS: 70,
  CAR: 40,
  CRE: 50,
};

// Mock stats representing INITIAL state (Base + Initial Bonus)
// Let's assume the original value 99 was the initial total.
export const mockStats: Stat[] = [
  { id: 's1', label: 'STR', baseValue: baseStats.STR, bonus: 99 - baseStats.STR, totalValue: 99, iconName: 'Barbell' },
  { id: 's2', label: 'INT', baseValue: baseStats.INT, bonus: 99 - baseStats.INT, totalValue: 99, iconName: 'Brain' },
  { id: 's3', label: 'VIT', baseValue: baseStats.VIT, bonus: 99 - baseStats.VIT, totalValue: 99, iconName: 'Heart' },
  { id: 's4', label: 'CHA', baseValue: baseStats.CHA, bonus: 99 - baseStats.CHA, totalValue: 99, iconName: 'Star' },
  { id: 's5', label: 'DIS', baseValue: baseStats.DIS, bonus: 99 - baseStats.DIS, totalValue: 99, iconName: 'Lock' }, // Discipline
  { id: 's6', label: 'CAR', baseValue: baseStats.CAR, bonus: 99 - baseStats.CAR, totalValue: 99, iconName: 'Briefcase' },
  { id: 's7', label: 'CRE', baseValue: baseStats.CRE, bonus: 99 - baseStats.CRE, totalValue: 99, iconName: 'PaintBrush' },
]; 