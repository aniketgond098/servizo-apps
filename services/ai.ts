
import { GoogleGenAI, Type } from "@google/genai";
import { SearchIntent } from "../types";

export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  // Always return without AI - it's optional
  return { query, urgency: 'low' };
}
