import { AIConfig } from '@/types/ai';

// Define Goal Templates
export const GOAL_TEMPLATES: Record<string, { description: string; keywords: string[]; defaultCategory: string }> = {
  "Fitness Foundation": {
    description: "Build a solid foundation for physical fitness, focusing on regular activity, balanced nutrition, and adequate rest.",
    keywords: ["exercise routines", "healthy eating habits", "consistent sleep schedule", "strength building", "cardiovascular health", "flexibility", "hydration"],
    defaultCategory: "VIT" // Predominantly Vitality focused
  },
  "Career Climb": {
    description: "Advance in your professional career by developing key skills, expanding your network, and improving job performance.",
    keywords: ["skill acquisition", "professional networking", "performance reviews", "leadership development", "industry knowledge", "time management", "project completion"],
    defaultCategory: "INT" // Predominantly Intellect focused
  },
  "Skill Sprint": {
    description: "Rapidly acquire or significantly improve a specific skill through focused effort and dedicated practice.",
    keywords: ["deep practice", "learning resources", "mentor feedback", "project-based learning", "milestone tracking", "overcoming plateaus", "consistent practice"],
    defaultCategory: "CRE" // Predominantly Creativity/Capability focused, but could be INT too
  },
  "Social Butterfly": {
    description: "Enhance social connections, improve communication skills, and build more meaningful relationships.",
    keywords: ["active listening", "initiating conversations", "community involvement", "strengthening friendships", "empathy building", "social events", "setting boundaries"],
    defaultCategory: "CHA" // Predominantly Charisma focused
  },
  // Add more templates as desired
};

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

// Config for initial GOAL generation (CUSTOM by user)
const initialGoalGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'o4-mini',
  max_output_tokens: 2000, // User previously set this from maxTokens
  reasoning: { effort: 'medium' },
  basePrompt: `You are assisting a user in defining their long-term self-improvement goals. Analyze the following user profile information, which includes their answers to an onboarding questionnaire (age, gender, life status, focus areas, etc.) and potentially some initial raw goal ideas they provided.
User Profile & Questionnaire Data:
{user_profile}

Instructions:
1. If the user provided 'Initial Goal Ideas' in the profile data, review and refine them. Ensure these refined goals are SMART (Specific, Measurable, Achievable, Relevant, Time-bound) and align with the user's overall profile and focus areas.
2. Based on the *entire* user profile (especially their focus areas, questionnaire answers, and desired stat development areas if mentioned), generate additional relevant long-term goals. These supplementary goals should be generic and broadly aim to improve one or more of the user's core stats (STR, INT, VIT, CHA, DIS, CAR, CRE). Aim for a total of 3-5 goals overall.
3. All final goals (whether refined from user input or newly generated) must be SMART.
4. Format the output as a single JSON object containing a key "goals" whose value is an array. EACH goal object in the array MUST include: "title" (string), "description" (string), "category" (string: STR, INT, VIT, CHA, DIS, CAR, CRE), "createdAt" (ISO_DATE string), "updatedAt" (ISO_DATE string). 
5. DO NOT include an "id" field for the goals; the database will generate it.
Example of expected output: { "goals": [ { "title": "Read 12 Non-Fiction Books", "description": "Read one non-fiction book per month for a year to expand knowledge in areas like psychology and technology.", "category": "INT", "createdAt": "2024-05-15T10:00:00Z", "updatedAt": "2024-05-15T10:00:00Z" }, ... ] }`,
};

// Config for TEMPLATE-BASED initial GOAL generation
const templateGoalGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'o4-mini',
  max_output_tokens: 2000, // Consistent with other goal/quest generation
  reasoning: { effort: 'medium' },
  basePrompt: `You are assisting a user in defining their long-term self-improvement goals based on a chosen template and intensity.
User Profile (age, gender, life status, focus areas, etc.):
{user_profile}

Chosen Template Details:
Name: {template_name}
Description: {template_description}
Keywords: {template_keywords}
Selected Intensity: {template_intensity}
Default Stat Category for this template: {template_category}

Instructions:
1. Generate 3-5 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) long-term goals. These goals should be directly inspired by the chosen template ({template_name}), its description, and its keywords.
2. Crucially, tailor the ambition, scope, and timeframe of these goals based on the Selected Intensity ({template_intensity}).
   - 'Low' intensity: Goals should be introductory, foundational, or require smaller, consistent efforts. Focus on building habits.
   - 'Med' intensity: Goals should be moderately challenging, requiring noticeable effort and leading to significant progress.
   - 'High' intensity: Goals should be ambitious and transformative, potentially requiring significant lifestyle changes or dedicated focus over a period.
3. Consider the user's general profile information ({user_profile}) to ensure the generated goals are appropriate and realistic for their context (e.g., a student vs. a full-time worker).
4. For the "category" of each goal, primarily use the Default Stat Category ({template_category}) provided for the template. However, if a specific goal clearly aligns better with a different stat category (STR, INT, VIT, CHA, DIS, CAR, CRE), you may use that, but try to ensure most goals reflect the template's primary category.
5. Format the output as a single JSON object containing a key "goals" whose value is an array. EACH goal object in the array MUST include: "title" (string), "description" (string), "category" (string: STR, INT, VIT, CHA, DIS, CAR, CRE), "createdAt" (ISO_DATE string), "updatedAt" (ISO_DATE string).
6. DO NOT include an "id" field for the goals; the database will generate it.
Example output: { "goals": [ { "title": "...", "description": "...", "category": "VIT", "createdAt": "...", "updatedAt": "..." } ] }`,
};

// Config for initial QUEST generation (Updated Prompt)
const initialQuestGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'o4-mini', // Changed from o3-mini
  max_output_tokens: 2000, // Preserving user-set maxTokens
  reasoning: { effort: 'medium' },
  basePrompt: `You are assisting a user in a gamified self-improvement application. Your task is to generate initial daily quests.

Application & Stat Context:
The app helps users level up their real-life stats by completing quests. The stats are:
- STR (Strength): Physical fitness, exercise.
- INT (Intellect): Knowledge, learning, problem-solving.
- VIT (Vitality): Overall health, energy, diet, sleep.
- CHA (Charisma): Social skills, communication.
- DIS (Discipline): Self-control, consistency, habit formation. (Primarily increased via disciplineIncrementAmount)
- CAR (Career/Capability): Professional development, job skills.
- CRE (Creativity): Innovation, artistic expression.

Instructions:
Based on the user profile and their newly generated long-term goals (including their database-generated IDs), create 5 small, actionable daily tasks designed as initial steps towards these goals. These should be repeatable or easily integrable into a daily routine. Link tasks to relevant goals using goalId.

Format the output as a single JSON object containing a key "quests" whose value is an array. EACH quest object in the array MUST include:
  "title" (string),
  "description" (string),
  "goalId" (string, from context goals),
  "stats" (array of 1 or 2 StatCategory strings, from: STR, INT, VIT, CHA, CAR, CRE. DO NOT include DIS here),
  "statIncrements" (array of objects { category: StatCategory, amount: number }). For EVERY stat category listed in the "stats" array, there MUST be a corresponding entry in "statIncrements". The amount should typically be 1. DO NOT include DIS here.
  "progress" (object { current: number (always 0 for new quests), total: number (target metric for completion, e.g., 5 for 'complete 5 tasks'; set to 1 if the quest is a single action or not metric-based) }),
  "disciplineIncrementAmount" (number, representing the DIS increase, default to 1 if not obvious).
DO NOT include an "id" field for the quests; the database will generate it.

Context:
User Profile:
{user_profile}
Goals:
{goals}

Example: { "quests": [ { "title": "Walk 2000 steps", "description": "Take a short walk to reach 2000 steps today.", "goalId": "g1", "stats": ["VIT"], "statIncrements": [{ "category": "VIT", "amount": 1 }], "progress": { "current": 0, "total": 2000 }, "disciplineIncrementAmount": 1 }, { "title": "Brainstorm 3 project ideas", "description": "Dedicate 15 minutes to brainstorm new project ideas related to your creative goal.", "goalId": "g2", "stats": ["INT", "CRE"], "statIncrements": [{ "category": "INT", "amount": 1 }, { "category": "CRE", "amount": 1 }], "progress": { "current": 0, "total": 1 }, "disciplineIncrementAmount": 1 } ] }`,
};

// Config for DAILY quest refresh (Updated Prompt)
const dailyRefreshConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'o4-mini', // Changed from o3-mini
  max_output_tokens: 1000, // Preserving user-set maxTokens
  reasoning: { effort: 'medium' },
  basePrompt: `You are assisting a user in a gamified self-improvement application. Your task is to generate 5 new daily quests.

Application & Stat Context:
The app helps users level up their real-life stats by completing quests. The stats are:
- STR (Strength): Physical fitness, exercise.
- INT (Intellect): Knowledge, learning, problem-solving.
- VIT (Vitality): Overall health, energy, diet, sleep.
- CHA (Charisma): Social skills, communication.
- DIS (Discipline): Self-control, consistency, habit formation. (Primarily increased via disciplineIncrementAmount)
- CAR (Career/Capability): Professional development, job skills.
- CRE (Creativity): Innovation, artistic expression.

Instructions:
Generate 5 new, small, actionable daily tasks for the user based on their long-term goals and performance on previous quests. These tasks should be things the user can realistically do today to make progress towards their goals. Prioritize variety and adjust difficulty slightly if needed.

Format the output as a single JSON object containing a key "quests" whose value is an array. EACH quest object in the array MUST include:
  "title" (string),
  "description" (string),
  "goalId" (string, from context goals),
  "stats" (array of 1 or 2 StatCategory strings, from: STR, INT, VIT, CHA, CAR, CRE. DO NOT include DIS here),
  "statIncrements" (array of objects { category: StatCategory, amount: number }). For EVERY stat category listed in the "stats" array, there MUST be a corresponding entry in "statIncrements". The amount should typically be 1. DO NOT include DIS here.
  "progress" (object { current: number (always 0 for new quests), total: number (target metric for completion, e.g., 3 for 'meditate for 3 minutes'; set to 1 if the quest is a single action or not metric-based) }),
  "disciplineIncrementAmount" (number, representing the DIS increase, default to 1 if not obvious).
DO NOT include an "id" field for the quests; the database will generate it.

Context:
Goals:
{goals}
Completed Quests Today:
{completed_quests}

Example: { "quests": [ { "title": "Drink 8 glasses of water", "description": "Ensure you drink a total of 8 glasses of water throughout the day.", "goalId": "g2", "stats": ["VIT"], "statIncrements": [{ "category": "VIT", "amount": 1 }], "progress": { "current": 0, "total": 8 }, "disciplineIncrementAmount": 1 }, { "title": "Review and action one work email", "description": "Tackle one pending work email to make progress on career tasks.", "goalId": "g3", "stats": ["CAR", "INT"], "statIncrements": [{ "category": "CAR", "amount": 1 }, { "category": "INT", "amount": 1 }], "progress": { "current": 0, "total": 1 }, "disciplineIncrementAmount": 2 } ] }`,
};

// Config for initial STAT generation
const initialStatGenConfigBase: Omit<AIConfig, 'apiKey'> = {
  modelName: 'o4-mini', // Changed from gpt-4o
  max_output_tokens: 500, // Preserving user-set maxTokens for stats
  reasoning: { effort: 'medium' },
  basePrompt: `Analyze the provided user onboarding answers. Based ONLY on these answers, assign initial BASE stat values for STR, INT, VIT, CHA, DIS, CAR, CRE. Each stat should be an integer between 3 and 8 (inclusive). Consider their life status, time commitment, focus areas etc. Output ONLY a single JSON object mapping the stat label (string) to its base value (integer). Example: { "STR": 5, "INT": 7, "VIT": 6, "CHA": 4, "DIS": 8, "CAR": 5, "CRE": 6 }`,
};

// Define allowed config types
export type AIConfigType =
  | 'initialGoalGeneration' // For user-customized goals
  | 'templateGoalGeneration' // For template-based goals
  | 'initialQuestGeneration'
  | 'dailyRefresh'
  | 'initialStatGeneration';

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
      case 'templateGoalGeneration':
        baseConfig = templateGoalGenConfigBase;
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