import { SearchIntent, ServiceCategory } from "../types";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const CATEGORIES: ServiceCategory[] = ['Plumbing', 'Mechanical', 'Electrical', 'Automation', 'Aesthetics', 'Architecture'];

export async function parseSearchIntent(query: string): Promise<SearchIntent> {
  return { query, urgency: 'low' };
}

export async function getAISuggestions(_partialQuery: string): Promise<string[]> {
  return [];
}

export async function getWorkerRecommendation(problemDescription: string): Promise<{ category: ServiceCategory | null; tip: string; error?: string }> {
  if (!API_KEY) return { category: null, tip: '', error: 'no_key' };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `A user described their home problem: "${problemDescription}"

Return a JSON object:
- category: the best service category from [${CATEGORIES.join(', ')}] or null
- tip: a one-sentence helpful tip for the user

Return raw JSON only. Example: {"category":"Plumbing","tip":"Turn off your main water supply to prevent further damage."}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (res.status === 429) return { category: null, tip: '', error: 'quota' };
    if (!res.ok) return { category: null, tip: '', error: 'unknown' };

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '{}';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
      tip: parsed.tip || '',
    };
  } catch (err: any) {
    console.error('[AI getWorkerRecommendation]', err);
    return { category: null, tip: '', error: 'unknown' };
  }
}
