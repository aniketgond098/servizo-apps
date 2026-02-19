
import { GoogleGenAI } from "@google/genai";
import { SearchIntent, ServiceCategory } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const CATEGORIES: ServiceCategory[] = ['Plumbing', 'Mechanical', 'Electrical', 'Automation', 'Aesthetics', 'Architecture'];

// Disabled to prevent quota burn — only getWorkerRecommendation (explicit button click) uses AI
export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  return { query, urgency: 'low' };
}

// Disabled to prevent quota burn — suggestions are not worth the API calls
export async function getAISuggestions(_partialQuery: string): Promise<string[]> {
  return [];
}

export async function getWorkerRecommendation(problemDescription: string): Promise<{ category: ServiceCategory | null; tip: string }> {
  if (!ai) return { category: null, tip: '' };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `A user described their home problem: "${problemDescription}"

Return a JSON object:
- category: the best service category from [${CATEGORIES.join(', ')}] or null
- tip: a one-sentence helpful tip for the user (e.g. "Turn off your main water valve immediately before the plumber arrives.")

Return raw JSON only. Example: {"category":"Plumbing","tip":"Turn off your main water supply to prevent further damage."}`
    });

      const text = (typeof response.text === 'function' ? response.text() : response.text)?.trim() || '{}';
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/,'').trim();
      const parsed = JSON.parse(cleaned);
      return {
        category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
        tip: parsed.tip || '',
      };
    } catch (err) {
      console.error('[AI getWorkerRecommendation]', err);
      return { category: null, tip: '' };
    }
}
