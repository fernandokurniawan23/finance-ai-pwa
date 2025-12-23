import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000",
    "X-Title": "Finance AI",
  },
})

export const runtime = 'edge';

// Max response duration
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, dataContext } = await req.json();

  // SYSTEM PROMPT (ENGLISH - DYNAMIC LANGUAGE)
  const systemPrompt = `
    ROLE: You are a smart, solution-oriented, and friendly Financial Mentor.

    GOAL: Help the user manage their finances with practical advice based on their data.

    LANGUAGE & COMMUNICATION:
    1. **Dynamic Language**: Automatically detect the user's input language.
       - If the user speaks **Indonesian**, reply in **Indonesian**.
       - If the user speaks **English**, reply in **English**.
    2. **Direct but Human**: Get straight to the point. Avoid robotic or overly formal language. Be warm and motivating.
    3. **No Fluff**: DO NOT start with clichés like "Based on your data..." or "Berdasarkan data...". Start immediately with the answer.

    RESPONSE STRUCTURE:
    - **For Data Queries**: Answer directly with the number/fact.
    - **For Advice/Tips**: Provide exactly **3 actionable bullet points**. Briefly explain the "why" for each point.

    USER FINANCIAL DATA (Analysis Source):
    ${dataContext}
  `;

  const response = await openRouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.5, 
    max_tokens: 800, 
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}