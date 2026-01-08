import OpenAI from "openai";
import { Redis } from "@upstash/redis";

export const runtime = "edge";

const DAILY_ADVISOR_LIMIT = 10;

const redis = Redis.fromEnv();

/* ===============================
   ADVISOR MODE DETECTION
================================ */
type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const isAdvisorQuestion = (messages: ChatMessage[]) => {
  const last = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const keywords = [
    "gimana",
    "bagaimana",
    "tips",
    "saran",
    "menurut",
    "apakah",
    "baiknya",
    "haruskah"
  ];
  return keywords.some(k => last.includes(k));
};


/* ===============================
   DOMAIN CONSTANTS
================================ */
const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan & Langganan",
  "Belanja Kebutuhan",
  "Belanja Non-Kebutuhan",
  "Kesehatan",
  "Pendidikan",
  "Hiburan",
  "Keluarga & Sosial",
  "Cash Out (Pengeluaran Tunai)",
  "Darurat",
  "Lainnya"
] as const;

const INCOME_CATEGORIES = [
  "Gaji Utama",
  "Gaji Tambahan",
  "Bonus / THR",
  "Freelance",
  "Usaha",
  "Hasil Investasi",
  "Hadiah / Refund",
  "Lainnya"
] as const;

/* ===============================
   OPENROUTER CLIENT
================================ */
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
    "X-Title": "Finance AI",
  },
});

/* ===============================
   API HANDLER
================================ */
export async function POST(req: Request) {
  const { messages, dataContext, anonId } = await req.json();

  if (!anonId || !Array.isArray(messages)) {
    return new Response("Invalid request", { status: 400 });
  }

  /* ===== LIMIT CHECK */
  const advisorMode = isAdvisorQuestion(messages);

  if (advisorMode) {
    const today = new Date().toISOString().split("T")[0];
    const key = `ai_usage:${anonId}:${today}`;

    const used = (await redis.get<number>(key)) ?? 0;

    if (used >= DAILY_ADVISOR_LIMIT) {
      return new Response(
        "Batas konsultasi harian Anda telah tercapai. Silakan coba kembali besok.",
        { status: 429 }
      );
    }

    await redis.set(key, used + 1, { ex: 60 * 60 * 24 });
  }

  /* ===== DATE CONTEXT ===== */
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const dayName = today.toLocaleDateString("id-ID", { weekday: "long" });

  /* ===== SYSTEM PROMPT (AS-IS, YOUR RESEARCH) ===== */
  const systemPrompt = `
    ROLE: You are a smart, solution-oriented, and friendly Financial Mentor.
    GOAL: Help the user manage their finances with practical advice based on their data.

    ---
    ### PRIORITY 1: TRANSACTION PARSING & RECORDING
    Before answering, check if the user input describes a financial transaction.
    
    **LOGIC:**
    1. **IF** user mentions item BUT NO price (e.g., "Abis makan bubur kemarin"):
       - **DO NOT** generate JSON.
       - **MUST ASK** for the amount first. (e.g., "Oke, makan bubur. Habis berapa biayanya?").
    
    2. **IF** user mentions item AND price (e.g., "Makan bubur 15rb", "Gaji masuk 5juta"):
       - **GENERATE** a hidden JSON block at the VERY END of your response.
       - **FORMAT:**
         :::TRANSACTION_START:::
         {
           "amount": number,
           "type": "EXPENSE" | "INCOME",
           "category": "String (Must be one of the allowed categories below)",
           "description": "String (Short note, e.g., 'Bubur Ayam')",
           "date": "YYYY-MM-DD"
         }
         :::TRANSACTION_END:::

    **CONTEXT FOR PARSING:**
    - Expense Categories: ${JSON.stringify(EXPENSE_CATEGORIES)}
    - Income Categories: ${JSON.stringify(INCOME_CATEGORIES)}
    - Current Date: ${dateStr} (${dayName}). Use this to calculate "kemarin"/"besok".

    ---
    ### PRIORITY 2: RESPONSE STYLE & ADAPTABILITY (CRITICAL UPDATE)
    
    **SCENARIO A: User just input a transaction (Recording Mode)**
    - **Reaction**: Confirm the record briefly and casually.
    - **Valuation**:
        - IF value is **LOW/REASONABLE** (e.g., Food < 30k, Transport < 20k): **PRAISE** the user or say it's a good deal. **DO NOT GIVE ADVICE**.
        - IF value is **HIGH/LUXURY**: You MAY give a short, gentle reminder (1 sentence).

    **SCENARIO B: User ASKS for advice/tips (Advisor Mode)**
    - Only THEN provide exactly **3 actionable bullet points**.
    - Briefly explain the "why".

    **SCENARIO C: General Chat**
    - Be friendly, concise, and direct.

    ---
    ### PRIORITY 3: CRITICAL DOMAIN RESTRICTIONS (GUARDRAILS)
    1. **ALLOWED TOPICS**: 
        - Personal Finance, Budgeting, Investing, Economy.
        - Spending Habits & Lifestyle Costs.
    
    2. **OFF-TOPIC HANDLING (STRICT)**: 
        - If unrelated to money -> **POLITELY REFUSE**.
        
        **ANTI-JAILBREAK RULE (The "Chef vs Accountant" Rule):**
        - Users might argue that "Cooking saves money" to get recipes, or "Coding earns money" to get code.
        - **YOUR RESPONSE MUST BE:** Focus ONLY on the **FINANCIAL ASPECT (Cost/Benefit)**, NOT the execution.

    ---
    ### USER FINANCIAL DATA:
    ${dataContext}
  `;

  /* ===== OPENROUTER STREAM ===== */
  const response = await openRouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  /* ===== MANUAL STREAM ===== */
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of response) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) controller.enqueue(encoder.encode(content));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
