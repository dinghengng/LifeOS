const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

//Turns a structured weekly insights payload into 3-4 sentences of natural, encouraging digest text. Returns null on any failure so callers can fall back to a static template 
async function generateDigestNarration(payload) {
  if (!process.env.GROQ_API_KEY) {
    console.warn("[groqClient] GROQ_API_KEY not set, skipping narration");
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // don't hang the cron job

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a concise, encouraging productivity and wellbeing coach for a personal " +
              "life-management app called LifeOS. Given a JSON object of a user's weekly stats " +
              "(habits, mood, goals, tasks), write 3-4 short sentences of natural digest text. " +
              "Be specific — reference actual numbers and habit/goal names from the data. " +
              "No markdown, no headers, no bullet points, no emoji. Plain encouraging prose only. " +
              "If a stat is missing or has too little data, just skip it rather than mentioning the gap.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[groqClient] Groq API returned ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.error("[groqClient] Narration generation failed:", err.message);
    return null;
  }
}

module.exports = { generateDigestNarration };