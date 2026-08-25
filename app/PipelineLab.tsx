"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "ja" | "en";
type LogSource = "meeting" | "backlog" | "chatwork";
type LogEntry = { id: string; source: LogSource; date: string; authorRole: string; text: string };
type StoredCase = {
  issueId: string;
  title: string;
  titleJa?: string;
  scenario?: "general" | "foreign-staff";
  departmentAverage: number;
  reworkThreshold: number;
  statusEvents: string[];
  entries: LogEntry[];
  createdAt: string;
};
type Signal = { kind: string; label: string; summary: string; evidence: LogEntry[] };
type DetectionResult = {
  issueId: string;
  title: string;
  reworkCount: number;
  departmentAverage: number;
  signals: Signal[];
  suggestedQuestion: string;
};
type DetectionResponse = {
  results: DetectionResult[];
  withinThresholdCount: number;
  mode: "local-nli" | "concept-demo";
  generatedAt: string;
};

const DB_NAME = "pencil-bridge-local";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("cases")) db.createObjectStore("cases", { keyPath: "issueId" });
      if (!db.objectStoreNames.contains("feedback")) db.createObjectStore("feedback", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll<T>(storeName: string) {
  const db = await openDatabase();
  return new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result as T[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function dbPut<T>(storeName: string, value: T) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(value);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function dbDelete(storeName: string, key: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

const SAMPLE_CASES: StoredCase[] = [
  {
    issueId: "BLG-1234",
    title: "LP Design Revision",
    titleJa: "LPデザイン修正",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned"],
    createdAt: "2026-08-25T02:00:00.000Z",
    entries: [
      { id: "BLG-1234-1", source: "meeting", date: "2026-08-16 10:42", authorRole: "Final reviewer", text: "今回はシンプルさを優先し、要素を3点に絞って進める。" },
      { id: "BLG-1234-2", source: "backlog", date: "2026-08-18 14:08", authorRole: "Contributor", text: "会議方針に基づき、要素を3点に整理した初稿を提出します。" },
      { id: "BLG-1234-3", source: "chatwork", date: "2026-08-20 09:31", authorRole: "Intermediate reviewer", text: "訴求ポイントをもっと追加してください。情報量を増やしたいです。" },
      { id: "BLG-1234-4", source: "backlog", date: "2026-08-21 15:18", authorRole: "Contributor", text: "情報を追加した第5稿を提出しました。どちらの方針を優先するか確認したいです。" },
    ],
  },
  {
    issueId: "BLG-1189",
    title: "Website Revision Direction",
    titleJa: "Webサイト修正方針",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:01:00.000Z",
    entries: [
      { id: "BLG-1189-1", source: "backlog", date: "2026-08-19 11:22", authorRole: "Contributor", text: "トップページ改修案を提出しました。決定理由の記録場所は未確認です。" },
      { id: "BLG-1189-2", source: "chatwork", date: "2026-08-20 16:15", authorRole: "Reviewer", text: "昨日口頭で確認した内容と同じ方針で進めてください。" },
      { id: "BLG-1189-3", source: "chatwork", date: "2026-08-21 10:04", authorRole: "Final reviewer", text: "先ほど話した仕様に変更しておいてください。" },
      { id: "BLG-1189-4", source: "backlog", date: "2026-08-21 13:40", authorRole: "Contributor", text: "変更後の仕様をBacklogにも記録していただけると助かります。" },
    ],
  },
  {
    issueId: "INT-2041",
    title: "Foreign Staff Campaign Deadline",
    titleJa: "外国籍スタッフのキャンペーン納期",
    scenario: "foreign-staff",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:02:00.000Z",
    entries: [
      { id: "INT-2041-1", source: "meeting", date: "2026-08-18 10:10", authorRole: "Project manager", text: "The first draft is due Friday at 5:00 PM. Please ask in English if anything is unclear." },
      { id: "INT-2041-2", source: "backlog", date: "2026-08-18 13:05", authorRole: "Foreign staff contributor", text: "Understood. I will submit the English draft by Friday at 5:00 PM." },
      { id: "INT-2041-3", source: "chatwork", date: "2026-08-20 09:12", authorRole: "Reviewer", text: "Please finish it by Thursday morning so we can review it before the client meeting." },
      { id: "INT-2041-4", source: "chatwork", date: "2026-08-20 09:28", authorRole: "Foreign staff contributor", text: "I understood Friday from the meeting. Should I send an unfinished draft today?" },
    ],
  },
  {
    issueId: "INT-2046",
    title: "Bilingual Onboarding Manual",
    titleJa: "外国籍スタッフ向けオンボーディング資料",
    scenario: "foreign-staff",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:03:00.000Z",
    entries: [
      { id: "INT-2046-1", source: "meeting", date: "2026-08-19 11:00", authorRole: "HR lead", text: "Create both English and Japanese versions so new foreign staff can understand the process." },
      { id: "INT-2046-2", source: "backlog", date: "2026-08-19 14:20", authorRole: "Content owner", text: "日本語のみで作成してください。英語版は不要です。" },
      { id: "INT-2046-3", source: "chatwork", date: "2026-08-20 10:35", authorRole: "Foreign staff reviewer", text: "I can review the English version, but I only see the Japanese document." },
      { id: "INT-2046-4", source: "backlog", date: "2026-08-21 16:05", authorRole: "Contributor", text: "英語版の要否がチャネルによって異なるため、確定方針を確認中です。" },
    ],
  },
  {
    issueId: "HR-031",
    title: "Daily Report Submission Rule",
    titleJa: "日報の提出ルール",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:04:00.000Z",
    entries: [
      { id: "HR-031-1", source: "meeting", date: "2026-08-18 09:30", authorRole: "Team manager", text: "日報は各自の業務終了時、当日中に提出してください。" },
      { id: "HR-031-2", source: "backlog", date: "2026-08-18 12:15", authorRole: "Operations", text: "日報は毎朝10時までに提出する運用です。" },
      { id: "HR-031-3", source: "chatwork", date: "2026-08-19 10:20", authorRole: "Staff member", text: "昨日の退勤前に提出しましたが、今朝は未提出と連絡がありました。" },
      { id: "HR-031-4", source: "chatwork", date: "2026-08-19 11:02", authorRole: "Team manager", text: "現在の正式な締切を確認して共有します。" },
    ],
  },
  {
    issueId: "WEB-221",
    title: "Responsive Page Scope",
    titleJa: "レスポンシブ対応範囲",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:05:00.000Z",
    entries: [
      { id: "WEB-221-1", source: "meeting", date: "2026-08-17 15:00", authorRole: "Project manager", text: "今回は納期を優先し、モバイル版のみを対象にします。" },
      { id: "WEB-221-2", source: "backlog", date: "2026-08-18 09:45", authorRole: "Developer", text: "モバイル版の実装を開始しました。" },
      { id: "WEB-221-3", source: "chatwork", date: "2026-08-20 14:22", authorRole: "Reviewer", text: "デスクトップ版とモバイル版の両方を今回の納品に含めてください。" },
      { id: "WEB-221-4", source: "backlog", date: "2026-08-21 17:10", authorRole: "Developer", text: "対象範囲の変更により、再見積もりが必要です。" },
    ],
  },
  {
    issueId: "ADV-089",
    title: "Advertisement Release Approval",
    titleJa: "広告公開の承認フロー",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:06:00.000Z",
    entries: [
      { id: "ADV-089-1", source: "meeting", date: "2026-08-20 13:00", authorRole: "Account owner", text: "公開前の最終承認は部長が行います。承認前には配信しません。" },
      { id: "ADV-089-2", source: "chatwork", date: "2026-08-21 09:08", authorRole: "Team lead", text: "チームリーダーの確認で公開して大丈夫です。今日中に配信してください。" },
      { id: "ADV-089-3", source: "backlog", date: "2026-08-21 09:35", authorRole: "Operator", text: "最終承認者が異なるため、公開を保留しています。" },
      { id: "ADV-089-4", source: "chatwork", date: "2026-08-21 11:10", authorRole: "Account owner", text: "正式な承認フローをBacklogに追記します。" },
    ],
  },
  {
    issueId: "OPS-074",
    title: "Client File Delivery Method",
    titleJa: "クライアントへのファイル納品方法",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:07:00.000Z",
    entries: [
      { id: "OPS-074-1", source: "meeting", date: "2026-08-18 16:00", authorRole: "Client lead", text: "最終ファイルはメール添付で納品します。" },
      { id: "OPS-074-2", source: "backlog", date: "2026-08-19 10:30", authorRole: "Project coordinator", text: "納品はBacklogの共有リンクを使用してください。メール添付は不要です。" },
      { id: "OPS-074-3", source: "chatwork", date: "2026-08-19 11:15", authorRole: "Contributor", text: "メール添付とBacklogリンクのどちらが正式な方法でしょうか。" },
      { id: "OPS-074-4", source: "backlog", date: "2026-08-19 15:40", authorRole: "Client lead", text: "クライアント希望を再確認中です。" },
    ],
  },
  {
    issueId: "INT-2052",
    title: "Japanese Tone for Foreign Staff",
    titleJa: "外国籍スタッフ向け日本語表現ルール",
    scenario: "foreign-staff",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:08:00.000Z",
    entries: [
      { id: "INT-2052-1", source: "meeting", date: "2026-08-19 16:30", authorRole: "Trainer", text: "For internal drafts, plain Japanese is acceptable. Clarity is more important than perfect keigo." },
      { id: "INT-2052-2", source: "chatwork", date: "2026-08-20 09:50", authorRole: "Reviewer", text: "社内文書でも必ず正式な敬語を使ってください。カジュアルな日本語は修正してください。" },
      { id: "INT-2052-3", source: "backlog", date: "2026-08-20 13:25", authorRole: "Foreign staff contributor", text: "I rewrote the document in formal Japanese, but I am not sure which rule applies to future drafts." },
      { id: "INT-2052-4", source: "chatwork", date: "2026-08-21 10:00", authorRole: "Trainer", text: "今後使う共通ルールを資料にまとめます。" },
    ],
  },
  {
    issueId: "BLG-1280",
    title: "Monthly Report Update",
    titleJa: "月次レポート更新",
    scenario: "general",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted"],
    createdAt: "2026-08-25T02:09:00.000Z",
    entries: [
      { id: "BLG-1280-1", source: "meeting", date: "2026-08-20 10:00", authorRole: "Report owner", text: "月次レポートは既存テンプレートを使い、金曜日17時までに提出します。" },
      { id: "BLG-1280-2", source: "backlog", date: "2026-08-20 10:35", authorRole: "Contributor", text: "既存テンプレートで作成し、金曜日17時までに提出します。" },
      { id: "BLG-1280-3", source: "chatwork", date: "2026-08-21 16:10", authorRole: "Report owner", text: "提出を確認しました。修正はありません。" },
      { id: "BLG-1280-4", source: "backlog", date: "2026-08-21 16:15", authorRole: "Contributor", text: "確認ありがとうございます。課題を完了にします。" },
    ],
  },
];

const sourceLabel: Record<LogSource, string> = { meeting: "Meeting", backlog: "Backlog", chatwork: "Chatwork" };

export default function PipelineLab({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const [storedCases, setStoredCases] = useState<StoredCase[]>([]);
  const [issueId, setIssueId] = useState("");
  const [title, setTitle] = useState("");
  const [reworkCount, setReworkCount] = useState("0");
  const [logs, setLogs] = useState("");
  const [report, setReport] = useState<DetectionResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Record<string, { useful: string; welcome: string; usable: string; note: string }>>({});

  const messageCount = useMemo(() => storedCases.reduce((total, item) => total + item.entries.length, 0), [storedCases]);

  useEffect(() => {
    dbGetAll<StoredCase>("cases").then(setStoredCases).catch(() => setMessage(en ? "Could not open the local database." : "ローカルデータベースを開けませんでした。"));
  }, [en]);

  function parseLogs(value: string, id: string): LogEntry[] {
    return value.split("\n").map((line) => line.trim()).filter(Boolean).flatMap((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length < 4) return [];
      const rawSource = parts[0].toLowerCase();
      const source: LogSource = rawSource.startsWith("b") ? "backlog" : rawSource.startsWith("c") ? "chatwork" : "meeting";
      return [{ id: id + "-" + (index + 1), source, date: parts[1], authorRole: parts[2], text: parts.slice(3).join(" | ") }];
    });
  }

  async function refreshCases() {
    setStoredCases(await dbGetAll<StoredCase>("cases"));
  }

  async function loadSamples() {
    setMessage("");
    for (const item of SAMPLE_CASES) await dbPut("cases", item);
    await refreshCases();
    const sampleMessages = SAMPLE_CASES.reduce((total, item) => total + item.entries.length, 0);
    setMessage(en
      ? `${SAMPLE_CASES.length} fictional cases with ${sampleMessages} messages were saved locally.`
      : `架空の${SAMPLE_CASES.length}案件・${sampleMessages}件のメッセージをローカルDBに保存しました。`);
  }

  async function saveCase() {
    setMessage("");
    const parsedLogs = parseLogs(logs, issueId.trim());
    if (!issueId.trim() || !title.trim() || parsedLogs.length < 2) {
      setMessage(en ? "Enter an issue ID, title, and at least two valid log lines." : "課題ID、タイトル、有効なログを2行以上入力してください。");
      return;
    }
    const returns = Math.max(0, Number.parseInt(reworkCount, 10) || 0);
    const statusEvents = ["submitted"];
    for (let i = 0; i < returns; i += 1) statusEvents.push("returned", "submitted");
    const item: StoredCase = {
      issueId: issueId.trim(),
      title: title.trim(),
      departmentAverage: 2.1,
      reworkThreshold: 4,
      statusEvents,
      entries: parsedLogs,
      createdAt: new Date().toISOString(),
    };
    await dbPut("cases", item);
    await refreshCases();
    setIssueId(""); setTitle(""); setReworkCount("0"); setLogs("");
    setMessage(en ? "Case saved. It is ready for analysis." : "案件を保存しました。分析を実行できます。");
  }

  async function removeCase(id: string) {
    await dbDelete("cases", id);
    await refreshCases();
    setReport(null);
  }

  async function runAnalysis() {
    if (!storedCases.length) {
      setMessage(en ? "Save or load at least one case first." : "先に案件を1件以上保存してください。");
      return;
    }
    setBusy(true); setMessage(""); setReport(null);
    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          issues: storedCases.map((item) => ({
            ...item,
            title: lang === "ja" ? item.titleJa || item.title : item.title,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Analysis failed");
      setReport(body as DetectionResponse);
      setMessage(en ? "Analysis complete. Review the evidence below." : "分析が完了しました。下の根拠を確認してください。");
    } catch (error) {
      setMessage((en ? "Detection error: " : "検知エラー: ") + (error instanceof Error ? error.message : String(error)));
    } finally {
      setBusy(false);
    }
  }

  async function saveFeedback(id: string) {
    const value = feedback[id] || { useful: "", welcome: "", usable: "", note: "" };
    await dbPut("feedback", { id, ...value, savedAt: new Date().toISOString() });
    setMessage(en ? "Staff feedback saved locally." : "スタッフフィードバックをローカルに保存しました。");
  }

  function setFeedbackField(id: string, field: "useful" | "welcome" | "usable" | "note", value: string) {
    setFeedback((current) => {
      const previous = current[id] || { useful: "", welcome: "", usable: "", note: "" };
      return { ...current, [id]: { ...previous, [field]: value } };
    });
  }

  return (
    <div className="content pipelineView">
      <section className="pipelineSteps">
        <div className="active"><span>1</span><p><strong>{en ? "Enter data" : "データ入力"}</strong><small>{en ? "Anonymized or fictional logs" : "匿名化・架空ログ"}</small></p></div>
        <i>→</i><div className={storedCases.length ? "active" : ""}><span>2</span><p><strong>{en ? "Local database" : "ローカルDB"}</strong><small>{storedCases.length} {en ? "cases stored" : "案件保存"}</small></p></div>
        <i>→</i><div className={report ? "active" : ""}><span>3</span><p><strong>{en ? "Detection" : "問題検知"}</strong><small>{en ? "Rules + optional local LLM" : "ルール＋任意のローカルLLM"}</small></p></div>
        <i>→</i><div className={report ? "active" : ""}><span>4</span><p><strong>{en ? "Review & feedback" : "確認・フィードバック"}</strong><small>{en ? "Evidence-backed output" : "根拠付きの結果"}</small></p></div>
      </section>

      <section className="pipelineGrid">
        <article className="panel inputPanel">
          <header className="panelHeader"><div><span className="eyebrow">CASE INPUT</span><h2>{en ? "Register communication data" : "コミュニケーションデータを登録"}</h2></div><button onClick={loadSamples}>{en ? "Load 10 fictional cases" : "架空の10案件を読み込む"}</button></header>
          <div className="inputForm">
            <label><span>{en ? "Backlog issue ID" : "Backlog課題ID"}</span><input value={issueId} onChange={(event) => setIssueId(event.target.value)} placeholder="BLG-1300" /></label>
            <label><span>{en ? "Issue / deliverable title" : "案件・成果物名"}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={en ? "Website copy revision" : "サイト文言修正"} /></label>
            <label><span>{en ? "Number of returns" : "差し戻し回数"}</span><input type="number" min="0" value={reworkCount} onChange={(event) => setReworkCount(event.target.value)} /></label>
            <label className="fullField"><span>{en ? "Communication logs" : "コミュニケーションログ"}</span><small>{en ? "One line each: Source | Date | Role | Message" : "1行ずつ：Source | Date | Role | Message"}</small><textarea value={logs} onChange={(event) => setLogs(event.target.value)} placeholder={"Meeting | 2026-08-25 09:00 | Final reviewer | Keep the design simple.\nChatwork | 2026-08-25 13:00 | Reviewer | Please add more information."} /></label>
            <button className="saveCaseButton" onClick={saveCase}>{en ? "Save case to local database" : "案件をローカルDBに保存"}</button>
          </div>
        </article>

        <article className="panel databasePanel">
          <header className="panelHeader"><div><span className="eyebrow">LOCAL DATABASE</span><h2>{en ? "Registered cases" : "登録済み案件"}</h2></div><strong>{storedCases.length}</strong></header>
          <div className="databaseStats"><div><strong>{storedCases.length}</strong><span>{en ? "Cases" : "案件"}</span></div><div><strong>{messageCount}</strong><span>{en ? "Messages" : "メッセージ"}</span></div><div><strong>0</strong><span>{en ? "Names stored" : "保存した氏名"}</span></div></div>
          <div className="databaseList">{storedCases.length ? storedCases.map((item) => <div key={item.issueId}><span>{item.issueId}</span><p><strong>{en ? item.title : item.titleJa || item.title}{item.scenario === "foreign-staff" && <em>{en ? "Foreign staff" : "外国籍スタッフ"}</em>}</strong><small>{item.entries.length} {en ? "logs" : "ログ"} · {item.statusEvents.filter((event) => event === "returned").length} {en ? "returns" : "差し戻し"}</small></p><button onClick={() => removeCase(item.issueId)}>{en ? "Delete" : "削除"}</button></div>) : <p className="noCases">{en ? "No cases saved yet." : "まだ案件が保存されていません。"}</p>}</div>
          <button className="analyzeButton" onClick={runAnalysis} disabled={busy || !storedCases.length}>{busy ? (en ? "Analyzing..." : "分析中...") : (en ? "Run detection pipeline" : "検知パイプラインを実行")}</button>
        </article>
      </section>

      {message && <p className="pipelineMessage" role="status">{message}</p>}

      {report && <section className="pipelineResults">
        <header><div><span className="eyebrow">DETECTION OUTPUT</span><h2>{en ? "Problems detected from stored data" : "保存データから問題を検知"}</h2></div><div><span>{report.mode === "local-nli" ? "LOCAL LLM" : "DETERMINISTIC"}</span><strong>{report.results.length} {en ? "flagged" : "件検知"}</strong></div></header>
        {report.results.length ? report.results.map((result) => <article className="detectedCase" key={result.issueId}>
          <div className="detectedHeading"><span>{result.issueId}</span><div><h3>{result.title}</h3><p>{result.reworkCount} {en ? "returns" : "回の差し戻し"} · {result.signals.length} {en ? "signals" : "シグナル"}</p></div></div>
          <div className="detectedSignals">{result.signals.map((signal, index) => <div key={signal.kind + index}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{signal.label}</strong><small>{signal.summary}</small></p></div>)}</div>
          <div className="detectedEvidence"><strong>{en ? "Evidence" : "根拠"}</strong>{result.signals.flatMap((signal) => signal.evidence).map((entry, index) => <div key={entry.id + index}><span className={"miniSource " + entry.source}>{sourceLabel[entry.source]}</span><small>{entry.date} · {entry.authorRole}</small><p>{entry.text}</p></div>)}</div>
          <div className="staffFeedback">
            <h4>{en ? "Staff feedback" : "スタッフフィードバック"}</h4>
            <div className="feedbackQuestions">{[
              ["useful", en ? "Is this detection useful?" : "この検知は役に立ちますか？"],
              ["welcome", en ? "Would this information be welcome?" : "この情報を受け取りたいですか？"],
              ["usable", en ? "Could this be used in real work?" : "実際の業務で使えそうですか？"],
            ].map(([field, label]) => <label key={field}><span>{label}</span><select value={feedback[result.issueId]?.[field as "useful" | "welcome" | "usable"] || ""} onChange={(event) => setFeedbackField(result.issueId, field as "useful" | "welcome" | "usable", event.target.value)}><option value="">—</option><option value="yes">{en ? "Yes" : "はい"}</option><option value="no">{en ? "No" : "いいえ"}</option><option value="unsure">{en ? "Unsure" : "わからない"}</option></select></label>)}</div>
            <textarea value={feedback[result.issueId]?.note || ""} onChange={(event) => setFeedbackField(result.issueId, "note", event.target.value)} placeholder={en ? "What was inaccurate or missing?" : "不正確だった点・不足している点"} />
            <button onClick={() => saveFeedback(result.issueId)}>{en ? "Save feedback" : "フィードバックを保存"}</button>
          </div>
        </article>) : <div className="noDetection"><strong>{en ? "No review signals were detected." : "確認が必要なシグナルは検知されませんでした。"}</strong><p>{en ? "The cases remain in the database and can be analyzed again after adding more evidence." : "案件はデータベースに残り、根拠を追加して再分析できます。"}</p></div>}
      </section>}
    </div>
  );
}
