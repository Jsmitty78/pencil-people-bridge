import OpenAI from "openai";
import { NextResponse } from "next/server";

const MAX_NOTES_LENGTH = 8000;

const SYSTEM_PROMPT = `You are an HR information-organizing assistant for a workplace prototype in Japan.
Your job is to organize anonymized workplace notes, not to judge people or decide who is right.

Rules:
- Separate observable or reported facts from interpretations.
- Treat statements from one person as reports, not proven facts, unless clearly stated otherwise.
- Identify concerns or emotions without diagnosing mental health or neurodevelopmental conditions.
- Never infer ADHD, autism, anxiety, personality type, or any medical condition.
- Never recommend disciplinary, legal, hiring, firing, promotion, or compensation decisions.
- Point out missing information and neutral questions HR could ask.
- Keep outputs concise and practical.
- Respond in Japanese unless the input is primarily English.
- If a category cannot be supported by the notes, return an empty array rather than inventing information.`;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    facts: { type: "array", items: { type: "string" } },
    interpretations: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    missing_information: { type: "array", items: { type: "string" } },
    questions_to_clarify: { type: "array", items: { type: "string" } },
    desired_outcomes: { type: "array", items: { type: "string" } },
    possible_next_steps: { type: "array", items: { type: "string" } },
  },
  required: [
    "facts",
    "interpretations",
    "concerns",
    "missing_information",
    "questions_to_clarify",
    "desired_outcomes",
    "possible_next_steps",
  ],
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!notes) {
      return NextResponse.json({ error: "相談内容を入力してください。" }, { status: 400 });
    }

    if (notes.length > MAX_NOTES_LENGTH) {
      return NextResponse.json(
        { error: `入力は${MAX_NOTES_LENGTH.toLocaleString()}文字以内にしてください。` },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY が設定されていません。" },
        { status: 503 }
      );
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      instructions: SYSTEM_PROMPT,
      input: `次の匿名化された職場相談メモを整理してください。\n\n${notes}`,
      text: {
        format: {
          type: "json_schema",
          name: "hr_issue_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    });

    if (!response.output_text) {
      throw new Error("Model returned no output text.");
    }

    const analysis = JSON.parse(response.output_text);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("HR Issue Organizer analysis failed:", error);
    return NextResponse.json(
      { error: "AI分析に失敗しました。入力内容を確認して、もう一度お試しください。" },
      { status: 500 }
    );
  }
}
