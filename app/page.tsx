"use client";

import { useEffect, useMemo, useState } from "react";
import PipelineLab from "./PipelineLab";
import BusinessValue from "./BusinessValue";

type Source = "Backlog" | "Chatwork" | "会議記録";
type Severity = "high" | "medium" | "normal";
type Status = "未確認" | "面談候補" | "確認済み" | "誤検知";
type View = "overview" | "pipeline" | "review" | "business" | "architecture";
type Lang = "ja" | "en";
type Evidence = { source: Source; date: string; role: string; text: string; flagged?: boolean };
type ReviewCase = {
  id: string; title: string; owner: string; severity: Severity; status: Status;
  signal: string; summary: string; rework: number; average: number;
  confidence: number; question: string; evidence: Evidence[];
};

const INITIAL_CASES: ReviewCase[] = [
  {
    id: "BLG-1234", title: "LPデザイン改修", owner: "制作案件 A", severity: "high", status: "未確認",
    signal: "会議決定と後続指示の不一致",
    summary: "会議では要素を絞る方針でしたが、2日後のChatworkで情報量を増やす指示が出ています。5回の手戻りも確認されました。",
    rework: 5, average: 2.1, confidence: 92,
    question: "途中で方針が変わった背景と、最終的な正しい方針はどちらだったか確認できますか？",
    evidence: [
      { source: "会議記録", date: "8月16日 10:42", role: "最終確認者", text: "今回はシンプルさを優先し、要素を3点に絞って進める。", flagged: true },
      { source: "Backlog", date: "8月18日 14:08", role: "作業担当", text: "会議方針に基づき、要素を3点に整理した初稿を提出します。" },
      { source: "Chatwork", date: "8月20日 09:31", role: "中間確認者", text: "訴求ポイントをもっと追加してください。情報量を増やしたいです。", flagged: true },
    ],
  },
  {
    id: "BLG-1189", title: "サイト改修方針", owner: "Web案件 B", severity: "medium", status: "未確認",
    signal: "記録されていない口頭決定",
    summary: "Chatwork内で口頭指示への参照が2回ありますが、紐づく会議記録やBacklogの決定ログが見つかりません。",
    rework: 2, average: 2.1, confidence: 84,
    question: "口頭で決まった仕様と決定理由を、今からでもBacklogに残せますか？",
    evidence: [
      { source: "Backlog", date: "8月19日 11:22", role: "作業担当", text: "トップページ改修案を提出しました。決定理由の記録場所は未確認です。" },
      { source: "Chatwork", date: "8月20日 16:15", role: "中間確認者", text: "昨日口頭で確認した内容と同じ方針で進めてください。", flagged: true },
      { source: "Chatwork", date: "8月21日 10:04", role: "最終確認者", text: "先ほど話した仕様に変更しておいてください。", flagged: true },
    ],
  },
  {
    id: "BLG-1201", title: "バナー納品", owner: "広告案件 C", severity: "normal", status: "確認済み",
    signal: "不一致なし", summary: "会議記録とBacklogの納期・成果物が一致しています。追加確認は不要です。",
    rework: 0, average: 2.1, confidence: 97, question: "追加確認は不要です。",
    evidence: [
      { source: "会議記録", date: "8月18日 15:40", role: "最終確認者", text: "金曜日までに初稿を完成させる。" },
      { source: "Backlog", date: "8月19日 09:12", role: "作業担当", text: "金曜日の初稿提出に向けて進行中です。" },
    ],
  },
];

const sourceMeta: Record<Source, { letter: string; className: string }> = {
  Backlog: { letter: "B", className: "backlog" },
  Chatwork: { letter: "C", className: "chatwork" },
  会議記録: { letter: "M", className: "meeting" },
};
const statusClass: Record<Status, string> = { 未確認: "new", 面談候補: "queued", 確認済み: "done", 誤検知: "dismissed" };

const EN: Record<string, string> = {
  "LPデザイン改修": "Landing Page Design Revision",
  "制作案件 A": "Creative Project A",
  "会議決定と後続指示の不一致": "Meeting decision conflicts with later instruction",
  "会議では要素を絞る方針でしたが、2日後のChatworkで情報量を増やす指示が出ています。5回の手戻りも確認されました。": "The meeting established a simpler three-element direction, but a Chatwork instruction two days later requested more content. Five rework cycles were also recorded.",
  "途中で方針が変わった背景と、最終的な正しい方針はどちらだったか確認できますか？": "Could you confirm why the direction changed and which instruction represented the final decision?",
  "8月16日 10:42": "Aug 16, 10:42",
  "8月18日 14:08": "Aug 18, 14:08",
  "8月20日 09:31": "Aug 20, 09:31",
  "最終確認者": "Final reviewer",
  "作業担当": "Contributor",
  "中間確認者": "Intermediate reviewer",
  "今回はシンプルさを優先し、要素を3点に絞って進める。": "Prioritize simplicity for this version and proceed with only three key elements.",
  "会議方針に基づき、要素を3点に整理した初稿を提出します。": "I am submitting a first draft organized around three elements, based on the meeting decision.",
  "訴求ポイントをもっと追加してください。情報量を増やしたいです。": "Please add more selling points. I would like to increase the amount of information.",
  "サイト改修方針": "Website Revision Direction",
  "Web案件 B": "Web Project B",
  "記録されていない口頭決定": "Undocumented verbal decision",
  "Chatwork内で口頭指示への参照が2回ありますが、紐づく会議記録やBacklogの決定ログが見つかりません。": "Two Chatwork messages refer to verbal instructions, but no related meeting record or Backlog decision log was found.",
  "口頭で決まった仕様と決定理由を、今からでもBacklogに残せますか？": "Could the verbally agreed specification and its rationale be documented in Backlog now?",
  "8月19日 11:22": "Aug 19, 11:22",
  "8月20日 16:15": "Aug 20, 16:15",
  "8月21日 10:04": "Aug 21, 10:04",
  "トップページ改修案を提出しました。決定理由の記録場所は未確認です。": "I submitted the homepage revision proposal. I have not confirmed where the decision rationale was recorded.",
  "昨日口頭で確認した内容と同じ方針で進めてください。": "Please proceed with the same direction we confirmed verbally yesterday.",
  "先ほど話した仕様に変更しておいてください。": "Please change it to the specification we discussed earlier.",
  "バナー納品": "Banner Delivery",
  "広告案件 C": "Advertising Project C",
  "不一致なし": "No inconsistency",
  "会議記録とBacklogの納期・成果物が一致しています。追加確認は不要です。": "The deadline and deliverable match across the meeting record and Backlog. No further review is needed.",
  "追加確認は不要です。": "No further review is needed.",
  "8月18日 15:40": "Aug 18, 15:40",
  "8月19日 09:12": "Aug 19, 09:12",
  "金曜日までに初稿を完成させる。": "Complete the first draft by Friday.",
  "金曜日の初稿提出に向けて進行中です。": "Work is progressing toward the Friday first-draft submission.",
  "会議記録": "Meeting log",
  "未確認": "Unreviewed",
  "面談候補": "Follow-up",
  "確認済み": "Reviewed",
  "誤検知": "False positive",
  "概要": "Overview",
  "確認キュー": "Review queue",
  "データ登録・検知": "Data & detection",
  "事業価値": "Business value",
  "接続設計": "Connection design",
  "実データ・実APIは未接続": "No live data or APIs connected",
  "共有理解のズレを、案件単位で見つける。": "Find gaps in shared understanding, issue by issue.",
  "今週の確認キュー": "This week's review queue",
  "読み取り専用パイロット設計": "Read-only pilot design",
  "実データから問題検知までを動かす。": "Run the complete data-to-detection pipeline.",
  "改善効果を、時間と金額で説明する。": "Explain the impact in time and financial value.",
  "CSV出力": "Export CSV",
  "照合中...": "Analyzing...",
  "架空データで再実行": "Run fictional demo",
  "この画面の案件・メッセージ・数値はすべて架空です。": "Every issue, message, and number on this screen is fictional.",
  "AIは確認候補と根拠を整理するだけです。人や感情を評価せず、最終判断はHRが行います。": "AI only organizes review candidates and evidence. It does not evaluate people or emotions, and HR makes every final decision.",
  "要確認": "Needs review",
  "前週比 +1": "+1 from last week",
  "HRの判断を待っている案件": "Issues awaiting HR review",
  "対象課題": "Issues scanned",
  "限定部署の課題を照合": "Approved department scope",
  "通常範囲": "Within range",
  "自動で非表示": "Hidden by default",
  "不一致が見つからなかった案件": "Issues with no detected mismatch",
  "追加入力": "New staff input",
  "スタッフ負担": "Staff workload",
  "既存記録のみを読み取り": "Uses existing records only",
  "今週、先に見るべき2件": "Two issues to review first",
  "すべて確認 →": "Review all →",
  "手戻り": "Rework",
  "照合した記録": "Records matched",
  "正常": "Ready",
  "課題": "issues",
  "メッセージ": "messages",
  "決定事項": "decisions",
  "最終実行": "Last run",
  "8月25日 09:40": "Aug 25, 09:40",
  "案件IDで集約": "Group by issue ID",
  "人ではなく成果物を軸にする": "Anchor analysis to work, not people",
  "判断履歴を照合": "Compare decision history",
  "変更・矛盾・記録漏れを検知": "Detect changes, conflicts, and gaps",
  "根拠付きで提示": "Show the evidence",
  "元の記録まで必ず戻れる": "Keep every finding traceable",
  "HRが確認": "HR reviews",
  "面談候補または誤検知を記録": "Record follow-up or false positive",
  "すべて": "All",
  "未完了": "Open",
  "対応済み": "Completed",
  "案件単位のみ表示・個人評価なし": "Issue-level view only. No individual evaluation.",
  "案件 / 成果物": "Issue / deliverable",
  "シグナル": "Signal",
  "状態": "Status",
  "信頼度": "Confidence",
  "検知信頼度": "Detection confidence",
  "検知理由": "Why it was flagged",
  "回": "",
  "部署平均": "Department average",
  "判断履歴と根拠": "Decision history and evidence",
  "赤線 = 検知に使った記録": "Red line = evidence used",
  "確認時の質問案": "Suggested review question",
  "誤検知として記録": "Mark false positive",
  "面談候補に追加": "Add to follow-up",
  "確認済みにする": "Mark reviewed",
  "今日確認したいのは、AI精度より先に\n「安全に紐づけられるか」です。": "Before AI accuracy, today's key question is:\nCan the records be linked safely?",
  "最初のパイロットは1部署・4週間・読み取り専用を想定。個人スコアは作らず、Backlog課題IDを中心に、Chatworkと会議記録を接続します。": "The initial pilot covers one department for four weeks with read-only access. It creates no individual scores and links Chatwork and meeting records around Backlog issue IDs.",
  "課題ID、状態変更、コメント、担当ロール、更新時刻": "Issue ID, status changes, comments, role, and timestamps",
  "課題IDを含むメッセージ、投稿時刻、スレッド参照": "Messages containing issue IDs, timestamps, and thread references",
  "決定事項、会議日時、関連案件、決定者ロール": "Decisions, meeting time, related issue, and decision-maker role",
  "課題ID・URL・期間から同じ成果物の判断履歴を構成": "Build one decision history from issue IDs, URLs, and time windows",
  "エンジニアに聞きたいこと": "Questions for the engineers",
  "Chatwork内でBacklog課題IDはどの程度使われていますか？": "How consistently are Backlog issue IDs used in Chatwork?",
  "IDがない会話を、どの情報なら安全に同じ案件へ紐づけられそうですか？": "When an ID is missing, what information could safely link a conversation to the same issue?",
  "状態変更と差し戻し回数はAPI履歴から取得できますか？": "Can status changes and return counts be retrieved from API history?",
  "「手戻り」を推測ではなく、どのイベントで定義すべきでしょうか？": "Which events should define rework without relying on inference?",
  "会議記録に案件IDやURLを追加する運用は現実的ですか？": "Would adding an issue ID or URL to meeting records be practical?",
  "追加入力を増やさず、紐づけ精度を上げる方法を確認したいです。": "We want to improve linking accuracy without creating significant extra input.",
  "読み取り専用トークンを部署・期間で制限できますか？": "Can read-only tokens be restricted by department and time period?",
  "4週間の限定パイロットで必要な最小権限を確認したいです。": "We want to identify the minimum permissions required for a four-week pilot.",
  "保存しない設計は可能ですか？": "Can this work without storing source messages?",
  "原文は各システムに残し、Bridge側には参照IDとHR判断だけを保持する案です。": "The proposal keeps source text in each system and stores only reference IDs and HR decisions in Bridge.",
  "最初からしないこと": "What the pilot will not do",
  "社員・管理職のスコアリング": "Score employees or managers",
  "案件と成果物だけを分析単位にする": "Analyze issues and deliverables only",
  "感情・ストレス・性格の推定": "Infer emotion, stress, or personality",
  "業務記録からセンシティブな推測をしない": "Do not infer sensitive traits from work records",
  "自動的な人事判断": "Make automated HR decisions",
  "候補を整理し、HRが必ず原文を確認する": "Organize candidates while HR checks original evidence",
  "全社一括接続": "Connect the entire company at once",
  "承認済みの1部署・4週間から検証する": "Validate with one approved department for four weeks",
  "成功条件": "Success condition",
  "HRが週30分以内で確認でき、実際の手戻り原因を1件以上早期発見できること。": "HR can finish the weekly review in under 30 minutes and identify at least one real source of preventable rework earlier.",
};

function SourceBadge({ source, lang }: { source: Source; lang: Lang }) {
  const meta = sourceMeta[source];
  return <span className={"sourceBadge " + meta.className}><b>{meta.letter}</b>{lang === "en" ? EN[source] || source : source}</span>;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("ja");
  const [view, setView] = useState<View>("overview");
  const [cases, setCases] = useState(INITIAL_CASES);
  const [selectedId, setSelectedId] = useState("BLG-1234");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState("8月25日 09:40");
  const t = (text: string) => lang === "en" ? EN[text] || text : text;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const selected = cases.find((item) => item.id === selectedId) || cases[0];
  const reviewCount = cases.filter((item) => item.status === "未確認" || item.status === "面談候補").length;
  const filteredCases = useMemo(() => cases.filter((item) => {
    if (filter === "open") return item.status === "未確認" || item.status === "面談候補";
    if (filter === "done") return item.status === "確認済み" || item.status === "誤検知";
    return true;
  }), [cases, filter]);

  function updateStatus(id: string, status: Status) {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }
  function runDemo() {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setLastRun(new Intl.DateTimeFormat(lang === "en" ? "en-US" : "ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()));
      setView("review");
    }, 850);
  }
  function exportCsv() {
    const rows: (string | number)[][] = [
      lang === "en"
        ? ["Issue ID", "Deliverable", "Signal", "Rework count", "Department average", "HR status", "Review question"]
        : ["課題ID", "成果物", "検知シグナル", "手戻り回数", "部署平均", "HR確認状況", "面談質問"],
      ...cases.map((item) => [item.id, t(item.title), t(item.signal), item.rework, item.average, t(item.status), t(item.question)]),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map((cell) => "\"" + String(cell).replaceAll("\"", "\"\"") + "\"").join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "PENCIL_Bridge_Weekly_Review_2026-W35.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand"><span className="brandMark">P</span><div><strong>PENCIL</strong><small>PEOPLE BRIDGE</small></div></div>
        <nav className="mainNav" aria-label={lang === "en" ? "Main navigation" : "メインナビゲーション"}>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>01</span>{t("概要")}</button>
          <button className={view === "pipeline" ? "active" : ""} onClick={() => setView("pipeline")}><span>02</span>{t("データ登録・検知")}</button>
          <button className={view === "review" ? "active" : ""} onClick={() => setView("review")}><span>03</span>{t("確認キュー")}<b>{reviewCount}</b></button>
          <button className={view === "business" ? "active" : ""} onClick={() => setView("business")}><span>04</span>{t("事業価値")}</button>
          <button className={view === "architecture" ? "active" : ""} onClick={() => setView("architecture")}><span>05</span>{t("接続設計")}</button>
        </nav>
        <div className="sidebarFoot"><span className="demoDot" /><div><strong>CONCEPT DEMO</strong><small>{t("実データ・実APIは未接続")}</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">HR REVIEW CONSOLE</span><h1>{view === "overview" ? t("共有理解のズレを、案件単位で見つける。") : view === "pipeline" ? t("実データから問題検知までを動かす。") : view === "review" ? t("今週の確認キュー") : view === "business" ? t("改善効果を、時間と金額で説明する。") : t("読み取り専用パイロット設計")}</h1></div>
          <div className="topActions">
            <div className="languageToggle" aria-label="Language">
              <button className={lang === "ja" ? "active" : ""} onClick={() => setLang("ja")}>日本語</button>
              <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
            <button className="ghostButton" onClick={exportCsv}>{t("CSV出力")}</button>
            <button className="runButton" onClick={runDemo} disabled={running}>{running ? <><i />{t("照合中...")}</> : t("架空データで再実行")}</button>
          </div>
        </header>

        {view === "pipeline" && <PipelineLab lang={lang} />}
        {view === "business" && <BusinessValue lang={lang} />}

        {view === "overview" && <div className="content overviewView">
          <section className="notice"><div><span>DEMO DATA</span><strong>{t("この画面の案件・メッセージ・数値はすべて架空です。")}</strong></div><p>{t("AIは確認候補と根拠を整理するだけです。人や感情を評価せず、最終判断はHRが行います。")}</p></section>
          <section className="metricGrid">
            <article className="metricCard critical"><div><span>{t("要確認")}</span><small>{t("前週比 +1")}</small></div><strong>{reviewCount}</strong><p>{t("HRの判断を待っている案件")}</p></article>
            <article className="metricCard"><div><span>{t("対象課題")}</span><small>WEEK 35</small></div><strong>24</strong><p>{t("限定部署の課題を照合")}</p></article>
            <article className="metricCard"><div><span>{t("通常範囲")}</span><small>{t("自動で非表示")}</small></div><strong>22</strong><p>{t("不一致が見つからなかった案件")}</p></article>
            <article className="metricCard"><div><span>{t("追加入力")}</span><small>{t("スタッフ負担")}</small></div><strong>0</strong><p>{t("既存記録のみを読み取り")}</p></article>
          </section>
          <section className="overviewGrid">
            <article className="panel signalPanel">
              <header className="panelHeader"><div><span className="eyebrow">WEEKLY SIGNAL</span><h2>{t("今週、先に見るべき2件")}</h2></div><button onClick={() => setView("review")}>{t("すべて確認 →")}</button></header>
              <div className="signalRows">{cases.filter((item) => item.severity !== "normal").map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setView("review"); }}><span className={"severityBar " + item.severity} /><div className="signalMain"><small>{item.id} ・ {t(item.owner)}</small><strong>{t(item.title)}</strong><p>{t(item.signal)}</p></div><div className="signalStat"><strong>{item.rework}</strong><small>{t("手戻り")}</small></div><span className="rowArrow">→</span></button>)}</div>
            </article>
            <article className="panel sourcePanel">
              <header className="panelHeader"><div><span className="eyebrow">READ-ONLY INPUT</span><h2>{t("照合した記録")}</h2></div><span className="syncState"><i />{t("正常")}</span></header>
              <div className="sourceRows"><div><SourceBadge source="Backlog" lang={lang} /><strong>24</strong><small>{t("課題")}</small></div><div><SourceBadge source="Chatwork" lang={lang} /><strong>86</strong><small>{t("メッセージ")}</small></div><div><SourceBadge source="会議記録" lang={lang} /><strong>12</strong><small>{t("決定事項")}</small></div></div>
              <footer><span>{t("最終実行")}</span><strong>{t(lastRun)}</strong></footer>
            </article>
          </section>
          <section className="workflowStrip"><div><span>1</span><p><strong>{t("案件IDで集約")}</strong><small>{t("人ではなく成果物を軸にする")}</small></p></div><i>→</i><div><span>2</span><p><strong>{t("判断履歴を照合")}</strong><small>{t("変更・矛盾・記録漏れを検知")}</small></p></div><i>→</i><div><span>3</span><p><strong>{t("根拠付きで提示")}</strong><small>{t("元の記録まで必ず戻れる")}</small></p></div><i>→</i><div><span>4</span><p><strong>{t("HRが確認")}</strong><small>{t("面談候補または誤検知を記録")}</small></p></div></section>
        </div>}

        {view === "review" && <div className="content reviewView">
          <section className="queueToolbar"><div className="segmented"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t("すべて")} <b>{cases.length}</b></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>{t("未完了")} <b>{reviewCount}</b></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>{t("対応済み")}</button></div><p><span />{t("案件単位のみ表示・個人評価なし")}</p></section>
          <section className="reviewLayout">
            <div className="caseQueue"><div className="queueColumns"><span>{t("案件 / 成果物")}</span><span>{t("シグナル")}</span><span>{t("状態")}</span></div>{filteredCases.map((item) => <button className={(selected.id === item.id ? "selected " : "") + "severity-" + item.severity} key={item.id} onClick={() => setSelectedId(item.id)}><div><small>{item.id}</small><strong>{t(item.title)}</strong><span>{t(item.owner)}</span></div><div><strong>{t(item.signal)}</strong><span>{t("信頼度")} {item.confidence}%</span></div><span className={"statusPill " + statusClass[item.status]}>{t(item.status)}</span></button>)}</div>
            <article className="caseDetail">
              <header className="detailHeader"><div><span className={"statusPill " + statusClass[selected.status]}>{t(selected.status)}</span><small>{selected.id} ・ {t(selected.owner)}</small><h2>{t(selected.title)}</h2></div><div className="confidence"><span>{t("検知信頼度")}</span><strong>{selected.confidence}<small>%</small></strong></div></header>
              <section className="findingBox"><span>{t("検知理由")}</span><strong>{t(selected.signal)}</strong><p>{t(selected.summary)}</p><div className="reworkScale"><div><span>{t("手戻り")} <b>{selected.rework}{lang === "ja" ? "回" : ""}</b></span><small>{t("部署平均")} {selected.average.toFixed(1)}{lang === "ja" ? "回" : ""}</small></div><div className="track"><i style={{ width: Math.min(100, selected.rework / 6 * 100) + "%" }} /><b style={{ left: selected.average / 6 * 100 + "%" }} /></div></div></section>
              <section className="evidenceSection"><div className="sectionTitle"><div><span className="eyebrow">SOURCE TRACE</span><h3>{t("判断履歴と根拠")}</h3></div><small>{t("赤線 = 検知に使った記録")}</small></div><div className="timeline">{selected.evidence.map((entry, index) => <div className={entry.flagged ? "flagged" : ""} key={selected.id + "-" + index}><span className="timelineLine" /><SourceBadge source={entry.source} lang={lang} /><small>{t(entry.date)} ・ {t(entry.role)}</small><p>{t(entry.text)}</p></div>)}</div></section>
              <section className="questionBox"><div><span>HR</span><small>{t("確認時の質問案")}</small></div><p>{lang === "ja" ? "「" : "“"}{t(selected.question)}{lang === "ja" ? "」" : "”"}</p></section>
              <footer className="detailActions"><button className="textButton" onClick={() => updateStatus(selected.id, "誤検知")}>{t("誤検知として記録")}</button><div><button className="outlineButton" onClick={() => updateStatus(selected.id, "面談候補")}>{t("面談候補に追加")}</button><button className="confirmButton" onClick={() => updateStatus(selected.id, "確認済み")}>{t("確認済みにする")}</button></div></footer>
            </article>
          </section>
        </div>}

        {view === "architecture" && <div className="content architectureView">
          <section className="architectureIntro"><div><span className="eyebrow">ENGINEERING REVIEW</span><h2>{lang === "en" ? <>Before AI accuracy, today&apos;s key question is:<br />Can the records be linked safely?</> : <>今日確認したいのは、AI精度より先に<br />「安全に紐づけられるか」です。</>}</h2></div><p>{t("最初のパイロットは1部署・4週間・読み取り専用を想定。個人スコアは作らず、Backlog課題IDを中心に、Chatworkと会議記録を接続します。")}</p></section>
          <section className="dataFlow">
            <article><div className="systemIcon backlog">B</div><span>INPUT 01</span><strong>Backlog</strong><p>{t("課題ID、状態変更、コメント、担当ロール、更新時刻")}</p><small>READ ONLY</small></article><i>+</i>
            <article><div className="systemIcon chatwork">C</div><span>INPUT 02</span><strong>Chatwork</strong><p>{t("課題IDを含むメッセージ、投稿時刻、スレッド参照")}</p><small>READ ONLY</small></article><i>+</i>
            <article><div className="systemIcon meeting">M</div><span>INPUT 03</span><strong>{t("会議記録")}</strong><p>{t("決定事項、会議日時、関連案件、決定者ロール")}</p><small>READ ONLY</small></article><i>→</i>
            <article className="bridgeNode"><div className="systemIcon bridge">P</div><span>MATCHING LAYER</span><strong>Issue Graph</strong><p>{t("課題ID・URL・期間から同じ成果物の判断履歴を構成")}</p><small>PROTOTYPE</small></article>
          </section>
          <section className="architectureGrid">
            <article className="panel questionsPanel"><header className="panelHeader"><div><span className="eyebrow">5 QUESTIONS</span><h2>{t("エンジニアに聞きたいこと")}</h2></div></header><ol>
              <li><span>01</span><p><strong>{t("Chatwork内でBacklog課題IDはどの程度使われていますか？")}</strong><small>{t("IDがない会話を、どの情報なら安全に同じ案件へ紐づけられそうですか？")}</small></p></li>
              <li><span>02</span><p><strong>{t("状態変更と差し戻し回数はAPI履歴から取得できますか？")}</strong><small>{t("「手戻り」を推測ではなく、どのイベントで定義すべきでしょうか？")}</small></p></li>
              <li><span>03</span><p><strong>{t("会議記録に案件IDやURLを追加する運用は現実的ですか？")}</strong><small>{t("追加入力を増やさず、紐づけ精度を上げる方法を確認したいです。")}</small></p></li>
              <li><span>04</span><p><strong>{t("読み取り専用トークンを部署・期間で制限できますか？")}</strong><small>{t("4週間の限定パイロットで必要な最小権限を確認したいです。")}</small></p></li>
              <li><span>05</span><p><strong>{t("保存しない設計は可能ですか？")}</strong><small>{t("原文は各システムに残し、Bridge側には参照IDとHR判断だけを保持する案です。")}</small></p></li>
            </ol></article>
            <article className="panel guardrailPanel"><header className="panelHeader"><div><span className="eyebrow">PILOT GUARDRAILS</span><h2>{t("最初からしないこと")}</h2></div></header><ul>
              <li><span>×</span><p><strong>{t("社員・管理職のスコアリング")}</strong><small>{t("案件と成果物だけを分析単位にする")}</small></p></li>
              <li><span>×</span><p><strong>{t("感情・ストレス・性格の推定")}</strong><small>{t("業務記録からセンシティブな推測をしない")}</small></p></li>
              <li><span>×</span><p><strong>{t("自動的な人事判断")}</strong><small>{t("候補を整理し、HRが必ず原文を確認する")}</small></p></li>
              <li><span>×</span><p><strong>{t("全社一括接続")}</strong><small>{t("承認済みの1部署・4週間から検証する")}</small></p></li>
            </ul><footer><strong>{t("成功条件")}</strong><p>{t("HRが週30分以内で確認でき、実際の手戻り原因を1件以上早期発見できること。")}</p></footer></article>
          </section>
        </div>}
      </section>
    </main>
  );
}
