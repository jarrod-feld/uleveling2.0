import { UserTitle } from '@/services/TitleService'; // Assuming UserTitle is exported

// --- Types for Requirements ---
export type RequirementType = 'level' | 'stat' | 'quests_completed'; // Add more as needed

export interface LevelRequirement {
  type: 'level';
  value: number;
}

export interface StatRequirement {
  type: 'stat';
  label: string; // e.g., 'STR', 'INT', 'DIS'
  value: number;
}

export interface QuestsCompletedRequirement {
  type: 'quests_completed';
  value: number; // Number of quests needed
}

export type AchievementRequirement = LevelRequirement | StatRequirement | QuestsCompletedRequirement;

// --- Types for Rewards ---
export type RewardType = 'title'; // Add more like 'xp', 'item', etc.

export interface TitleReward {
  type: 'title';
  titleId: string; // ID of the title granted
}

export type AchievementReward = TitleReward; // Add other reward types with |

// --- Achievement Definition ---
export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  isHidden?: boolean; // Optional flag for mystery achievements
}

// --- Example Achievement Data ---
// Fetch all possible titles to reference their IDs here - using placeholders for now
const allTitles: Pick<UserTitle, 'id' | 'name'>[] = [
  { id: 't1', name: 'Shadow Monarch' }, // Existing
  { id: 't2', name: 'Quest Novice' },
  { id: 't3', name: 'Level Up!' },
  { id: 't4', name: 'Strength Master' }
];

export const achievements: AchievementDefinition[] = [
  {
    id: 'ach_level_5',
    title: 'Level Up!',
    description: 'Reach level 5.',
    requirements: [{ type: 'level', value: 5 }],
    rewards: [{ type: 'title', titleId: 't3' }],
    isHidden: false, // Explicitly not hidden
  },
  {
    id: 'ach_quests_10',
    title: 'Quest Novice',
    description: 'Complete 10 daily quests.',
    requirements: [{ type: 'quests_completed', value: 10 }],
    rewards: [{ type: 'title', titleId: 't2' }],
  },
  {
    id: 'ach_str_20',
    title: 'Budding Brawn',
    description: 'Achieve a Strength (STR) stat of 20.',
    requirements: [{ type: 'stat', label: 'STR', value: 20 }],
    rewards: [], // No reward for this one yet
  },
   {
    id: 'ach_str_50_lvl10',
    title: 'Strength Master',
    description: 'Reach level 10 and achieve a Strength (STR) stat of 50.',
    requirements: [
        { type: 'level', value: 10 },
        { type: 'stat', label: 'STR', value: 50 }
    ],
    rewards: [{ type: 'title', titleId: 't4' }],
  },
  // --- Mystery Achievement Example ---
  {
      id: 'ach_mystery_discipline',
      title: 'Inner Peace', // This will be hidden initially
      description: 'Master the art of daily discipline.', // This will be hidden
      requirements: [{ type: 'stat', label: 'DIS', value: 50 }], // Requires Discipline 50
      rewards: [], // Could add a reward later
      isHidden: true,
  },
];

// Helper to get a specific achievement definition
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
    return achievements.find(ach => ach.id === id);
} 