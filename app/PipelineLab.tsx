"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "ja" | "en";
type LogSource = "meeting" | "backlog" | "chatwork";
type LogEntry = { id: string; source: LogSource; date: string; authorRole: string; text: string };
type StoredCase = {
  issueId: string;
  title: string;
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
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned"],
    createdAt: "2026-08-25T02:00:00.000Z",
    entries: [
      { id: "BLG-1234-1", source: "meeting", date: "2026-08-16 10:42", authorRole: "Final reviewer", text: "今回はシンプルさを優先し、要素を3点に絞って進める。" },
      { id: "BLG-1234-2", source: "backlog", date: "2026-08-18 14:08", authorRole: "Contributor", text: "会議方針に基づき、要素を3点に整理した初稿を提出します。" },
      { id: "BLG-1234-3", source: "chatwork", date: "2026-08-20 09:31", authorRole: "Intermediate reviewer", text: "訴求ポイントをもっと追加してください。情報量を増やしたいです。" },
    ],
  },
  {
    issueId: "BLG-1189",
    title: "Website Revision Direction",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted"],
    createdAt: "2026-08-25T02:01:00.000Z",
    entries: [
      { id: "BLG-1189-1", source: "backlog", date: "2026-08-19 11:22", authorRole: "Contributor", text: "トップページ改修案を提出しました。決定理由の記録場所は未確認です。" },
      { id: "BLG-1189-2", source: "chatwork", date: "2026-08-20 16:15", authorRole: "Reviewer", text: "昨日口頭で確認した内容と同じ方針で進めてください。" },
      { id: "BLG-1189-3", source: "chatwork", date: "2026-08-21 10:04", authorRole: "Final reviewer", text: "先ほど話した仕様に変更しておいてください。" },
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
    setMessage(en ? "Two fictional cases were saved to the local database." : "架空の2案件をローカルデータベースに保存しました。");
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
        body: JSON.stringify({ issues: storedCases }),
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
          <header className="panelHeader"><div><span className="eyebrow">CASE INPUT</span><h2>{en ? "Register communication data" : "コミュニケーションデータを登録"}</h2></div><button onClick={loadSamples}>{en ? "Load fictional samples" : "架空サンプルを読み込む"}</button></header>
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
          <div className="databaseList">{storedCases.length ? storedCases.map((item) => <div key={item.issueId}><span>{item.issueId}</span><p><strong>{item.title}</strong><small>{item.entries.length} {en ? "logs" : "ログ"} · {item.statusEvents.filter((event) => event === "returned").length} {en ? "returns" : "差し戻し"}</small></p><button onClick={() => removeCase(item.issueId)}>{en ? "Delete" : "削除"}</button></div>) : <p className="noCases">{en ? "No cases saved yet." : "まだ案件が保存されていません。"}</p>}</div>
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
