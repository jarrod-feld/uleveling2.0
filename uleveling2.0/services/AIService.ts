import OpenAI from 'openai'; // <-- Import OpenAI
import { Quest, mockDailyQuests } from '@/mock/dashboardData';
import { Goal, mockGoals } from '@/mock/roadmapData';
import AIConfigService, { AIConfigType, GOAL_TEMPLATES } from './AIConfigService'; // Import type and GOAL_TEMPLATES
import { AIConfig, StatBaseValues } from '@/types/ai';
import AccountService from '@/services/AccountService'; // Import AccountService
import { StatCategory } from '@/types/quest'; // Import StatCategory

// NOTE: You need to install the openai package:
// npm install openai
// or
// yarn add openai

// NOTE: Ensure your OpenAI API key is set in your environment variables
// (e.g., in .env as EXPO_PUBLIC_OPENAI_API_KEY)

// Helper to simulate AI call delay (can be removed if simulation fully replaced)
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Updated helper to use raw DB profile data + transient onboarding data
function createInitialGoalPrompt(dbProfile: any, onboardingData: any, config: AIConfig): string {
  let basePrompt = config.basePrompt || '';

  // Common user profile string for both prompt types
  let userProfileString = `Age: ${onboardingData?.age || dbProfile?.age || 'N/A'}\n`;
  userProfileString += `Gender: ${onboardingData?.gender || dbProfile?.gender || 'N/A'}\n`;
  userProfileString += `Life Status: Working: ${onboardingData?.lifeStatus?.working ? 'Yes' : 'No'}, School: ${onboardingData?.lifeStatus?.school ? 'Yes' : 'No'}\n`;
  userProfileString += `Sleep/Wake: ${onboardingData?.sleepWake || 'N/A'} / ${onboardingData?.sleepBed || 'N/A'}\n`;
  userProfileString += `Hours Work/School: ${onboardingData?.hoursWork || 'N/A'} / ${onboardingData?.hoursSchool || 'N/A'}\n`;
  userProfileString += `Focus Areas: ${Object.keys(onboardingData?.focusAreas || {}).filter(k => onboardingData?.focusAreas?.[k]).join(', ') || 'None specified'}\n`;
  if (onboardingData?.focusAreasOtherText) userProfileString += `Other Focus: ${onboardingData.focusAreasOtherText}\n`;
  userProfileString += `Roadmap Choice: ${onboardingData?.roadmapChoice || 'N/A'}\n`; // Included for context even in template mode
  // Persistent profile info (always add)
  userProfileString += `User Name (from profile): ${dbProfile?.name || 'Player'}\n`;
  userProfileString += `User Level (from profile): ${dbProfile?.level || 1}\n`;

  if (onboardingData?.roadmapChoice === 'Template') {
    const templateName = onboardingData.template || 'N/A';
    const templateDetails = GOAL_TEMPLATES[templateName] || { description: 'Not found', keywords: [], defaultCategory: 'INT' };
    const templateIntensity = onboardingData.templateIntensity || 'N/A';

    basePrompt = basePrompt.replace('{user_profile}', userProfileString.trim());
    basePrompt = basePrompt.replace('{template_name}', templateName);
    basePrompt = basePrompt.replace('{template_description}', templateDetails.description);
    basePrompt = basePrompt.replace('{template_keywords}', templateDetails.keywords.join(', '));
    basePrompt = basePrompt.replace('{template_intensity}', templateIntensity);
    basePrompt = basePrompt.replace('{template_category}', templateDetails.defaultCategory);
  } else { // 'Create' or other/default mode
    let customGoalPrompt = basePrompt.replace('{user_profile}', userProfileString.trim());
    if (onboardingData?.roadmapChoice === 'Create' && onboardingData.goals) {
      customGoalPrompt += `Initial Goal Ideas: ${onboardingData.goals.map((g: any) => `${g.description} (${g.timeframe})`).join('; ')}\n`;
    }
    basePrompt = customGoalPrompt;
  }
  return basePrompt;
}

// Updated helper to use raw DB profile data + transient onboarding data
function createInitialQuestPrompt(dbProfile: any, onboardingData: any, goals: Goal[], config: AIConfig): string {
  let prompt = config.basePrompt || '';
  // Combine profile info for context
  const combinedProfileContext = {
    dbProfile: dbProfile || { note: 'DB profile not available' },
    onboardingAnswers: onboardingData || { note: 'Onboarding data not available' },
  };
  prompt = prompt.replace('{user_profile}', JSON.stringify(combinedProfileContext, null, 2));
  // Add generated goals context
  const goalsString = goals.map(g => `- ${g.title}: ${g.description} (ID: ${g.id})`).join('\\n');
  prompt = prompt.replace('{goals}', goalsString || 'No specific goals provided.');
  return prompt;
}

// createDailyPrompt might also need profile context from AccountService
function createDailyPrompt(
  dbProfile: any, // Add dbProfile parameter
  context: { completedQuestsToday?: Quest[]; roadmapGoals?: Goal[] },
  config: AIConfig
): string {
  let prompt = config.basePrompt || '';

  const goalsString = context.roadmapGoals
    ?.map(g => `- ${g.title}: ${g.description}`)
    .join('\n') || 'No goals defined.';
  const completedQuestsString = context.completedQuestsToday
    ?.map(q => `- ${q.title} (Status: ${q.status})`)
    .join('\n') || 'None completed today.';

  // Add basic user profile info if needed by the prompt template
  const profileContextString = `User Name: ${dbProfile?.name || 'Player'}, Level: ${dbProfile?.level || 1}`;
  // Replace placeholder if it exists in the prompt
  prompt = prompt.replace('{user_profile_summary}', profileContextString);

  prompt = prompt.replace('{goals}', goalsString);
  prompt = prompt.replace('{completed_quests}', completedQuestsString);

  return prompt;
}

// Parses the response expected from generateInitialGoals
function parseGoalResponse(responseText: string): Omit<Goal, 'id'>[] {
  console.log("[AIService] Parsing initial goal response. Raw:", responseText);
  try {
    const parsedJson = JSON.parse(responseText);
    const goals = (parsedJson.goals || []).map((g: any) => ({
      title: g.title || 'Untitled Goal',
      description: g.description || '',
      category: g.category || 'INT',
      createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
      updatedAt: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    })) as Omit<Goal, 'id'>[];
    console.log(`[AIService] Parsed ${goals.length} goals (without IDs) from JSON.`);
    return goals;
  } catch (e) {
    console.error("[AIService] Failed to parse goal response as JSON:", e);
    console.log("[AIService] Returning empty array for goals due to parsing error.");
    return [];
  }
}

// Parses the response expected from generateInitialQuests and generateDailyQuests
// Returns quest objects matching mock/dashboardData.ts (minus `id`)
function parseQuestResponse(responseText: string, contextGoals?: Goal[]): Omit<Quest, 'id'>[] {
  console.log("[AIService] Parsing quest response. Raw:", responseText);
  try {
     const parsedJson = JSON.parse(responseText);
     const questsArray = Array.isArray(parsedJson?.quests) ? parsedJson.quests : [];
     const validGoalIds = new Set(contextGoals?.map(g => g.id) || []);

     const quests = questsArray.map((q: any) => {
         const title = typeof q?.title === 'string' ? q.title : 'Untitled Quest';
         const description = typeof q?.description === 'string' ? q.description : '';
         const goalId = typeof q?.goalId === 'string' ? q.goalId : null;
         const progress = (typeof q?.progress === 'object' && q.progress !== null && typeof q.progress.current === 'number' && typeof q.progress.total === 'number')
                          ? q.progress
                          : { current: 0, total: 1 };

         // Ensure stats is an array of 1 or 2 valid StatCategories (excluding DIS)
         const rawStats = Array.isArray(q?.stats) ? q.stats : [];
         const validStats = rawStats
             .filter((s: any): s is StatCategory => typeof s === 'string' && s !== 'DIS' && s !== 'ALL')
             .slice(0, 2);
         if (validStats.length === 0) {
             console.warn(`[AIService] No valid primary stat found in AI quest response for title: "${title}". Skipping quest.`);
             return null;
         }
         const finalStats = validStats as [StatCategory, StatCategory?];

         // Stat increments (explicit non-DIS)
         const rawIncrements = Array.isArray(q?.statIncrements) ? q.statIncrements : [];
         const validIncrements = rawIncrements.filter((inc: any) =>
             typeof inc === 'object' && inc !== null &&
             typeof inc.category === 'string' && inc.category !== 'DIS' && inc.category !== 'ALL' &&
             typeof inc.amount === 'number'
         ) as { category: StatCategory; amount: number }[];

         // Discipline increment amount
         const disciplineIncrementAmount = (typeof q?.disciplineIncrementAmount === 'number' && Number.isInteger(q.disciplineIncrementAmount))
             ? q.disciplineIncrementAmount
             : 1;

         // Status: default to 'active'
         const rawStatus = typeof q?.status === 'string' ? q.status : 'active';
         const status = (['active', 'completed', 'skipped'].includes(rawStatus) ? rawStatus : 'active') as 'active' | 'completed' | 'skipped';

         // completedAt timestamp if provided
         const completedAt = q?.completedAt ? new Date(q.completedAt) : undefined;

         if (!goalId || (validGoalIds.size > 0 && !validGoalIds.has(goalId))) {
             console.warn(`[AIService] Invalid or missing goalId ('${goalId}') found in AI quest response for title: "${title}". Skipping quest.`);
             return null;
         }

         return {
             title,
             description,
             goalId,
             stats: finalStats,
             status,
             progress,
             statIncrements: validIncrements,
             disciplineIncrementAmount,
             completedAt
         } as Omit<Quest, 'id'>;
     }).filter((q: Omit<Quest, 'id'> | null): q is Omit<Quest, 'id'> => q !== null);

     console.log(`[AIService] Parsed ${quests.length} valid quests (minus IDs) after validation.`);
     return quests;

  } catch (e) {
     console.error("[AIService] Failed to parse quest response as JSON or during mapping:", e);
     console.log("[AIService] Returning empty array for quests due to parsing error.");
     return [];
  }
}

// Parses the response for initial stat generation
function parseStatResponse(responseText: string): StatBaseValues | null {
  console.log("[AIService] Parsing initial stat response. Raw:", responseText);
  try {
    const parsedJson = JSON.parse(responseText);
    const expectedKeys = ['STR', 'INT', 'VIT', 'CHA', 'DIS', 'CAR', 'CRE'];
    if (typeof parsedJson === 'object' && parsedJson !== null && expectedKeys.every(key => typeof parsedJson[key] === 'number')) {
       console.log("[AIService] Parsed initial stats successfully.");
       return parsedJson as StatBaseValues;
    } else {
       console.error("[AIService] Parsed stat response has unexpected structure:", parsedJson);
       return null;
    }
  } catch (e) {
    console.error("[AIService] Failed to parse stat response as JSON:", e);
    return null;
  }
}

class AIService {
  private static openaiClient: OpenAI | null = null;

  private static getClient(apiKey: string): OpenAI {
    if (!this.openaiClient) {
      // Consider adding error handling if API key is invalid during instantiation
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  /**
   * Generates initial Goals using OpenAI API.
   * Requires userId and the transient onboardingData.
   */
  static async generateInitialGoals(
    userId: string,
    onboardingData: any // Pass transient onboarding data
  ): Promise<{ goals: Omit<Goal, 'id'>[]; error: Error | null }> {
    console.log(`[AIService] Generating initial goals for user: ${userId}`);
    try {
      // Fetch persistent profile data from DB
      const { data: dbProfile, error: profileError } = await AccountService.getProfile(userId);
      if (profileError) {
        console.warn(`[AIService] Failed to fetch DB profile for ${userId} during goal gen, proceeding with onboarding data only. Error:`, profileError.message);
      }

      // Determine config type based on roadmap choice
      const goalConfigType: AIConfigType = onboardingData?.roadmapChoice === 'Template' ? 'templateGoalGeneration' : 'initialGoalGeneration';
      console.log(`[AIService] Selected goal config type: ${goalConfigType}`);
      const config = await AIConfigService.getAIConfig(goalConfigType);
      
      const systemPrompt = createInitialGoalPrompt(dbProfile, onboardingData, config);
      const client = this.getClient(config.apiKey);

      console.log('[AIService] Sending prompt to OpenAI for initial goals...');
      const completion = await client.responses.create({
        model: config.modelName,
        input: [
            { role: "user", content: systemPrompt }
        ],
        reasoning: { effort: "medium" },
        max_output_tokens: config.maxTokens,
      });
      console.log('[AIService] OpenAI responses.create call returned for initial goals.');
      console.log(`[AIService] Goal generation response status: ${completion.status}`);
      if (completion.status === "incomplete" && completion.incomplete_details) {
          console.warn(`[AIService] Goal generation incomplete: ${completion.incomplete_details.reason}`);
          if (completion.incomplete_details.reason === "max_output_tokens") {
              console.warn("[AIService] Ran out of tokens for goal generation.");
          }
      }

      const responseText = completion.output_text;
      if (!responseText && completion.status !== "incomplete") {
        throw new Error('OpenAI API returned empty content for initial goals and status was not incomplete.');
      }
      console.log('[AIService] Received goal response from OpenAI.');

      // Parse Goal Response (Simulated)
      const goals = parseGoalResponse(responseText);
      return { goals, error: null };

    } catch (error: any) {
      console.error('[AIService] Error generating initial goals:', error);
      return { goals: [], error: error instanceof Error ? error : new Error('Failed to generate initial goals via AI') };
    }
  }

  /**
   * Generates initial Quests using OpenAI API, based on provided goals.
   * Requires userId, generated goals, and the transient onboardingData.
   */
  static async generateInitialQuests(
    userId: string,
    goals: Goal[],
    onboardingData: any // Pass transient onboarding data
  ): Promise<{ quests: Omit<Quest, 'id' | 'completedAt' | 'status'>[]; error: Error | null }> {
    console.log(`[AIService] Generating initial quests for user ${userId} based on ${goals.length} goals.`);
    try {
       // Fetch persistent profile data from DB
       const { data: dbProfile, error: profileError } = await AccountService.getProfile(userId);
       if (profileError) {
         console.warn(`[AIService] Failed to fetch DB profile for ${userId} during quest gen, proceeding with onboarding data only. Error:`, profileError.message);
       }

      const config = await AIConfigService.getAIConfig('initialQuestGeneration');
      // Pass DB profile, onboarding data, and goals to prompt creator
      const systemPrompt = createInitialQuestPrompt(dbProfile, onboardingData, goals, config);
      const client = this.getClient(config.apiKey);

      console.log('[AIService] Sending prompt to OpenAI for initial quests...');
      const completion = await client.responses.create({
        model: config.modelName,
        input: [
            { role: "user", content: systemPrompt }
        ],
        reasoning: { effort: "medium" },
        max_output_tokens: config.maxTokens,
      });
      console.log('[AIService] OpenAI responses.create call returned for initial quests.');
      console.log(`[AIService] Initial quest generation response status: ${completion.status}`);
      if (completion.status === "incomplete" && completion.incomplete_details) {
          console.warn(`[AIService] Initial quest generation incomplete: ${completion.incomplete_details.reason}`);
          if (completion.incomplete_details.reason === "max_output_tokens") {
              console.warn("[AIService] Ran out of tokens for initial quest generation.");
          }
      }

      const responseText = completion.output_text;
      if (!responseText && completion.status !== "incomplete") {
        throw new Error('OpenAI API returned empty content for initial quests and status was not incomplete.');
      }
      console.log('[AIService] Received initial quest response from OpenAI.');

      // Parse Quest Response (Simulated)
      const quests = parseQuestResponse(responseText, goals);
      return { quests, error: null };

    } catch (error: any) {
      console.error('[AIService] Error generating initial quests:', error);
      return { quests: [], error: error instanceof Error ? error : new Error('Failed to generate initial quests via AI') };
    }
  }

  /**
   * Generates new daily quests using OpenAI API.
   * Requires userId and context (completed quests, goals).
   */
  static async generateDailyQuests(
    userId: string,
    context: { completedQuestsToday?: Quest[]; roadmapGoals?: Goal[] }
  ): Promise<{ quests: Omit<Quest, 'id' | 'completedAt' | 'status'>[]; error: Error | null }> {
    console.log(`[AIService] Generating daily quests for user: ${userId}`);
    try {
       // Fetch persistent profile data for context
       const { data: dbProfile, error: profileError } = await AccountService.getProfile(userId);
       if (profileError) {
         console.warn(`[AIService] Failed to fetch DB profile for ${userId} during daily quest gen. Error:`, profileError.message);
         // Proceed without profile context if necessary
       }

       const config = await AIConfigService.getAIConfig('dailyRefresh');
       const client = this.getClient(config.apiKey);
       // Pass DB profile (if available) to daily prompt creator
       const systemPrompt = createDailyPrompt(dbProfile, context, config);

       console.log('[AIService] Sending prompt to OpenAI for daily quests...');
       const completion = await client.responses.create({
        model: config.modelName,
        input: [
            { role: "user", content: systemPrompt }
        ],
        reasoning: { effort: "medium" },
        max_output_tokens: config.maxTokens,
      });
      console.log('[AIService] OpenAI responses.create call returned for daily quests.');
      console.log(`[AIService] Daily quest generation response status: ${completion.status}`);
      if (completion.status === "incomplete" && completion.incomplete_details) {
          console.warn(`[AIService] Daily quest generation incomplete: ${completion.incomplete_details.reason}`);
          if (completion.incomplete_details.reason === "max_output_tokens") {
              console.warn("[AIService] Ran out of tokens for daily quest generation.");
          }
      }

       const responseText = completion.output_text;
       if (!responseText && completion.status !== "incomplete") {
        throw new Error('OpenAI API returned empty content for daily quests and status was not incomplete.');
       }
       console.log('[AIService] Received response from OpenAI for daily quests.');

       // Parse Quest Response (Simulated)
       const quests = parseQuestResponse(responseText, context.roadmapGoals);
       return { quests, error: null };

    } catch (error: any) {
       console.error('[AIService] Error calling OpenAI API or parsing response for daily quests:', error);
       return { quests: [], error: error instanceof Error ? error : new Error('Failed to generate daily quests via AI') };
    }
  }

  // --- New method for Initial Stat Generation ---
  static async generateInitialStats(
    userId: string,
    onboardingData: any // Pass transient onboarding data
  ): Promise<{ stats: StatBaseValues | null; error: Error | null }> {
    console.log(`[AIService] Generating initial stats for user: ${userId}`);
    try {
      console.log('[AIService] About to fetch DB profile for stats generation...');
      const { data: dbProfile, error: profileError } = await AccountService.getProfile(userId);
      console.log('[AIService] AccountService.getProfile returned for stats:', { dbProfile, profileError });
      if (profileError) {
        console.warn(`[AIService] Failed to fetch DB profile for ${userId} during stat gen, proceeding with onboarding data only. Error:`, profileError.message);
      }

      console.log('[AIService] Fetching AI config for initialStatGeneration...');
      const config = await AIConfigService.getAIConfig('initialStatGeneration');
      console.log('[AIService] Received AI config for stats:', { modelName: config.modelName, maxTokens: config.maxTokens, temperature: config.temperature });
      // Create a simple prompt structure using onboardingData directly for stats
      const systemPrompt = config.basePrompt + '\n\nUser Onboarding Answers:\n' + JSON.stringify(onboardingData, null, 2);
      console.log('[AIService] Constructed systemPrompt for stats:', systemPrompt);

      const client = this.getClient(config.apiKey);
      console.log('[AIService] Sending prompt to OpenAI for initial stats...');
      const completion = await client.responses.create({
        model: config.modelName,
        input: [
            { role: "user", content: systemPrompt }
        ],
        reasoning: { effort: "medium" },
        max_output_tokens: config.maxTokens,
      });

      console.log('[AIService] OpenAI responses.create call returned for stats.');
      console.log(`[AIService] Initial stat generation response status: ${completion.status}`);
      if (completion.status === "incomplete" && completion.incomplete_details) {
          console.warn(`[AIService] Initial stat generation incomplete: ${completion.incomplete_details.reason}`);
          if (completion.incomplete_details.reason === "max_output_tokens") {
              console.warn("[AIService] Ran out of tokens for initial stat generation.");
          }
      }

      const responseText = completion.output_text;
      console.log('[AIService] AI responseText for stats:', responseText);
      if (!responseText && completion.status !== "incomplete") {
        throw new Error('OpenAI API returned empty content for initial stats and status was not incomplete.');
      }
      console.log('[AIService] Received stat response from OpenAI.');

      // Parse Stat Response
      const stats = parseStatResponse(responseText);
      console.log('[AIService] Parsed stats:', stats);
      if (!stats) {
         throw new Error('Failed to parse valid stats from AI response.');
      }
      return { stats, error: null };

    } catch (error: any) {
      console.error('[AIService] Error generating initial stats:', error);
      return { stats: null, error: error instanceof Error ? error : new Error('Failed to generate initial stats via AI') };
    }
  }

  // --- Keep or remove old generateQuests placeholder? ---
  // Commenting out the old placeholder as it's replaced by more specific methods
  /*
  static async generateQuests(
    userId?: string, 
    // Add other parameters as needed, e.g., userStats, userGoals
  ): Promise<{ data: Quest[] | null; error: Error | null }> {
    console.warn('[AIService] generateQuests is deprecated. Use generateInitialGoalsAndQuests or generateDailyQuests.');
    await delay(100);
    return { data: [], error: new Error("AI generation not implemented via old method") };
  }
  */

  // static async foo() {} // Removed unused placeholder
}

export default AIService; 