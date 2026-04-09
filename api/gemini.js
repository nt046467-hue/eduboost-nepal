export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "Gemini function is reachable.",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS, GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(req.body || "{}");
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON payload." });
  }

  const { prompt, systemContext = "" } = payload;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server misconfigured: GEMINI_API_KEY is not set.",
    });
  }

  const fullPrompt = systemContext
    ? `${systemContext.trim()}\n\n${prompt.trim()}`
    : prompt.trim();

  const geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

  const requestBody = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ],
  };

  try {
    const response = await fetch(
      `${geminiUrl}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error) {
      const message =
        data?.error?.message || data?.error || `HTTP ${response.status}`;
      return res.status(502).json({ error: `Gemini API error: ${message}` });
    }

    const candidate = data?.candidates?.[0];
    if (!candidate) {
      return res.status(502).json({ error: "No response returned from Gemini." });
    }

    if (candidate.finishReason === "SAFETY") {
      return res.status(502).json({
        error: "Gemini blocked the response due to safety filters.",
      });
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: "Gemini returned an empty response." });
    }

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({
      error: err.message || "Unknown Gemini proxy error.",
    });
  }
}