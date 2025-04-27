import {
  Barbell, Brain, Heart, Star, Lock, Briefcase, PaintBrush
} from 'phosphor-react-native';

// Define possible icon names explicitly if needed for type safety
export type StatIconName = 'Barbell' | 'Brain' | 'Heart' | 'Star' | 'Lock' | 'Briefcase' | 'PaintBrush';

export interface Stat {
  id: string;
  label: string; // e.g., "STR", "INT"
  value: number;
  bonus?: number; // Optional bonus value like (+99)
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

export const mockStats: Stat[] = [
  { id: 's1', label: 'STR', value: 99, bonus: 99, iconName: 'Barbell' },
  { id: 's2', label: 'INT', value: 99, bonus: 99, iconName: 'Brain' },
  { id: 's3', label: 'VIT', value: 99, bonus: 99, iconName: 'Heart' },
  { id: 's4', label: 'CHA', value: 99, bonus: 99, iconName: 'Star' },
  { id: 's5', label: 'DIS', value: 99, bonus: 99, iconName: 'Lock' },
  { id: 's6', label: 'CAR', value: 99, bonus: 99, iconName: 'Briefcase' },
  { id: 's7', label: 'CRE', value: 99, bonus: 99, iconName: 'PaintBrush' },
]; 