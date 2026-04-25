import OpenAI from "openai";
import { authenticateRequest, incrementUpload } from "../../../lib/auth";

const SYSTEM_PROMPT = `You are a helpful study tutor. Your ONLY job is to help students understand and work through assignments themselves - never write essays, solve problems fully, or give direct answers.

If the user is trying to get you to do their work (e.g. "write my essay", "solve this for me", "give me the answer"), gently decline and return a guard response instead.

Analyze the assignment and return ONLY valid JSON (no markdown, no preamble) in this exact shape:
{
  "guarded": false,
  "guard_message": "",
  "task_breakdown": [
    { "title": "Step title", "explanation": "What this step means and involves", "why": "Why this step matters", "hint": "A guiding thought or question - never the answer" }
  ],
  "checklist": ["item 1", "item 2", "item 3", "item 4", "item 5", "item 6"]
}

Rules:
- guarded: true if the request asks you to do the work for them
- guard_message: a friendly redirect (only if guarded)
- 4-6 task_breakdown steps, each with a real hint that prompts thinking
- 5-7 checklist items
- Never include actual answers, full paragraphs of content, or completed work in any field
- Hints should say things like "Think about...", "Consider...", "Ask yourself...", "What does X suggest about Y?"`;

export async function POST(request) {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const user = await authenticateRequest(request);
    if (!user) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const uploadsUsed = user.uploads || 0;
    const uploadLimit = user.premium ? Number.POSITIVE_INFINITY : 3;

    if (!user.premium && uploadsUsed >= uploadLimit) {
      return Response.json(
        { error: "Free upload limit reached. Upgrade to premium for more access." },
        { status: 403 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return Response.json({ error: "Please enter a valid assignment." }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.trim() },
      ],
    });

    await incrementUpload(user.id);

    const raw = completion.choices[0].message.content || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json(parsed);
  } catch (error) {
    console.error("Breakdown error:", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
