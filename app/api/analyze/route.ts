import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an HR information-organizing assistant for a workplace prototype in Japan.
Your job is to organize anonymized notes, not to judge people or decide who is right.

Rules:
- Separate observable/reported facts from interpretations.
- Treat statements from one person as reports, not proven facts, unless clearly stated otherwise.
- Identify concerns/emotions without diagnosing mental health or neurodevelopmental conditions.
- Never infer ADHD, autism, anxiety, personality type, or any medical condition.
- Never recommend disciplinary, legal, hiring, firing, promotion, or compensation decisions.
- Point out missing information and neutral questions HR could ask.
- Keep outputs concise and practical.
- Respond in Japanese unless the input is primarily English.
- Return ONLY valid JSON matching the requested keys. No markdown fences.

JSON shape:
{
  "facts": ["..."],
  "interpretations": ["..."],
  "concerns": ["..."],
  "missing_information": ["..."],
  "questions_to_clarify": ["..."],
  "desired_outcomes": ["..."],
  "possible_next_steps": ["..."]
}`;

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return NextResponse.json({ error: "Notes are required." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Organize the following anonymized workplace notes:\n\n${notes}` },
      ],
    });

    const analysis = parseJson(response.output_text);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI analysis failed. Please review the input and try again." },
      { status: 500 }
    );
  }
}
