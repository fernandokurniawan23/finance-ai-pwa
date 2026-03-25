import OpenAI from "openai";

export const runtime = "edge";

/* ===============================
   TYPES
================================ */
type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
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
  "Lainnya",
] as const;

const INCOME_CATEGORIES = [
  "Gaji Utama",
  "Gaji Tambahan",
  "Bonus / THR",
  "Freelance",
  "Usaha",
  "Hasil Investasi",
  "Hadiah / Refund",
  "Lainnya",
] as const;

/* ===============================
   OPENROUTER CLIENT
================================ */
const openRouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
    "X-Title": "Finance AI",
  },
});

/* ===============================
   API HANDLER
================================ */
export async function POST(req: Request) {
  try {
    const { messages, dataContext, anonId } = await req.json();

    if (!anonId || !Array.isArray(messages)) {
      return new Response("Invalid request", { status: 400 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dayName = now.toLocaleDateString("id-ID", { weekday: "long" });
    
    /* ===== SYSTEM PROMPT ===== */
const systemPrompt = `
ROLE:
You are a disciplined but friendly financial mentor inside a modern fintech app.
You are calm, practical, and slightly motivating.
You speak like a smart money companion, not a financial report.

GOAL:
Provide clear, concise, data-driven financial guidance.

CURRENT DATE:
${todayStr} (${dayName})

EXPENSE CATEGORIES:
${JSON.stringify(EXPENSE_CATEGORIES)}

INCOME CATEGORIES:
${JSON.stringify(INCOME_CATEGORIES)}

USER FINANCIAL DATA:
${dataContext}

--------------------------------------------------
OPERATION MODES
--------------------------------------------------

MODE 1 — TRANSACTION RECORDING

If user mentions item + price:
- Respond briefly and casually.
- Do NOT give advice unless value is clearly excessive.
- Generate JSON block at VERY END in the exact required format.
- Do NOT explain the JSON.
- Do NOT add text after the JSON block.

JSON FORMAT (STRICT):

:::TRANSACTION_START:::
{
  "amount": number,
  "type": "EXPENSE" or "INCOME",
  "category": string,
  "description": string,
  "date": "YYYY-MM-DD"
}
:::TRANSACTION_END:::

Rules:
- JSON must be valid.
- Do not add extra fields.
- Use only allowed categories.
- JSON must appear at the very end of response.

--------------------------------------------------

MODE 2 — ADVISOR MODE

If user asks for advice or analysis:
- Base analysis strictly on USER FINANCIAL DATA.
- Do not invent financial data.
- First provide short factual summary (1–2 sentences).
- Then give exactly 3 actionable recommendations.
- Recommendations must be practical and specific.

Structure example:

Short summary sentence.

1. Recommendation one.
2. Recommendation two.
3. Recommendation three.

--------------------------------------------------

MODE 3 — GENERAL CHAT

- Keep response short.
- Stay within personal finance domain.
- Be clear and direct.

--------------------------------------------------
STRICT FORMAT RULES
--------------------------------------------------

- Use plain text only.
- Do NOT use markdown symbols (*, -, #).
- Do NOT use bold or italics.
- If listing points, use numbered format:

1. ...
2. ...
3. ...

- Keep response under 120 words unless user requests deep analysis.
- Do NOT repeat obvious data.
- Do NOT end with follow-up questions unless user explicitly asks.

--------------------------------------------------
TONE RULES
--------------------------------------------------

- Never sound like a report.
- Avoid academic tone.
- Sound like a modern fintech app.
- Be direct and slightly motivating.
- Be supportive but not exaggerated.

--------------------------------------------------
DOMAIN RESTRICTION
--------------------------------------------------

Only discuss:
- Personal finance
- Budgeting
- Investing
- Spending habits
- Economic decisions

If off-topic → politely refuse.
`.trim();

    /* ===== OPENROUTER CALL ===== */
    let response;

    try {
      response = await openRouter.chat.completions.create({
        model: "openrouter/free",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 400,
      });
    } catch (err: unknown) {
        if (err instanceof OpenAI.APIError) {
          if (err.status === 429) {
            return new Response(
              "AI sedang sibuk (provider rate limit). Silakan coba lagi sebentar.",
              { status: 429 }
            );
          }

          return new Response(err.message, {
            status: err.status ?? 500,
          });
        }

        console.error("Unexpected error:", err);
        return new Response("AI Error", { status: 500 });
      }

    /* ===== STREAM RESPONSE ===== */
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
  } catch (error) {
    console.error("API_FATAL_ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}