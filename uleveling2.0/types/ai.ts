/**
 * Configuration for AI service calls.
 */
import { StatCategory } from './quest'; // Assuming StatCategory is defined here or in index

export interface AIConfig {
  apiKey: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  basePrompt?: string; // Optional base prompt part
  // Add other potential config fields like API keys, endpoints etc. if needed
}

// Type for the object returned by AI stat generation
export type StatBaseValues = {
    [key in Exclude<StatCategory, 'ALL'>]: number;
}; 