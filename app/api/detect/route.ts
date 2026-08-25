import { NextResponse } from "next/server";

type Source = "meeting" | "backlog" | "chatwork";
type SignalKind = "rework" | "contradiction" | "off_record" | "cross_channel";
type Lang = "ja" | "en";

type LogEntry = {
  id: string;
  source: Source;
  date: string;
  authorRole: string;
  text: string;
};

type IssueInput = {
  issueId: string;
  title: string;
  departmentAverage: number;
  reworkThreshold: number;
  statusEvents: string[];
  entries: LogEntry[];
};

type Contradiction = {
  issueId: string;
  entryAId: string;
  entryBId: string;
  explanation: string;
};

type Signal = {
  kind: SignalKind;
  label: string;
  summary: string;
  evidence: LogEntry[];
};

type ContradictionRule = {
  decision: RegExp;
  laterInstruction: RegExp;
  explanationJa: string;
  explanationEn: string;
};

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:4b";
const ENABLE_LOCAL_NLI = process.env.ENABLE_LOCAL_NLI === "true";
const MAX_ISSUES = 20;
const MAX_ENTRIES_PER_ISSUE = 60;
const MAX_TEXT_LENGTH = 1500;

const OFF_RECORD_PATTERN = /口頭|先ほど話|昨日話|前回と同じ|さっきの|別途相談|as discussed|verbally|talked earlier|same as before/i;

const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    decision: /シンプル|要素を絞|情報量を抑|simplicity|limited elements/i,
    laterInstruction: /追加|増や|情報量|もっと|add more|more selling points/i,
    explanationJa: "会議では情報を絞る方針でしたが、実行段階では情報を増やす指示が出ています。",
    explanationEn: "The meeting set a reduced-content direction, but the execution instruction asks for more content.",
  },
  {
    decision: /金曜|Friday/i,
    laterInstruction: /木曜|Thursday|月曜|Monday/i,
    explanationJa: "会議と実行チャネルで締切日が異なっています。",
    explanationEn: "The deadline differs between the meeting record and the execution channel.",
  },
  {
    decision: /英語.*日本語|日本語.*英語|both English and Japanese|bilingual/i,
    laterInstruction: /日本語のみ|英語版は不要|Japanese only|English.*not needed/i,
    explanationJa: "会議では日英両方が必要とされましたが、実行指示では日本語のみになっています。",
    explanationEn: "The meeting requested both languages, but the execution instruction requests Japanese only.",
  },
  {
    decision: /業務終了時|当日中|end of (the )?day|before leaving/i,
    laterInstruction: /朝10時|午前10時|10[:：]?00|10 AM|10 a\.m\./i,
    explanationJa: "提出期限が「当日中」と「翌朝10時」で一致していません。",
    explanationEn: "The submission rule differs between end of day and 10:00 AM.",
  },
  {
    decision: /モバイル版のみ|mobile only/i,
    laterInstruction: /デスクトップ版.*モバイル版|モバイル版.*デスクトップ版|desktop and mobile|mobile and desktop/i,
    explanationJa: "対象範囲がモバイルのみからデスクトップを含む内容へ変わっています。",
    explanationEn: "The scope changes from mobile only to both desktop and mobile.",
  },
  {
    decision: /最終承認.*部長|部長.*最終承認|director.*final approval|final approval.*director/i,
    laterInstruction: /チームリーダー.*確認|team lead.*approv|manager.*approv/i,
    explanationJa: "公開前の最終承認者が、会議と実行指示で異なっています。",
    explanationEn: "The final approver differs between the meeting decision and the execution instruction.",
  },
  {
    decision: /メール添付|email attachment|attach.*email/i,
    laterInstruction: /Backlog.*共有リンク|Backlog.*link|shared link.*Backlog/i,
    explanationJa: "納品方法がメール添付とBacklog共有リンクで一致していません。",
    explanationEn: "The delivery method differs between an email attachment and a Backlog link.",
  },
  {
    decision: /plain Japanese|simple Japanese|敬語.*不要|わかりやすさ.*優先/i,
    laterInstruction: /正式な敬語|必ず.*敬語|formal keigo|must use.*keigo/i,
    explanationJa: "外国籍スタッフ向けの文体ルールが、平易な日本語と正式な敬語で一致していません。",
    explanationEn: "The writing rule for foreign staff differs between plain Japanese and mandatory formal keigo.",
  },
];

const contradictionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    contradictions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          issue_id: { type: "string" },
          entry_a_id: { type: "string" },
          entry_b_id: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["issue_id", "entry_a_id", "entry_b_id", "explanation"],
      },
    },
  },
  required: ["contradictions"],
} as const;

function validateIssues(value: unknown): IssueInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ISSUES) {
    throw new Error(`issues must contain 1–${MAX_ISSUES} items.`);
  }

  return value.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid issue object.");
    const issue = raw as Partial<IssueInput>;
    if (
      typeof issue.issueId !== "string" ||
      typeof issue.title !== "string" ||
      typeof issue.departmentAverage !== "number" ||
      typeof issue.reworkThreshold !== "number" ||
      !Array.isArray(issue.statusEvents) ||
      !Array.isArray(issue.entries) ||
      issue.entries.length > MAX_ENTRIES_PER_ISSUE
    ) {
      throw new Error("Invalid issue fields.");
    }

    const entries = issue.entries.map((rawEntry) => {
      if (!rawEntry || typeof rawEntry !== "object") throw new Error("Invalid log entry.");
      const entry = rawEntry as Partial<LogEntry>;
      if (
        typeof entry.id !== "string" ||
        !["meeting", "backlog", "chatwork"].includes(entry.source || "") ||
        typeof entry.date !== "string" ||
        typeof entry.authorRole !== "string" ||
        typeof entry.text !== "string" ||
        entry.text.length > MAX_TEXT_LENGTH
      ) {
        throw new Error("Invalid log entry fields.");
      }
      return entry as LogEntry;
    });

    return {
      issueId: issue.issueId,
      title: issue.title,
      departmentAverage: issue.departmentAverage,
      reworkThreshold: issue.reworkThreshold,
      statusEvents: issue.statusEvents.filter((event): event is string => typeof event === "string"),
      entries,
    };
  });
}

function explicitContradictions(issues: IssueInput[], lang: Lang): Contradiction[] {
  const results: Contradiction[] = [];

  for (const issue of issues) {
    const meetings = issue.entries.filter((entry) => entry.source === "meeting");
    const execution = issue.entries.filter((entry) => entry.source !== "meeting");

    for (const meeting of meetings) {
      for (const action of execution) {
        for (const rule of CONTRADICTION_RULES) {
          if (!rule.decision.test(meeting.text) || !rule.laterInstruction.test(action.text)) continue;
          results.push({
            issueId: issue.issueId,
            entryAId: meeting.id,
            entryBId: action.id,
            explanation: lang === "en" ? rule.explanationEn : rule.explanationJa,
          });
        }
      }
    }
  }

  return results;
}

async function localNli(issues: IssueInput[], lang: Lang): Promise<Contradiction[] | null> {
  if (!ENABLE_LOCAL_NLI) return null;

  const compactIssues = issues.map((issue) => ({
    issue_id: issue.issueId,
    entries: issue.entries.map((entry) => ({ id: entry.id, source: entry.source, text: entry.text })),
  }));

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        think: false,
        format: contradictionSchema,
        options: { temperature: 0 },
        messages: [
          {
            role: "system",
            content: "Compare operational records grouped by work issue. Return only explicit instruction contradictions. Do not infer emotion, intent, blame, performance, personality, culture, health, or legal conclusions. A changed instruction is only a review signal, not proof of a problem. Return an empty array when the text does not support a contradiction.",
          },
          {
            role: "user",
            content: `Find explicit contradictions between instructions for the same issue. Prefer comparisons between meeting decisions and Backlog or Chatwork instructions. Explain in ${lang === "en" ? "English" : "Japanese"}.\n\n${JSON.stringify(compactIssues)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;
    const body = await response.json();
    const content = body?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content) as { contradictions?: Array<{ issue_id?: unknown; entry_a_id?: unknown; entry_b_id?: unknown; explanation?: unknown }> };
    if (!Array.isArray(parsed.contradictions)) return null;

    const validIds = new Set(issues.flatMap((issue) => issue.entries.map((entry) => entry.id)));
    const validIssues = new Set(issues.map((issue) => issue.issueId));
    return parsed.contradictions.flatMap((item) => {
      if (
        typeof item.issue_id !== "string" ||
        typeof item.entry_a_id !== "string" ||
        typeof item.entry_b_id !== "string" ||
        typeof item.explanation !== "string" ||
        !validIssues.has(item.issue_id) ||
        !validIds.has(item.entry_a_id) ||
        !validIds.has(item.entry_b_id)
      ) return [];

      return [{
        issueId: item.issue_id,
        entryAId: item.entry_a_id,
        entryBId: item.entry_b_id,
        explanation: item.explanation.slice(0, 500),
      }];
    });
  } catch (error) {
    console.info("Local NLI unavailable; using deterministic demo rules.", error);
    return null;
  }
}

function uniqueContradictions(items: Contradiction[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const pair = [item.entryAId, item.entryBId].sort().join(":");
    const key = `${item.issueId}:${pair}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function questionFor(issueId: string, signals: Signal[], lang: Lang) {
  const en = lang === "en";
  if (signals.some((signal) => signal.kind === "cross_channel" || signal.kind === "contradiction")) {
    return en
      ? `During ${issueId}, was there a point when the expected output or priority changed?`
      : `${issueId}の進行中に、期待される成果や優先事項が変わったと感じた場面はありましたか？`;
  }
  if (signals.some((signal) => signal.kind === "off_record")) {
    return en
      ? `Where can the current specification and decision history for ${issueId} be checked?`
      : `${issueId}の仕様や決定履歴は、現在どこで確認できますか？`;
  }
  return en
    ? `For ${issueId}, what expectation should have been confirmed before the repeated revisions?`
    : `${issueId}で修正が繰り返された背景として、最初に確認しておくべき期待値はありましたか？`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lang: Lang = body?.lang === "en" ? "en" : "ja";
    const en = lang === "en";
    const issues = validateIssues(body?.issues);
    const ollamaContradictions = await localNli(issues, lang);
    const contradictions = uniqueContradictions([
      ...explicitContradictions(issues, lang),
      ...(ollamaContradictions || []),
    ]);

    const results = issues.flatMap((issue) => {
      const signals: Signal[] = [];
      const reworkCount = issue.statusEvents.filter((event) => event === "returned").length;

      if (reworkCount >= issue.reworkThreshold) {
        signals.push({
          kind: "rework",
          label: en ? "Revision count is above the review threshold" : "修正回数が基準値を上回っています",
          summary: en
            ? `${reworkCount} returns (department average ${issue.departmentAverage.toFixed(1)}, demo threshold ${issue.reworkThreshold})`
            : `${reworkCount}回の差し戻し（部門平均 ${issue.departmentAverage.toFixed(1)}回、デモ閾値 ${issue.reworkThreshold}回）`,
          evidence: [],
        });
      }

      const issueContradictions = contradictions.filter((item) => item.issueId === issue.issueId);
      for (const item of issueContradictions) {
        const evidence = [
          issue.entries.find((entry) => entry.id === item.entryAId),
          issue.entries.find((entry) => entry.id === item.entryBId),
        ].filter((entry): entry is LogEntry => Boolean(entry));
        if (evidence.length !== 2) continue;
        const crossChannel = evidence[0].source !== evidence[1].source;
        signals.push({
          kind: crossChannel ? "cross_channel" : "contradiction",
          label: en
            ? (crossChannel ? "Possible mismatch across channels" : "Possible instruction mismatch")
            : (crossChannel ? "チャネル間の指示に不整合の可能性" : "同一課題内の指示に不整合の可能性"),
          summary: item.explanation,
          evidence,
        });
      }

      const offRecordEntries = issue.entries.filter((entry) => OFF_RECORD_PATTERN.test(entry.text));
      if (offRecordEntries.length) {
        signals.push({
          kind: "off_record",
          label: en ? "Decision may exist outside the available record" : "記録外で決定された可能性",
          summary: en
            ? `${offRecordEntries.length} message(s) refer to another conversation, but the referenced decision is not visible in the available logs.`
            : `${offRecordEntries.length}件の参照表現がありますが、参照先の決定内容が利用可能なログ内で確認できません。`,
          evidence: offRecordEntries,
        });
      }

      if (!signals.length) return [];
      return [{
        issueId: issue.issueId,
        title: issue.title,
        reworkCount,
        departmentAverage: issue.departmentAverage,
        signals,
        suggestedQuestion: questionFor(issue.issueId, signals, lang),
      }];
    });

    return NextResponse.json({
      results,
      withinThresholdCount: issues.length - results.length,
      mode: ollamaContradictions ? "local-nli" : "concept-demo",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PENCIL Bridge detection failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析に失敗しました。" },
      { status: 400 }
    );
  }
}
