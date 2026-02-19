
import { GoogleGenAI } from "@google/genai";
import { SearchIntent, ServiceCategory } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const CATEGORIES: ServiceCategory[] = ['Plumbing', 'Mechanical', 'Electrical', 'Automation', 'Aesthetics', 'Architecture'];

export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  if (!ai || !query.trim()) return { query, urgency: 'low' };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a home services assistant. A user searched: "${query}"
      
Return a JSON object with:
- category: one of [${CATEGORIES.join(', ')}] or null if unclear
- urgency: "low" | "medium" | "high" (high = emergency/urgent keywords)
- cleanQuery: a cleaned up version of their search for display

Only return raw JSON, no markdown. Example: {"category":"Plumbing","urgency":"high","cleanQuery":"Emergency pipe leak fix"}`
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return {
      query: parsed.cleanQuery || query,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : undefined,
      urgency: parsed.urgency || 'low',
    };
  } catch {
    return { query, urgency: 'low' };
  }
}

export async function getAISuggestions(partialQuery: string): Promise<string[]> {
  if (!ai || partialQuery.trim().length < 2) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `A user is typing a home service search query: "${partialQuery}"
      
Suggest 4 natural, helpful completions. Return a JSON array of strings only.
Example: ["fix leaking tap urgently","fix bathroom pipe leak","fix kitchen sink drainage","fix water heater"]
Only return the raw JSON array, no markdown.`
    });

    const text = response.text?.trim() || '[]';
    const suggestions = JSON.parse(text);
    return Array.isArray(suggestions) ? suggestions.slice(0, 4) : [];
  } catch {
    return [];
  }
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

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
      tip: parsed.tip || '',
    };
  } catch {
    return { category: null, tip: '' };
  }
}
