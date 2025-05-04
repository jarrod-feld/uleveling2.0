import { AIConfig } from '@/types/ai';

// Function to get API key securely
function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    console.error("*********************************************************");
    console.error("*** OpenAI API Key not found!                   ***");
    console.error("*** Please set EXPO_PUBLIC_OPENAI_API_KEY in .env ***");
    console.error("*********************************************************");
    throw new Error('OpenAI API Key not configured');
  }
  return apiKey;
}

// Config for initial GOAL generation
const initialGoalGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'gpt-4o', // Use a capable model for goal setting
  maxTokens: 800,
  temperature: 0.7,
  basePrompt: 'Based on the following user profile, generate 3-5 relevant long-term goals. Focus on the areas they specified. Goals should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Format the output as a single JSON object containing a key "goals" whose value is an array. EACH goal object in the array MUST include: "title" (string), "description" (string), "category" (string: STR, INT, VIT, CHA, DIS, CAR, CRE), "createdAt" (ISO_DATE string), "updatedAt" (ISO_DATE string). DO NOT include an "id" field for the goals; the database will generate it. Example: { "goals": [ { "title": "...", "description": "...", "category": "STR", "createdAt": "...", "updatedAt": "..." } ] }',
};

// Config for initial QUEST generation (Updated Prompt)
const initialQuestGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.6,
  basePrompt: 'Based on the user profile and their newly generated long-term goals (including their database-generated IDs), create 5 initial daily quests. Link quests to relevant goals using goalId. Format the output as a single JSON object containing a key "quests" whose value is an array. EACH quest object in the array MUST include: "title" (string), "description" (string), "goalId" (string, from context goals), "stats" (array of 1 or 2 StatCategory strings, excluding DIS: STR, INT, VIT, CHA, CAR, CRE), "statIncrements" (array of objects { category: StatCategory (MUST NOT be DIS), amount: number }, can be empty []), "progress" (object { current: number, total: number }), and "disciplineIncrementAmount" (number, representing the DIS increase, default to 1 if not obvious). DO NOT include an "id" field for the quests; the database will generate it. Context:\nUser Profile:\n{user_profile}\nGoals:\n{goals}\nExample: { "quests": [ { "title": "...", "description": "...", "goalId": "g1", "stats": ["STR"], "statIncrements": [{ "category": "STR", "amount": 1 }], "progress": { "current": 0, "total": 1 }, "disciplineIncrementAmount": 1 }, ... ] }',
};

// Config for DAILY quest refresh (Updated Prompt)
const dailyRefreshConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.6,
  basePrompt: 'Generate 5 new daily quests for the user based on their long-term goals and performance on previous quests. Prioritize variety and adjust difficulty slightly. Format the output as a single JSON object containing a key "quests" whose value is an array. EACH quest object in the array MUST include: "title" (string), "description" (string), "goalId" (string, from context goals), "stats" (array of 1 or 2 StatCategory strings, excluding DIS: STR, INT, VIT, CHA, CAR, CRE), "statIncrements" (array of objects { category: StatCategory (MUST NOT be DIS), amount: number }, can be empty []), "progress" (object { current: number, total: number }), and "disciplineIncrementAmount" (number, representing the DIS increase, default to 1 if not obvious). DO NOT include an "id" field for the quests; the database will generate it. Context:\nGoals:\n{goals}\nCompleted Quests Today:\n{completed_quests}\nExample: { "quests": [ { "title": "...", "description": "...", "goalId": "g2", "stats": ["INT"], "statIncrements": [], "progress": { "current": 0, "total": 5 }, "disciplineIncrementAmount": 1 }, ... ] }',
};

// Config for initial STAT generation
const initialStatGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'gpt-4o', // Or 'gpt-3.5-turbo' if simpler task
  maxTokens: 300,
  temperature: 0.5,
  basePrompt: 'Analyze the provided user onboarding answers. Based ONLY on these answers, assign initial BASE stat values for STR, INT, VIT, CHA, DIS, CAR, CRE. Each stat should be an integer between 3 and 8 (inclusive). Consider their life status, time commitment, focus areas etc. Output ONLY a single JSON object mapping the stat label (string) to its base value (integer). Example: { "STR": 5, "INT": 7, "VIT": 6, "CHA": 4, "DIS": 8, "CAR": 5, "CRE": 6 }',
};

// Define allowed config types
export type AIConfigType = 'initialGoalGeneration' | 'initialQuestGeneration' | 'dailyRefresh' | 'initialStatGeneration';

class AIConfigService {
  /**
   * Fetches AI configuration, including the API key.
   */
  static async getAIConfig(configType: AIConfigType): Promise<AIConfig> {
    console.log(`[AIConfigService] Fetching AI config for: ${configType}`);
    const apiKey = getApiKey();
    let baseConfig: Omit<AIConfig, 'apiKey'>;

    switch (configType) {
      case 'initialGoalGeneration':
        baseConfig = initialGoalGenConfigBase;
        break;
      case 'initialQuestGeneration':
        baseConfig = initialQuestGenConfigBase;
        break;
      case 'dailyRefresh':
        baseConfig = dailyRefreshConfigBase;
        break;
      case 'initialStatGeneration':
        baseConfig = initialStatGenConfigBase;
        break;
      default:
        // Optional: handle unexpected configType, though TS should prevent this
        console.error(`[AIConfigService] Unknown configType: ${configType}`);
        throw new Error(`Unknown AI config type requested: ${configType}`);
    }

    return {
      ...baseConfig,
      apiKey: apiKey,
    };
  }

  // static async foo() {} // Removed unused placeholder
}

export default AIConfigService; 