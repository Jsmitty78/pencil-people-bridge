import { NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 6000;
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_URL = `${OLLAMA_BASE_URL}/api/chat`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:4b";

const SYSTEM_PROMPT = `You are PENCIL Context Bridge, a pre-send context-check assistant for workplace communication in Japan.
The product idea is: 「情報は伝わっている。でも、共通理解として残っていない。」 and 「翻訳から、共通理解へ。」

Your job is to inspect a draft work message BEFORE it is sent and determine whether the recipient has enough context to act with the same understanding as the sender.

Check these dimensions:
1. 目的 / Purpose — why this message is being sent.
2. 背景・経緯 / Background — context needed to understand why now.
3. 依頼タスク / Requested action — exactly what the recipient should do.
4. 期待する成果物・完了条件 / Expected output & definition of done.
5. 担当者 / Owner — who is responsible for the action.
6. 期限 / Deadline — exact date/time when needed, when relevant.
7. 参照先 / Reference — link, ticket, document, prior message, or example when the draft depends on one.
8. 決定権者・確認者 / Decision or approval owner — who confirms completion when relevant.
9. あいまい表現 / Ambiguity — phrases like 「前と同じ」「いつもの感じ」「例の件」「なるべく早く」, missing subjects, or assumptions that depend on shared memory.
10. 指示の矛盾 / Conflicting instructions — different deadlines, formats, owners, or directions.

Patterns found in anonymized PENCIL HR communication examples that should guide the check:
- A message that only shares a document/link can be unclear if it does not state WHY it is being shared, WHAT the recipient should do, or whether it is simply information, a deliverable, or a review request.
- 「面談までに」 may be too vague when the exact meeting time/deadline matters. Prefer an exact deadline if the sender knows it; otherwise leave a confirmation placeholder.
- 「具体的に」 means clarifying 「いつまでに、何を、どうする」, not just adding more words.
- A task is not necessarily complete when the sender finishes their part if approval/review is part of the completion condition. Make the reviewer/approval step explicit when relevant.
- If a message is resent or corrected in a way that could look like a duplicate or mistake, explain the reason for the resend/edit.
- Before acting on an ambiguous instruction, confirm the interpretation instead of inventing a new task, format, or deliverable.
- If a company/team already uses an established format or process, do not assume the sender has authority to replace it. Flag the need to confirm any format/process change.

Rules:
- Do NOT judge politeness, hierarchy, personality, competence, nationality, or intent.
- Do NOT diagnose or infer ADHD, autism, mental-health conditions, personality type, or protected/sensitive traits.
- Do NOT make hiring, firing, discipline, promotion, compensation, legal, or performance decisions.
- Do NOT invent facts. Missing information must stay missing.
- In the improved Japanese message, use 【要確認: ...】 for information that is needed but not present in the draft.
- Keep the sender's original purpose and tone as much as possible. Improve clarity, not personality.
- Respond in Japanese for explanations. If English output is requested, improved_en may be English; otherwise it must be an empty string.

Return ONLY valid JSON matching the provided schema. No markdown or code fences.`;

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    clarity_score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          status: { type: "string", enum: ["clear", "unclear", "missing"] },
          note: { type: "string" },
        },
        required: ["label", "status", "note"],
      },
    },
    risks: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } },
    improved_ja: { type: "string" },
    improved_en: { type: "string" },
  },
  required: ["clarity_score", "summary", "items", "risks", "questions", "improved_ja", "improved_en"],
} as const;

type Status = "clear" | "unclear" | "missing";
type ContextItem = { label: string; status: Status; note: string };
type Analysis = {
  clarity_score: number;
  summary: string;
  items: ContextItem[];
  risks: string[];
  questions: string[];
  improved_ja: string;
  improved_en: string;
};

function normalizeStringArray(value: unknown, maxItems = 8) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, maxItems)
    : [];
}

function parseAnalysis(content: string): Analysis {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Ollama returned a non-object analysis.");
  }

  const record = parsed as Record<string, unknown>;
  const rawScore = Number(record.clarity_score);
  const items = Array.isArray(record.items)
    ? record.items.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
        const item = entry as Record<string, unknown>;
        const status: Status = item.status === "clear" || item.status === "unclear" || item.status === "missing"
          ? item.status
          : "missing";
        const label = typeof item.label === "string" ? item.label.trim() : "";
        const note = typeof item.note === "string" ? item.note.trim() : "";
        return label ? [{ label, status, note }] : [];
      }).slice(0, 12)
    : [];

  return {
    clarity_score: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0,
    summary: typeof record.summary === "string" ? record.summary.trim() : "",
    items,
    risks: normalizeStringArray(record.risks, 5),
    questions: normalizeStringArray(record.questions, 5),
    improved_ja: typeof record.improved_ja === "string" ? record.improved_ja.trim() : "",
    improved_en: typeof record.improved_en === "string" ? record.improved_en.trim() : "",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const channel = ["chatwork", "backlog", "email", "other"].includes(body?.channel) ? body.channel : "other";
    const withEnglish = Boolean(body?.withEnglish);

    if (!message) {
      return NextResponse.json({ error: "送信予定のメッセージを入力してください。" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `入力は${MAX_MESSAGE_LENGTH.toLocaleString()}文字以内にしてください。` }, { status: 400 });
    }

    let response: Response;
    try {
      response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          think: false,
          format: analysisSchema,
          options: { temperature: 0 },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `【送信先ツール】${channel}\n【英語版】${withEnglish ? "必要" : "不要"}\n\n【メッセージ下書き】\n${message}`,
            },
          ],
        }),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      console.error("Could not connect to Ollama:", error);
      return NextResponse.json(
        { error: "ローカルAIに接続できません。Ollamaが起動し、qwen3:4bが利用可能か確認してください。" },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const details = await response.text();
      console.error(`Ollama returned ${response.status}:`, details);
      return NextResponse.json(
        { error: "ローカルAIの応答に失敗しました。Ollamaにqwen3:4bがインストールされているか確認してください。" },
        { status: 502 }
      );
    }

    const ollamaResponse: unknown = await response.json();
    const content =
      ollamaResponse &&
      typeof ollamaResponse === "object" &&
      "message" in ollamaResponse &&
      ollamaResponse.message &&
      typeof ollamaResponse.message === "object" &&
      "content" in ollamaResponse.message &&
      typeof ollamaResponse.message.content === "string"
        ? ollamaResponse.message.content
        : "";

    if (!content) {
      return NextResponse.json({ error: "ローカルAIから正しい形式の応答を取得できませんでした。" }, { status: 502 });
    }

    let analysis: Analysis;
    try {
      analysis = parseAnalysis(content);
    } catch (error) {
      console.error("Ollama returned invalid context-check JSON:", error);
      return NextResponse.json({ error: "ローカルAIから正しい形式の分析結果を取得できませんでした。もう一度お試しください。" }, { status: 502 });
    }

    if (!withEnglish) analysis.improved_en = "";
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Context Bridge analysis failed:", error);
    return NextResponse.json({ error: "共通理解チェックに失敗しました。入力内容を確認して、もう一度お試しください。" }, { status: 500 });
  }
}
