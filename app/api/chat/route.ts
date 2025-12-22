import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

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
    ROLE: You are a professional, intelligent, and polite Financial Advisor.

    TONE & STYLE:
    1. **Professional & Friendly**: Use formal but warm language. Avoid slang ("gaul"), avoid "bestie". Use "Anda" or polite "Kamu".
    2. **Objective**: Base your advice strictly on the user's data provided below.
    3. **Concise**: Keep answers short (max 2-3 paragraphs). Use bullet points for readability on mobile.
    4. **Constructive Feedback**: 
       - If User is OVER BUDGET: Warn them politely but clearly (e.g., "Mohon perhatian, pengeluaran Anda melebihi batas.").
       - If User is SAVING: Commend them (e.g., "Bagus sekali, kondisi keuangan Anda sehat.").
    5. **Language**: Automatically detect and reply in the user's language (Indonesian or English).

    TASKS:
    1. Analyze the "USER FINANCIAL DATA".
    2. Answer user questions based *strictly* on that data.
    3. Provide actionable financial advice.

    CONSTRAINTS:
    - DO NOT make up data.
    - If data is empty, polite ask the user to input transactions first.

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
    temperature: 0.5,
    max_tokens: 500,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}