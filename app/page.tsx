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

const SIGNAL_META: Record<SignalKind, { code: string; short: string; tone: string }> = {
  rework: { code: "01", short: "手戻り", tone: "red" },
  contradiction: { code: "02", short: "指示の矛盾", tone: "red" },
  off_record: { code: "03", short: "記録外の参照", tone: "amber" },
  cross_channel: { code: "04", short: "チャネル間の不整合", tone: "red" },
};

const SOURCE_LABEL: Record<Source, string> = {
  meeting: "会議議事録",
  backlog: "Backlog",
  chatwork: "Chatwork",
};

const ROLE_LABEL: Record<string, string> = {
  "Final reviewer": "最終確認者",
  "Intermediate reviewer": "中間確認者",
  Worker: "作業担当",
};

function issueTimeline(issueId: string) {
  return DEMO_ISSUES.find((issue) => issue.issueId === issueId)?.entries ?? [];
}

function flaggedEntryIds(signals: Signal[]) {
  return new Set(signals.flatMap((signal) => signal.evidence.map((entry) => entry.id)));
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
    <main className="pageShell">
      <header className="siteHeader">
        <div className="wordmark" aria-label="PENCIL Bridge">
          <span className="pencilRule" aria-hidden="true" />
          <strong>PENCIL<span>.</span></strong>
          <i aria-hidden="true" />
          <p>People Bridge</p>
        </div>
        <div className="headerMeta">
          <span>HR INTERNAL</span>
          <span>WEEK 34</span>
          <b>構想検証用・架空データ</b>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="sectionLabel">SHARED UNDERSTANDING REPORT</p>
          <h1>成果物の履歴から、<br />認識のずれを見つける。</h1>
        </div>
        <div className="introNote">
          <p>Backlog、Chatwork、会議議事録を課題単位で照合し、HRが確認すべき箇所だけを週次で届けます。</p>
          <small>社員に新しい入力を求めない。個人を評価しない。AIだけで結論を出さない。</small>
        </div>
      </section>

      <ol className="flow" aria-label="週次レポート作成の流れ">
        <li><span>01</span><div><strong>既存ログを取得</strong><small>現場の追加操作なし</small></div></li>
        <li><span>02</span><div><strong>課題単位に整理</strong><small>個人名は役割に置換</small></div></li>
        <li><span>03</span><div><strong>構造的なずれを検知</strong><small>閾値超過のみ抽出</small></div></li>
        <li><span>04</span><div><strong>HRが確認</strong><small>Notionへ週次出力</small></div></li>
      </ol>

      <section className="reportFrame" aria-label="PENCIL Bridge weekly report">
        <div className="reportBar">
          <div>
            <span className="liveDot" aria-hidden="true" />
            <strong>PENCIL Bridge / 週次確認レポート</strong>
          </div>
          <p>2026.08.17–08.23&nbsp;&nbsp;｜&nbsp;&nbsp;対象課題 3件</p>
        </div>

        <div className="reportLayout">
          <aside className="batchPanel">
            <div className="sideHeading">
              <span>WEEKLY BATCH</span>
              <h2>分析対象</h2>
              <p>この画面では、説明用の架空ログを使って週次処理を再現します。</p>
            </div>

            <div className="sourceList">
              <div><span className="sourceIcon backlog">B</span><p><strong>Backlog</strong><small>{sourceCounts.backlog} records</small></p><b>DEMO</b></div>
              <div><span className="sourceIcon chatwork">C</span><p><strong>Chatwork</strong><small>{sourceCounts.chatwork} records</small></p><b>DEMO</b></div>
              <div><span className="sourceIcon meeting">M</span><p><strong>会議議事録</strong><small>{sourceCounts.meeting} decisions</small></p><b>DEMO</b></div>
            </div>

            <dl className="batchDetails">
              <div><dt>集約単位</dt><dd>Backlog課題</dd></div>
              <div><dt>対象期間</dt><dd>7日間</dd></div>
              <div><dt>個人名</dt><dd>保持しない</dd></div>
              <div><dt>社員の入力</dt><dd>0件</dd></div>
            </dl>

            <button className="primaryButton" type="button" onClick={runAnalysis} disabled={loading}>
              <span>{loading ? "照合しています…" : report ? "もう一度分析する" : "今週のログを分析"}</span>
              <b aria-hidden="true">→</b>
            </button>
            <p className="sideNote">実運用ではこの処理を週次で自動実行し、HR専用Notionページに出力します。</p>
            {error && <p className="errorMessage" role="alert">{error}</p>}
          </aside>

          <div className="reportBody">
            <div className="reportHeading">
              <div>
                <p className="sectionLabel">HR REVIEW QUEUE</p>
                <h2>今週の確認候補</h2>
              </div>
              <span className="reviewPolicy">検知は結論ではありません</span>
            </div>

            {!report ? (
              <div className={`emptyState ${loading ? "isLoading" : ""}`}>
                <div className="emptyWeek">34</div>
                <div className="emptyCopy">
                  <h3>{loading ? "課題ごとの判断履歴を照合中" : "週次レポートを作成します"}</h3>
                  <p>{loading ? "修正回数、指示の矛盾、記録外参照、チャネル間の整合性を確認しています。" : "左のボタンを押すと、3件の架空課題からHRの確認候補を抽出します。"}</p>
                </div>
                <div className="emptyLines" aria-hidden="true"><i /><i /><i /></div>
              </div>
            ) : (
              <>
                <div className="summaryRow">
                  <div className="summaryItem alert"><strong>{report.results.length}</strong><span>要確認</span></div>
                  <div className="summaryItem"><strong>{DEMO_ISSUES.length}</strong><span>解析した課題</span></div>
                  <div className="summaryItem"><strong>{report.withinThresholdCount}</strong><span>通常範囲</span></div>
                  <div className="summaryItem"><strong>0</strong><span>社員の入力作業</span></div>
                  <p>通常範囲の課題は表示せず、確認が必要な候補だけを残しています。</p>
                </div>

                <div className="caseList">
                  {report.results.map((issue, issueIndex) => {
                    const isFalsePositive = falsePositives.has(issue.issueId);
                    const isQueued = interviewQueue.has(issue.issueId);
                    const evidenceIds = flaggedEntryIds(issue.signals);
                    const timeline = issueTimeline(issue.issueId);
                    const reworkWidth = `${Math.min(100, (issue.reworkCount / 6) * 100)}%`;

                    return (
                      <article className={`caseCard ${isFalsePositive ? "dismissed" : ""}`} key={issue.issueId}>
                        <header className="caseHeader">
                          <div className="caseIndex">{String(issueIndex + 1).padStart(2, "0")}</div>
                          <div className="caseTitle">
                            <span>{issue.issueId}</span>
                            <h3>{issue.title}</h3>
                          </div>
                          <div className="caseStatus">{isFalsePositive ? "誤検知として記録" : "HR確認待ち"}</div>
                        </header>

                        <div className="caseContent">
                          <section className="findingColumn">
                            <p className="columnLabel">検知したシグナル</p>
                            <div className="signalList">
                              {issue.signals.map((signal, signalIndex) => {
                                const meta = SIGNAL_META[signal.kind];
                                return (
                                  <div className={`signalItem tone-${meta.tone}`} key={`${issue.issueId}-${signal.kind}-${signalIndex}`}>
                                    <span>{meta.code}</span>
                                    <div>
                                      <small>{meta.short}</small>
                                      <strong>{signal.label}</strong>
                                      <p>{signal.summary}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {issue.reworkCount > 0 && (
                              <div className="reworkMetric">
                                <div><span>手戻り</span><strong>{issue.reworkCount}回</strong></div>
                                <div className="metricTrack"><i style={{ width: reworkWidth }} /><b style={{ left: `${(issue.departmentAverage / 6) * 100}%` }} /></div>
                                <small>部署平均 {issue.departmentAverage.toFixed(1)}回</small>
                              </div>
                            )}
                          </section>

                          <section className="timelineColumn">
                            <p className="columnLabel">判断履歴</p>
                            <div className="timeline">
                              {timeline.map((entry) => {
                                const isEvidence = evidenceIds.has(entry.id);
                                return (
                                  <div className={`timelineEntry ${isEvidence ? "isEvidence" : ""}`} key={entry.id}>
                                    <span className="timelineDot" aria-hidden="true" />
                                    <div className="timelineMeta">
                                      <span className={`sourceName ${entry.source}`}>{SOURCE_LABEL[entry.source]}</span>
                                      <small>{entry.date}・{ROLE_LABEL[entry.authorRole] || entry.authorRole}</small>
                                    </div>
                                    <p>{entry.text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </div>

                        <div className="interviewPrompt">
                          <div><span>HR</span><small>面談で確かめる質問</small></div>
                          <p>「{issue.suggestedQuestion}」</p>
                        </div>

                        <footer className="caseActions">
                          <p>人事の確認結果は検知精度の改善に利用します。</p>
                          <div>
                            <button className={isQueued ? "selected" : ""} type="button" onClick={() => toggle(setInterviewQueue, issue.issueId)} aria-pressed={isQueued}>
                              {isQueued ? "面談メモに追加済み" : "面談メモに追加"}
                            </button>
                            <button className={`secondary ${isFalsePositive ? "selected" : ""}`} type="button" onClick={() => toggle(setFalsePositives, issue.issueId)} aria-pressed={isFalsePositive}>
                              {isFalsePositive ? "記録を取り消す" : "誤検知として記録"}
                            </button>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>

                <p className="thresholdNote">この週、通常範囲の{report.withinThresholdCount}件は表示していません。問題が見つからない週は、確認候補を出しません。</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="principles">
        <div className="principleLead">
          <p className="sectionLabel">OPERATING PRINCIPLES</p>
          <h2>監視ではなく、<br />対話の準備に使う。</h2>
        </div>
        <div className="principleGrid">
          <div><span>01</span><strong>成果物単位</strong><p>個人別のスコアやランキングを作らない。</p></div>
          <div><span>02</span><strong>説明できる根拠</strong><p>検知には必ず元の記録と判断履歴を添える。</p></div>
          <div><span>03</span><strong>Human in the loop</strong><p>AIは候補を絞り、最終判断はHRが行う。</p></div>
          <div><span>04</span><strong>既存業務の中で完結</strong><p>現場の新しい入力や専用画面を増やさない。</p></div>
        </div>
      </section>

      <footer className="pageFooter">
        <strong>PENCIL Bridge / Concept Prototype v1.1</strong>
        <p>画面内の数値、課題名、発言はすべて説明用の架空データです。実証前にAPI接続、同意設計、権限管理、個人情報保護レビューが必要です。</p>
      </footer>
    </main>
  );
}
