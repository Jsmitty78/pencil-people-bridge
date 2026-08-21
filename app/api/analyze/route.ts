import { NextResponse } from "next/server";

const MAX_NOTES_LENGTH = 8000;
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_URL = `${OLLAMA_BASE_URL}/api/chat`;
const OLLAMA_MODEL = "qwen3:4b";

const SYSTEM_PROMPT = `You are an HR information-organizing assistant for a workplace prototype in Japan.
Your job is to organize anonymized workplace notes, not to judge people or decide who is right.

Rules:
- Do not decide who is right or wrong.
- Separate observable or reported facts from interpretations.
- Treat one employee's statements as reported claims, not verified facts.
- Identify concerns or emotions without diagnosing or inferring ADHD, autism, anxiety, personality type, mental health conditions, or medical conditions.
- Never recommend firing, discipline, hiring, promotion, compensation, or legal decisions.
- If something is unknown, say it is unknown rather than inventing it.
- Point out missing information and neutral questions HR could ask.
- Human HR review is always required. Possible next steps must be neutral information-gathering or conversation-preparation steps for HR review.
- Keep outputs concise and practical.
- Respond in Japanese unless the input is primarily English.
- If a category cannot be supported by the notes, return an empty array rather than inventing information.

Output requirements:
- Every item in facts must explicitly say it is from the notes or a person's report (for example, 「メモによると」「本人は〜と述べている」「〜は未確認」). Never rewrite a claim as an established event.
- A person's diagnostic speculation is not a fact to investigate. Do not repeat the diagnostic label or ask questions seeking evidence for it; describe it only as an unsupported health-related assumption if relevant.
- desired_outcomes may neutrally record what a person requested, but must state that prohibited personnel or legal decisions are not being endorsed or assessed.
- Every questions_to_clarify item must be a neutral, practical question ending in a question mark. Ask what was observed, recorded, understood, or desired; do not write a task or a leading question.
- possible_next_steps may only cover record checking, hearing relevant perspectives, clarifying needs/process, and preparation for human HR review.
- possible_next_steps should be concise action candidates that help with the next conversation. Name the record, perspective, or conversation involved. Avoid vague phrases such as 「適切な対応」. Do not present candidates as mandatory instructions.`;

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

type AnalysisKey = keyof typeof analysisSchema.properties;

const analysisKeys = Object.keys(analysisSchema.properties) as AnalysisKey[];

const diagnosisPattern = /ADHD|注意欠如|多動|自閉|autis|アスペルガー|不安障害|anxiety disorder|人格障害|性格タイプ|MBTI|精神疾患|精神障害|メンタルヘルス|発達障害|神経発達|うつ病|鬱病|双極性障害|統合失調症|PTSD|mental health|medical condition/i;
const prohibitedDecisionPattern = /解雇|クビ|辞めさせ|退職させ|契約解除|懲戒|処分|罰する|警告処分|採用|雇用|雇入|昇進|昇格|降格|減給|報酬|給与|賃金|賞与|ボーナス|法的|法務|訴訟|告訴|弁護士|シフトから外す|\bfire\b|firing|dismiss|terminat|disciplin|\bhir(e|ing)\b|promot|demot|compensation|salary|legal action|lawsuit|lawyer/i;
const vagueActionPattern = /適切な対応|必要な対応|何らかの対応|対応を提案/i;
const reportedDecisionRequest = "相談者は特定の人事対応を求めている";
const humanReviewDecisionRequest = `${reportedDecisionRequest}（要望の記録のみ。人間のHRによる確認と判断が必要で、AIは妥当性を判断・推奨しない）`;

const expressedConcernMarkers: Array<[RegExp, string]> = [
  [/混乱|confus/i, "相談者は混乱を表明している"],
  [/ストレス|stress/i, "相談者はストレスを表明している"],
  [/不安|anxious|anxiety/i, "相談者は不安を表明している"],
  [/不公平|unfair/i, "相談者は不公平感を表明している"],
  [/怒|angry|anger/i, "相談者は怒りを表明している"],
  [/心配|worr/i, "相談者は心配を表明している"],
  [/恐れ|怖|fear/i, "相談者は恐れを表明している"],
];

function normalizeQuestion(item: string) {
  const question = item
    .replace(/[。？！?!]+$/, "")
    .replace(/確認してください$/, "確認できますか")
    .replace(/教えてください$/, "教えていただけますか")
    .replace(/説明してください$/, "説明していただけますか")
    .replace(/を確認する$/, "を確認できますか")
    .trim();

  return `${question}？`;
}

function parseAnalysis(content: string, notes: string) {
  const parsed: unknown = JSON.parse(content);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Ollama returned a non-object analysis.");
  }

  const record = parsed as Record<string, unknown>;
  const analysis = Object.fromEntries(
    analysisKeys.map((key) => {
      const value = record[key];
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error(`Ollama returned an invalid ${key} field.`);
      }

      let safeItems = value.map((item) => item.trim()).filter(Boolean);

      if (key === "facts") {
        safeItems = safeItems
          .filter((item) => !diagnosisPattern.test(item))
          .map((item) =>
            prohibitedDecisionPattern.test(item)
              ? `メモ上の報告（未検証）：${reportedDecisionRequest}`
              : `メモ上の報告（未検証）：${item}`
          );
      } else {
        safeItems = safeItems.filter((item) => !diagnosisPattern.test(item));
      }

      safeItems = safeItems.filter((item) =>
        expressedConcernMarkers.every(
          ([pattern]) => !pattern.test(item) || pattern.test(notes)
        )
      );

      if (["interpretations", "concerns", "missing_information", "questions_to_clarify", "possible_next_steps"].includes(key)) {
        safeItems = safeItems.filter((item) => !prohibitedDecisionPattern.test(item));
      }

      if (key === "possible_next_steps") {
        safeItems = safeItems.filter((item) => !vagueActionPattern.test(item));
      }

      if (key === "questions_to_clarify") {
        safeItems = safeItems.map(normalizeQuestion);
      }

      if (key === "desired_outcomes") {
        safeItems = safeItems.map((item) =>
          prohibitedDecisionPattern.test(item)
            ? humanReviewDecisionRequest
            : item
        );
      }

      return [key, [...new Set(safeItems)]];
    })
  );

  if (prohibitedDecisionPattern.test(notes)) {
    const typedAnalysis = analysis as Record<AnalysisKey, string[]>;
    typedAnalysis.facts = [...new Set([
      ...typedAnalysis.facts,
      `メモ上の報告（未検証）：${reportedDecisionRequest}`,
    ])];
    typedAnalysis.desired_outcomes = [...new Set([
      ...typedAnalysis.desired_outcomes,
      humanReviewDecisionRequest,
    ])];
  }

  const typedAnalysis = analysis as Record<AnalysisKey, string[]>;
  const explicitlyExpressedConcerns = expressedConcernMarkers
    .filter(([pattern]) => pattern.test(notes))
    .map(([, concern]) => concern);
  typedAnalysis.concerns = [...new Set([
    ...typedAnalysis.concerns,
    ...explicitlyExpressedConcerns,
  ])];

  return analysis;
}

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
              content: `次の匿名化された職場相談メモを整理してください。\n\n${notes}`,
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

    let ollamaResponse: unknown;
    try {
      ollamaResponse = await response.json();
    } catch (error) {
      console.error("Ollama returned invalid response JSON:", error);
      return NextResponse.json(
        { error: "ローカルAIから正しい形式の応答を取得できませんでした。もう一度お試しください。" },
        { status: 502 }
      );
    }
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
      console.error("Ollama returned no message content.");
      return NextResponse.json(
        { error: "ローカルAIから正しい形式の応答を取得できませんでした。もう一度お試しください。" },
        { status: 502 }
      );
    }

    let analysis;
    try {
      analysis = parseAnalysis(content, notes);
    } catch (error) {
      console.error("Ollama returned invalid analysis JSON:", error);
      return NextResponse.json(
        { error: "ローカルAIから正しい形式の分析結果を取得できませんでした。もう一度お試しください。" },
        { status: 502 }
      );
    }
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("HR Issue Organizer analysis failed:", error);
    return NextResponse.json(
      { error: "AI分析に失敗しました。入力内容を確認して、もう一度お試しください。" },
      { status: 500 }
    );
  }
}
