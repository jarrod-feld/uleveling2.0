/**
 * Configuration for AI service calls.
 */
import { StatCategory } from './quest'; // Assuming StatCategory is defined here or in index

export interface AIConfig {
  apiKey: string;
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  max_output_tokens?: number;
  basePrompt?: string; // Optional base prompt part
  reasoning?: {
    effort: string;
  };
}

// Type for the object returned by AI stat generation
export type StatBaseValues = {
    [key in Exclude<StatCategory, 'ALL'>]: number;
}; 