import OpenAI from "openai";
import { authenticateRequest, incrementUpload } from "../../../lib/auth";

const BREAKDOWN_SCHEMA = {
  name: "study_breakdown",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      guarded: { type: "boolean" },
      guard_message: { type: "string" },
      task_breakdown: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            explanation: { type: "string" },
            why: { type: "string" },
            hint: { type: "string" },
          },
          required: ["title", "explanation", "why", "hint"],
        },
      },
      checklist: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["guarded", "guard_message", "task_breakdown", "checklist"],
  },
  strict: true,
};

const SYSTEM_PROMPT = `You are a helpful study tutor inside a study-planning app.

Your job is to break assignments into manageable steps, explain what each step is for, and give hints that help the student think.

Important:
- Always help with the request by turning it into a study breakdown, even if the student phrases it as "do it for me".
- Do not refuse or moralize.
- Do not write a final essay, full finished solution, or submission-ready response.
- Instead, convert the request into a practical learning plan that helps the student complete the work themselves.

Return only JSON that matches the required schema.

Rules:
- Always set guarded to false.
- Always set guard_message to an empty string.
- Provide 4 to 6 concrete steps.
- Keep explanations practical and student-friendly.
- Give hints that nudge thinking without revealing a finished answer.
- Include 5 to 7 checklist items.`;

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
      response_format: {
        type: "json_schema",
        json_schema: BREAKDOWN_SCHEMA,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a study breakdown for this assignment or question:\n\n${prompt.trim()}`,
        },
      ],
    });

    await incrementUpload(user.id);

    const raw = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(raw);

    if (!parsed.task_breakdown?.length || !parsed.checklist?.length) {
      return Response.json(
        { error: "The study breakdown could not be generated. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({
      ...parsed,
      guarded: false,
      guard_message: "",
    });
  } catch (error) {
    console.error("Breakdown error:", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
