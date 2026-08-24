"use client";

import { useMemo, useState } from "react";

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

type Signal = {
  kind: SignalKind;
  label: string;
  summary: string;
  evidence: LogEntry[];
};

type IssueResult = {
  issueId: string;
  title: string;
  reworkCount: number;
  departmentAverage: number;
  signals: Signal[];
  suggestedQuestion: string;
};

type DetectionResponse = {
  results: IssueResult[];
  withinThresholdCount: number;
  mode: "local-nli" | "concept-demo";
  generatedAt: string;
};

const DEMO_ISSUES: IssueInput[] = [
  {
    issueId: "BLG-1234",
    title: "LPデザイン改修 / LP Design Revision",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned", "submitted", "returned"],
    entries: [
      {
        id: "m-1234-1",
        source: "meeting",
        date: "08/16",
        authorRole: "Final reviewer",
        text: "今回はシンプルさを優先し、要素を絞って進める。",
      },
      {
        id: "b-1234-1",
        source: "backlog",
        date: "08/18",
        authorRole: "Worker",
        text: "会議方針に基づき、要素を3点に整理した初稿を提出します。",
      },
      {
        id: "c-1234-1",
        source: "chatwork",
        date: "08/20",
        authorRole: "Intermediate reviewer",
        text: "訴求ポイントをもっと追加してください。情報量を増やしたいです。",
      },
    ],
  },
  {
    issueId: "BLG-1189",
    title: "サイト改修方針 / Website Renovation Direction",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "returned", "submitted"],
    entries: [
      {
        id: "b-1189-1",
        source: "backlog",
        date: "08/19",
        authorRole: "Worker",
        text: "トップページ改修案を提出しました。決定理由の記録場所は未確認です。",
      },
      {
        id: "c-1189-1",
        source: "chatwork",
        date: "08/20",
        authorRole: "Intermediate reviewer",
        text: "昨日口頭で確認した内容と同じ方針で進めてください。",
      },
      {
        id: "c-1189-2",
        source: "chatwork",
        date: "08/21",
        authorRole: "Final reviewer",
        text: "先ほど話した仕様に変更しておいてください。",
      },
    ],
  },
  {
    issueId: "BLG-1201",
    title: "バナー納品 / Banner Delivery",
    departmentAverage: 2.1,
    reworkThreshold: 4,
    statusEvents: ["submitted", "approved"],
    entries: [
      {
        id: "m-1201-1",
        source: "meeting",
        date: "08/18",
        authorRole: "Final reviewer",
        text: "金曜日までに初稿を完成させる。",
      },
      {
        id: "b-1201-1",
        source: "backlog",
        date: "08/19",
        authorRole: "Worker",
        text: "金曜日の初稿提出に向けて進行中です。",
      },
    ],
  },
];

const SIGNAL_META: Record<SignalKind, { index: string; short: string }> = {
  rework: { index: "01", short: "REWORK" },
  contradiction: { index: "02", short: "NLI" },
  off_record: { index: "03", short: "OFF-RECORD" },
  cross_channel: { index: "04", short: "CROSS-CHANNEL" },
};

const SOURCE_LABEL: Record<Source, string> = {
  meeting: "Meeting minutes",
  backlog: "Backlog",
  chatwork: "Chatwork",
};

function SignalEvidence({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="evidenceList">
      {entries.map((entry) => (
        <div className={`evidenceRow source-${entry.source}`} key={entry.id}>
          <div className="sourceMeta">
            <span>{SOURCE_LABEL[entry.source]}</span>
            <small>{entry.date} · {entry.authorRole}</small>
          </div>
          <p>“{entry.text}”</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [report, setReport] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [falsePositives, setFalsePositives] = useState<Set<string>>(new Set());
  const [interviewQueue, setInterviewQueue] = useState<Set<string>>(new Set());

  const sourceCounts = useMemo(() => {
    const entries = DEMO_ISSUES.flatMap((issue) => issue.entries);
    return {
      backlog: entries.filter((entry) => entry.source === "backlog").length,
      chatwork: entries.filter((entry) => entry.source === "chatwork").length,
      meeting: entries.filter((entry) => entry.source === "meeting").length,
    };
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setReport(null);
    setFalsePositives(new Set());
    setInterviewQueue(new Set());

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: DEMO_ISSUES }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "分析に失敗しました。");
      setReport(data as DetectionResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分析に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark" aria-hidden="true" />
          <div>
            <strong>PENCIL Bridge</strong>
            <small>Shared Understanding Detection System</small>
          </div>
        </div>
        <div className="accessBadge">
          <span aria-hidden="true">●</span>
          HR-ONLY CONCEPT · FICTIONAL DATA
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">FROM TRANSLATION TO SHARED UNDERSTANDING</span>
          <h1>伝わったはずを、<br /><em>確認できる記録へ。</em></h1>
          <p>
            Backlog、Chatwork、会議議事録を課題単位で照合し、共有理解が失われた可能性のある箇所だけをHRに届けます。
          </p>
        </div>
        <div className="principleCard">
          <span>DESIGN PRINCIPLE</span>
          <strong>AIは問題を断定しない。<br />HRが確認すべき場所を絞る。</strong>
          <p>No emotion scores · No individual rankings · Human confirmation required</p>
        </div>
      </section>

      <section className="systemStrip" aria-label="System flow">
        <div><span>01</span><strong>Collect</strong><small>Existing logs only</small></div>
        <i aria-hidden="true">→</i>
        <div><span>02</span><strong>Detect</strong><small>Four structural signals</small></div>
        <i aria-hidden="true">→</i>
        <div><span>03</span><strong>Narrow</strong><small>Items for HR review</small></div>
        <i aria-hidden="true">→</i>
        <div><span>04</span><strong>Interview</strong><small>Human conversation</small></div>
      </section>

      <section className="workspace">
        <aside className="controlPanel">
          <div className="panelHeading">
            <span>WEEKLY BATCH</span>
            <h2>分析対象</h2>
            <p>このデモでは、実データの代わりに匿名化された架空ログを使用します。</p>
          </div>

          <div className="sourceCards">
            <div className="sourceCard"><span className="sourceDot backlog" /><div><strong>Backlog</strong><small>{sourceCounts.backlog} records · demo adapter</small></div></div>
            <div className="sourceCard"><span className="sourceDot chatwork" /><div><strong>Chatwork</strong><small>{sourceCounts.chatwork} records · demo adapter</small></div></div>
            <div className="sourceCard"><span className="sourceDot meeting" /><div><strong>Meeting minutes</strong><small>{sourceCounts.meeting} decisions · demo adapter</small></div></div>
          </div>

          <dl className="batchFacts">
            <div><dt>Anchor</dt><dd>Backlog issue</dd></div>
            <div><dt>Scope</dt><dd>3 fictional issues</dd></div>
            <div><dt>Identity</dt><dd>Role labels only</dd></div>
            <div><dt>Frontline work</dt><dd>Zero</dd></div>
          </dl>

          <button className="runButton" type="button" onClick={runAnalysis} disabled={loading}>
            <span>{loading ? "ローカル分析中…" : "今週のログを分析"}</span>
            <b aria-hidden="true">→</b>
          </button>
          <p className="controlNote">この操作画面はコンセプト検証用です。実運用では週次バッチで自動実行し、HR専用Notionページに出力します。</p>
          {error && <p className="error" role="alert">{error}</p>}
        </aside>

        <section className="reportPanel">
          <div className="reportHeader">
            <div>
              <span className="eyebrow">NOTION WEEKLY PAGE PREVIEW</span>
              <h2>今週の確認候補</h2>
            </div>
            {report && (
              <div className="reportMode">
                <span className={report.mode === "local-nli" ? "online" : "concept"} />
                {report.mode === "local-nli" ? "LOCAL NLI" : "CONCEPT DEMO"}
              </div>
            )}
          </div>

          {!report ? (
            <div className="emptyReport">
              <span>WEEK 34</span>
              <h3>{loading ? "3つの課題を照合しています" : "まだ分析されていません"}</h3>
              <p>{loading ? "修正回数、指示の矛盾、記録外参照、チャネル間整合性を確認中です。" : "左のボタンを押すと、架空の週間ログから確認候補を生成します。"}</p>
            </div>
          ) : (
            <>
              <div className="reportSummary">
                <div><strong>{report.results.length}</strong><span>Items to review</span></div>
                <div><strong>{report.withinThresholdCount}</strong><span>Within threshold</span></div>
                <p>通常範囲の課題は表示しません。HRの限られた時間を確認候補に集中させます。</p>
              </div>

              <div className="issueList">
                {report.results.map((issue, issueIndex) => {
                  const isFalsePositive = falsePositives.has(issue.issueId);
                  const isQueued = interviewQueue.has(issue.issueId);
                  return (
                    <article className={`issueCard ${isFalsePositive ? "dismissed" : ""}`} key={issue.issueId}>
                      <div className="issueHeader">
                        <span className="issueNumber">{String(issueIndex + 1).padStart(2, "0")}</span>
                        <div>
                          <small>{issue.issueId}</small>
                          <h3>{issue.title}</h3>
                        </div>
                        <span className="reviewTag">CHECK, NOT CONCLUSION</span>
                      </div>

                      <div className="signalStack">
                        {issue.signals.map((signal, signalIndex) => {
                          const meta = SIGNAL_META[signal.kind];
                          return (
                            <section className="signalBlock" key={`${issue.issueId}-${signal.kind}-${signalIndex}`}>
                              <div className="signalTitle">
                                <span>{meta.index}</span>
                                <div><small>{meta.short}</small><strong>{signal.label}</strong></div>
                              </div>
                              <p className="signalSummary">{signal.summary}</p>
                              <SignalEvidence entries={signal.evidence} />
                            </section>
                          );
                        })}
                      </div>

                      <div className="questionBox">
                        <span>SUGGESTED INTERVIEW QUESTION</span>
                        <p>「{issue.suggestedQuestion}」</p>
                      </div>

                      <div className="issueActions">
                        <button
                          className={isQueued ? "selected" : ""}
                          type="button"
                          onClick={() => toggle(setInterviewQueue, issue.issueId)}
                          aria-pressed={isQueued}
                        >
                          {isQueued ? "面談メモに追加済み ✓" : "面談メモに追加"}
                        </button>
                        <button
                          className={`secondary ${isFalsePositive ? "selected" : ""}`}
                          type="button"
                          onClick={() => toggle(setFalsePositives, issue.issueId)}
                          aria-pressed={isFalsePositive}
                        >
                          {isFalsePositive ? "誤検知を取消" : "誤検知として記録"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </section>

      <section className="methodSection">
        <div className="methodIntro">
          <span className="eyebrow">EXPLAINABLE BY DESIGN</span>
          <h2>感情ではなく、<br />構造的なシグナルを見る。</h2>
          <p>個人スコアや感情分析は行いません。すべて課題・成果物単位で扱い、最終確認はHRが行います。</p>
        </div>
        <div className="methodGrid">
          <div><span>01</span><strong>修正回数</strong><p>LLMを使わず、差し戻しイベントを集計。</p></div>
          <div><span>02</span><strong>指示の矛盾</strong><p>NLIで同一課題内の指示関係を比較。</p></div>
          <div><span>03</span><strong>記録外参照</strong><p>「口頭で確認」など、参照先の不在を検出。</p></div>
          <div className="featured"><span>04</span><strong>チャネル間整合性</strong><p>会議の決定と実行フェーズの指示を照合。</p></div>
        </div>
      </section>

      <footer>
        <strong>PENCIL Bridge · Concept Prototype v1.0</strong>
        <p>Fictional data only. Real API connections, consent, privacy review, and APPI compliance are required before any internal pilot.</p>
      </footer>
    </main>
  );
}
