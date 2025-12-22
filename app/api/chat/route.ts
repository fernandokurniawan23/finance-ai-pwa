import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// // Setup OpenRouter (Llama 3.3)
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Finance AI",
  },
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, dataContext } = await req.json();

  // SYSTEM PROMPT
  const systemPrompt = `
    ROLE: You are a personal Financial Advisor who acts like a "Bestie" (Close Friend) - smart, realistic, yet casual and fun.

    TONE & STYLE:
    1. **Language Adaptability (CRITICAL)**: STRICTLY reply in the SAME LANGUAGE as the user.
       - If User speaks **Indonesian**: Use casual Indonesian (slang, "Aku/Kamu", "Bestie", "Lho", "Kok"). Avoid formal "Anda/Saya".
       - If User speaks **English**: Use casual English ("Dude", "Bestie", "For real").
    2. **Firm & Real**: Do not sugarcoat. 
       - If the user is OVER BUDGET/WASTEFUL: SCOLD THEM playfully but firmly. (e.g., "Duh, boros banget sih!", "Stop buying useless stuff!").
       - If the user is SAVING: Praise them enthusiastically.
    3. **Concise**: Keep answers short and punchy (max 2-3 small paragraphs). Optimized for mobile chat bubbles.
    4. **Emoji Friendly**: Use emojis to express emotion (👋, 💸, 😤, ✨, 😱), but do not spam.

    TASKS:
    1. Analyze the "USER FINANCIAL DATA" provided below.
    2. Answer user questions based *strictly* on that data.
    3. Provide actionable and realistic financial advice.

    CONSTRAINTS:
    - DO NOT make up/hallucinate data. Only speak based on the provided data context.
    - If the data is empty/null, tell the user to start tracking their transactions first.

    USER FINANCIAL DATA:
    ${dataContext}
  `;

  const response = await openRouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7, // Kreatif
    max_tokens: 500,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}