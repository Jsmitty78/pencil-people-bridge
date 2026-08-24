import { NextResponse } from "next/server";

type Source = "meeting" | "backlog" | "chatwork";
type SignalKind = "rework" | "contradiction" | "off_record" | "cross_channel";

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

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:4b";
const MAX_ISSUES = 20;
const MAX_ENTRIES_PER_ISSUE = 60;
const MAX_TEXT_LENGTH = 1500;

const OFF_RECORD_PATTERN = /口頭|先ほど話|昨日話|前回と同じ|さっきの|別途相談|as discussed|verbally|talked earlier|same as before/i;

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

function explicitContradictions(issues: IssueInput[]): Contradiction[] {
  const results: Contradiction[] = [];

  for (const issue of issues) {
    const meetings = issue.entries.filter((entry) => entry.source === "meeting");
    const execution = issue.entries.filter((entry) => entry.source !== "meeting");

    for (const meeting of meetings) {
      for (const action of execution) {
        const simpleDecision = /シンプル|要素を絞|情報量を抑|simplicity|limited elements/i.test(meeting.text);
        const expansionInstruction = /追加|増や|情報量|もっと|add more|more selling points/i.test(action.text);
        const friday = /金曜|Friday/i.test(meeting.text);
        const nonFriday = /木曜|Thursday|月曜|Monday/i.test(action.text);

        if ((simpleDecision && expansionInstruction) || (friday && nonFriday)) {
          results.push({
            issueId: issue.issueId,
            entryAId: meeting.id,
            entryBId: action.id,
            explanation: "会議で決めた方針と、実行フェーズで追加された指示の方向が一致していない可能性があります。",
          });
        }
      }
    }
  }

  return results;
}

async function localNli(issues: IssueInput[]): Promise<Contradiction[] | null> {
  const compactIssues = issues.map((issue) => ({
    issue_id: issue.issueId,
    entries: issue.entries.map((entry) => ({
      id: entry.id,
      source: entry.source,
      text: entry.text,
    })),
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
            content:
              "You compare operational records grouped by work issue. Return only explicit instruction contradictions. Do not infer emotion, intent, blame, performance, personality, culture, health, or legal conclusions. A changed instruction is only a review signal, not proof of a problem. Return an empty array when the text does not support a contradiction.",
          },
          {
            role: "user",
            content: `Find explicit contradictions between instructions for the same issue. Prefer comparisons between meeting decisions and Backlog or Chatwork execution instructions. Explain in Japanese.\n\n${JSON.stringify(compactIssues)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;
    const body = await response.json();
    const content = body?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content) as {
      contradictions?: Array<{
        issue_id?: unknown;
        entry_a_id?: unknown;
        entry_b_id?: unknown;
        explanation?: unknown;
      }>;
    };
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
      ) {
        return [];
      }
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

function questionFor(issueId: string, signals: Signal[]) {
  if (signals.some((signal) => signal.kind === "cross_channel" || signal.kind === "contradiction")) {
    return `${issueId}の進行中に、期待される成果や優先事項が変わったと感じた場面はありましたか？`;
  }
  if (signals.some((signal) => signal.kind === "off_record")) {
    return `${issueId}の仕様や決定履歴は、現在どこで確認できますか？`;
  }
  return `${issueId}で修正が繰り返された背景として、最初に確認しておくべき期待値はありましたか？`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const issues = validateIssues(body?.issues);
    const ollamaContradictions = await localNli(issues);
    const contradictions = uniqueContradictions([
      ...explicitContradictions(issues),
      ...(ollamaContradictions || []),
    ]);

    const results = issues.flatMap((issue) => {
      const signals: Signal[] = [];
      const reworkCount = issue.statusEvents.filter((event) => event === "returned").length;

      if (reworkCount >= issue.reworkThreshold) {
        signals.push({
          kind: "rework",
          label: "修正回数が基準値を上回っています",
          summary: `${reworkCount}回の差し戻し（部門平均 ${issue.departmentAverage.toFixed(1)}回、デモ閾値 ${issue.reworkThreshold}回）`,
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
          label: crossChannel ? "チャネル間の指示に不整合の可能性" : "同一課題内の指示に不整合の可能性",
          summary: item.explanation,
          evidence,
        });
      }

      const offRecordEntries = issue.entries.filter((entry) => OFF_RECORD_PATTERN.test(entry.text));
      if (offRecordEntries.length) {
        signals.push({
          kind: "off_record",
          label: "記録外で決定された可能性",
          summary: `${offRecordEntries.length}件の参照表現がありますが、参照先の決定内容が利用可能なログ内で確認できません。`,
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
        suggestedQuestion: questionFor(issue.issueId, signals),
      }];
    });

    return NextResponse.json({
      results,
      withinThresholdCount: issues.length - results.length,
      mode: ollamaContradictions ? "local-nli" : "demo-fallback",
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
