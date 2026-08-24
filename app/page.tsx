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
          <span>PROPOSAL CONCEPT</span>
          <span>WEEK 34</span>
          <b>実API未接続・架空データ</b>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="sectionLabel">PERMISSION-FIRST / ZERO NEW STAFF INPUT</p>
          <h1>許可が得られたら、<br />今ある記録から始める。</h1>
        </div>
        <div className="introNote">
          <p>新しい入力画面は増やしません。Backlog、Chatwork、会議記録を課題単位で読み取り、確認が必要な案件だけをHRがすでに使っているExcel形式に週次で整理します。</p>
          <small>このプロトタイプは許可後の想定体験です。実際のAPI接続や社内データの取得は行っていません。</small>
        </div>
      </section>

      <section className="permissionCallout" aria-label="接続前に必要な合意">
        <span>STEP 0 / PERMISSION &amp; DATA GOVERNANCE</span>
        <strong>接続前に、会社承認・対象部署・読み取り範囲・保持期間・匿名化・HR閲覧権限を合意します。</strong>
      </section>

      <ol className="flow" aria-label="許可後の想定フロー">
        <li><span>01</span><div><strong>会社承認と範囲設定</strong><small>対象部署・保持期間・HR権限</small></div></li>
        <li><span>02</span><div><strong>既存記録を読み取る</strong><small>Backlog / Chatwork / 会議記録</small></div></li>
        <li><span>03</span><div><strong>案件単位で検知</strong><small>手戻り・矛盾・記録外決定</small></div></li>
        <li><span>04</span><div><strong>Excelへ週次出力</strong><small>HRの今ある業務で確認</small></div></li>
      </ol>

      <section className="reportFrame" aria-label="PENCIL Bridge weekly report">
        <div className="reportBar">
          <div>
            <span className="excelMark" aria-hidden="true">X</span>
            <strong>PENCIL_Bridge_Weekly_Review_2026-W34.xlsx</strong>
          </div>
          <p>PROPOSED OUTPUT&nbsp;&nbsp;｜&nbsp;&nbsp;NOT CONNECTED</p>
        </div>
        <nav className="workbookTabs" aria-label="想定Excelシート">
          <b>週次サマリー</b><span>確認候補</span><span>面談メモ</span><span>誤検知ログ</span>
        </nav>

        <div className="reportLayout">
          <aside className="batchPanel">
            <div className="sideHeading">
              <span>PROPOSED READ-ONLY SOURCES</span>
              <h2>許可後の入力元</h2>
              <p>会社の許可が得られた場合の読み取り範囲を、架空ログで再現します。</p>
            </div>

            <div className="sourceList">
              <div><span className="sourceIcon backlog">B</span><p><strong>Backlog</strong><small>{sourceCounts.backlog} fictional records</small></p><b>PROPOSED</b></div>
              <div><span className="sourceIcon chatwork">C</span><p><strong>Chatwork</strong><small>{sourceCounts.chatwork} fictional records</small></p><b>PROPOSED</b></div>
              <div><span className="sourceIcon meeting">M</span><p><strong>会議記録</strong><small>{sourceCounts.meeting} fictional decisions</small></p><b>PROPOSED</b></div>
            </div>

            <dl className="batchDetails">
              <div><dt>接続状態</dt><dd>未実装</dd></div>
              <div><dt>出力先</dt><dd>Excel</dd></div>
              <div><dt>集約単位</dt><dd>案件・成果物</dd></div>
              <div><dt>社員の入力</dt><dd>0件</dd></div>
            </dl>

            <button className="primaryButton" type="button" onClick={runAnalysis} disabled={loading}>
              <span>{loading ? "想定処理を実行中…" : report ? "架空データでもう一度実行" : "架空データで動作を見る"}</span>
              <b aria-hidden="true">→</b>
            </button>
            <p className="sideNote">実運用を提案する場合は、承認とセキュリティ確認後に限定部署で読み取り専用パイロットを行います。</p>
            {error && <p className="errorMessage" role="alert">{error}</p>}
          </aside>

          <div className="reportBody">
            <div className="reportHeading">
              <div>
                <p className="sectionLabel">WEEK 34 / HR REVIEW</p>
                <h2>Excel週次確認候補</h2>
              </div>
              <span className="reviewPolicy">AIは候補整理のみ・最終判断はHR</span>
            </div>

            {!report ? (
              <div className={`emptyState ${loading ? "isLoading" : ""}`}>
                <div className="emptyWeek">34</div>
                <div className="emptyCopy">
                  <h3>{loading ? "課題ごとの判断履歴を照合中" : "許可後の想定フローを確認できます"}</h3>
                  <p>{loading ? "修正回数、指示の矛盾、記録外参照、チャネル間の整合性を確認しています。" : "左のボタンを押すと、実接続なしの架空データからExcel形式の週次確認候補を作成します。"}</p>
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

                <div className="excelTableWrap">
                  <table className="excelTable">
                    <thead>
                      <tr><th>確認</th><th>課題ID</th><th>成果物</th><th>検知シグナル</th><th>手戻り</th><th>根拠</th><th>HR確認状況</th></tr>
                    </thead>
                    <tbody>
                      {DEMO_ISSUES.map((demoIssue) => {
                        const result = report.results.find((item) => item.issueId === demoIssue.issueId);
                        return (
                          <tr key={demoIssue.issueId} className={result ? "needsReview" : "normalRow"}>
                            <td>{result ? "要確認" : "通常"}</td>
                            <td>{demoIssue.issueId}</td>
                            <td>{demoIssue.title.split(" / ")[0]}</td>
                            <td>{result?.signals[0]?.label ?? "なし"}</td>
                            <td>{result ? `${result.reworkCount}回` : "0回"}</td>
                            <td>{result ? result.signals[0]?.evidence.map((entry) => SOURCE_LABEL[entry.source]).join(" ↔ ") : "Backlog"}</td>
                            <td>{result ? "未確認" : "対象外"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="sheetDivider"><b>確認候補</b><span>根拠と面談準備</span></div>

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
        <strong>PENCIL Bridge / Proposal Prototype v1.2</strong>
        <p>架空データでのUI検証です。実運用には会社承認、API権限、セキュリティ確認、限定パイロットが必要です。個人スコア・感情推定・自動人事判断は行いません。</p>
      </footer>
    </main>
  );
}
