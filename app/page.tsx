"use client";

import { useMemo, useState } from "react";

type Source = "Backlog" | "Chatwork" | "会議記録";
type Severity = "high" | "medium" | "normal";
type Status = "未確認" | "面談候補" | "確認済み" | "誤検知";
type View = "overview" | "review" | "architecture";
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

function SourceBadge({ source }: { source: Source }) {
  const meta = sourceMeta[source];
  return <span className={"sourceBadge " + meta.className}><b>{meta.letter}</b>{source}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [cases, setCases] = useState(INITIAL_CASES);
  const [selectedId, setSelectedId] = useState("BLG-1234");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState("8月25日 09:40");
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
      setLastRun(new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date()));
      setView("review");
    }, 850);
  }
  function exportCsv() {
    const rows: (string | number)[][] = [
      ["課題ID", "成果物", "検知シグナル", "手戻り回数", "部署平均", "HR確認状況", "面談質問"],
      ...cases.map((item) => [item.id, item.title, item.signal, item.rework, item.average, item.status, item.question]),
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
        <nav className="mainNav" aria-label="メインナビゲーション">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>01</span>概要</button>
          <button className={view === "review" ? "active" : ""} onClick={() => setView("review")}><span>02</span>確認キュー<b>{reviewCount}</b></button>
          <button className={view === "architecture" ? "active" : ""} onClick={() => setView("architecture")}><span>03</span>接続設計</button>
        </nav>
        <div className="sidebarFoot"><span className="demoDot" /><div><strong>CONCEPT DEMO</strong><small>実データ・実APIは未接続</small></div></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">HR REVIEW CONSOLE</span><h1>{view === "overview" ? "共有理解のズレを、案件単位で見つける。" : view === "review" ? "今週の確認キュー" : "読み取り専用パイロット設計"}</h1></div>
          <div className="topActions"><button className="ghostButton" onClick={exportCsv}>CSV出力</button><button className="runButton" onClick={runDemo} disabled={running}>{running ? <><i />照合中...</> : "架空データで再実行"}</button></div>
        </header>

        {view === "overview" && <div className="content overviewView">
          <section className="notice"><div><span>DEMO DATA</span><strong>この画面の案件・メッセージ・数値はすべて架空です。</strong></div><p>AIは確認候補と根拠を整理するだけです。人や感情を評価せず、最終判断はHRが行います。</p></section>
          <section className="metricGrid">
            <article className="metricCard critical"><div><span>要確認</span><small>前週比 +1</small></div><strong>{reviewCount}</strong><p>HRの判断を待っている案件</p></article>
            <article className="metricCard"><div><span>対象課題</span><small>WEEK 35</small></div><strong>24</strong><p>限定部署の課題を照合</p></article>
            <article className="metricCard"><div><span>通常範囲</span><small>自動で非表示</small></div><strong>22</strong><p>不一致が見つからなかった案件</p></article>
            <article className="metricCard"><div><span>追加入力</span><small>スタッフ負担</small></div><strong>0</strong><p>既存記録のみを読み取り</p></article>
          </section>
          <section className="overviewGrid">
            <article className="panel signalPanel">
              <header className="panelHeader"><div><span className="eyebrow">WEEKLY SIGNAL</span><h2>今週、先に見るべき2件</h2></div><button onClick={() => setView("review")}>すべて確認 →</button></header>
              <div className="signalRows">{cases.filter((item) => item.severity !== "normal").map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setView("review"); }}><span className={"severityBar " + item.severity} /><div className="signalMain"><small>{item.id} ・ {item.owner}</small><strong>{item.title}</strong><p>{item.signal}</p></div><div className="signalStat"><strong>{item.rework}</strong><small>手戻り</small></div><span className="rowArrow">→</span></button>)}</div>
            </article>
            <article className="panel sourcePanel">
              <header className="panelHeader"><div><span className="eyebrow">READ-ONLY INPUT</span><h2>照合した記録</h2></div><span className="syncState"><i />正常</span></header>
              <div className="sourceRows"><div><SourceBadge source="Backlog" /><strong>24</strong><small>課題</small></div><div><SourceBadge source="Chatwork" /><strong>86</strong><small>メッセージ</small></div><div><SourceBadge source="会議記録" /><strong>12</strong><small>決定事項</small></div></div>
              <footer><span>最終実行</span><strong>{lastRun}</strong></footer>
            </article>
          </section>
          <section className="workflowStrip"><div><span>1</span><p><strong>案件IDで集約</strong><small>人ではなく成果物を軸にする</small></p></div><i>→</i><div><span>2</span><p><strong>判断履歴を照合</strong><small>変更・矛盾・記録漏れを検知</small></p></div><i>→</i><div><span>3</span><p><strong>根拠付きで提示</strong><small>元の記録まで必ず戻れる</small></p></div><i>→</i><div><span>4</span><p><strong>HRが確認</strong><small>面談候補または誤検知を記録</small></p></div></section>
        </div>}

        {view === "review" && <div className="content reviewView">
          <section className="queueToolbar"><div className="segmented"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>すべて <b>{cases.length}</b></button><button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>未完了 <b>{reviewCount}</b></button><button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>対応済み</button></div><p><span />案件単位のみ表示・個人評価なし</p></section>
          <section className="reviewLayout">
            <div className="caseQueue"><div className="queueColumns"><span>案件 / 成果物</span><span>シグナル</span><span>状態</span></div>{filteredCases.map((item) => <button className={(selected.id === item.id ? "selected " : "") + "severity-" + item.severity} key={item.id} onClick={() => setSelectedId(item.id)}><div><small>{item.id}</small><strong>{item.title}</strong><span>{item.owner}</span></div><div><strong>{item.signal}</strong><span>信頼度 {item.confidence}%</span></div><span className={"statusPill " + statusClass[item.status]}>{item.status}</span></button>)}</div>
            <article className="caseDetail">
              <header className="detailHeader"><div><span className={"statusPill " + statusClass[selected.status]}>{selected.status}</span><small>{selected.id} ・ {selected.owner}</small><h2>{selected.title}</h2></div><div className="confidence"><span>検知信頼度</span><strong>{selected.confidence}<small>%</small></strong></div></header>
              <section className="findingBox"><span>検知理由</span><strong>{selected.signal}</strong><p>{selected.summary}</p><div className="reworkScale"><div><span>手戻り <b>{selected.rework}回</b></span><small>部署平均 {selected.average.toFixed(1)}回</small></div><div className="track"><i style={{ width: Math.min(100, selected.rework / 6 * 100) + "%" }} /><b style={{ left: selected.average / 6 * 100 + "%" }} /></div></div></section>
              <section className="evidenceSection"><div className="sectionTitle"><div><span className="eyebrow">SOURCE TRACE</span><h3>判断履歴と根拠</h3></div><small>赤線 = 検知に使った記録</small></div><div className="timeline">{selected.evidence.map((entry, index) => <div className={entry.flagged ? "flagged" : ""} key={selected.id + "-" + index}><span className="timelineLine" /><SourceBadge source={entry.source} /><small>{entry.date} ・ {entry.role}</small><p>{entry.text}</p></div>)}</div></section>
              <section className="questionBox"><div><span>HR</span><small>確認時の質問案</small></div><p>「{selected.question}」</p></section>
              <footer className="detailActions"><button className="textButton" onClick={() => updateStatus(selected.id, "誤検知")}>誤検知として記録</button><div><button className="outlineButton" onClick={() => updateStatus(selected.id, "面談候補")}>面談候補に追加</button><button className="confirmButton" onClick={() => updateStatus(selected.id, "確認済み")}>確認済みにする</button></div></footer>
            </article>
          </section>
        </div>}

        {view === "architecture" && <div className="content architectureView">
          <section className="architectureIntro"><div><span className="eyebrow">ENGINEERING REVIEW</span><h2>今日確認したいのは、AI精度より先に<br />「安全に紐づけられるか」です。</h2></div><p>最初のパイロットは1部署・4週間・読み取り専用を想定。個人スコアは作らず、Backlog課題IDを中心に、Chatworkと会議記録を接続します。</p></section>
          <section className="dataFlow">
            <article><div className="systemIcon backlog">B</div><span>INPUT 01</span><strong>Backlog</strong><p>課題ID、状態変更、コメント、担当ロール、更新時刻</p><small>READ ONLY</small></article><i>+</i>
            <article><div className="systemIcon chatwork">C</div><span>INPUT 02</span><strong>Chatwork</strong><p>課題IDを含むメッセージ、投稿時刻、スレッド参照</p><small>READ ONLY</small></article><i>+</i>
            <article><div className="systemIcon meeting">M</div><span>INPUT 03</span><strong>会議記録</strong><p>決定事項、会議日時、関連案件、決定者ロール</p><small>READ ONLY</small></article><i>→</i>
            <article className="bridgeNode"><div className="systemIcon bridge">P</div><span>MATCHING LAYER</span><strong>Issue Graph</strong><p>課題ID・URL・期間から同じ成果物の判断履歴を構成</p><small>PROTOTYPE</small></article>
          </section>
          <section className="architectureGrid">
            <article className="panel questionsPanel"><header className="panelHeader"><div><span className="eyebrow">5 QUESTIONS</span><h2>エンジニアに聞きたいこと</h2></div></header><ol>
              <li><span>01</span><p><strong>Chatwork内でBacklog課題IDはどの程度使われていますか？</strong><small>IDがない会話を、どの情報なら安全に同じ案件へ紐づけられそうですか？</small></p></li>
              <li><span>02</span><p><strong>状態変更と差し戻し回数はAPI履歴から取得できますか？</strong><small>「手戻り」を推測ではなく、どのイベントで定義すべきでしょうか？</small></p></li>
              <li><span>03</span><p><strong>会議記録に案件IDやURLを追加する運用は現実的ですか？</strong><small>追加入力を増やさず、紐づけ精度を上げる方法を確認したいです。</small></p></li>
              <li><span>04</span><p><strong>読み取り専用トークンを部署・期間で制限できますか？</strong><small>4週間の限定パイロットで必要な最小権限を確認したいです。</small></p></li>
              <li><span>05</span><p><strong>保存しない設計は可能ですか？</strong><small>原文は各システムに残し、Bridge側には参照IDとHR判断だけを保持する案です。</small></p></li>
            </ol></article>
            <article className="panel guardrailPanel"><header className="panelHeader"><div><span className="eyebrow">PILOT GUARDRAILS</span><h2>最初からしないこと</h2></div></header><ul>
              <li><span>×</span><p><strong>社員・管理職のスコアリング</strong><small>案件と成果物だけを分析単位にする</small></p></li>
              <li><span>×</span><p><strong>感情・ストレス・性格の推定</strong><small>業務記録からセンシティブな推測をしない</small></p></li>
              <li><span>×</span><p><strong>自動的な人事判断</strong><small>候補を整理し、HRが必ず原文を確認する</small></p></li>
              <li><span>×</span><p><strong>全社一括接続</strong><small>承認済みの1部署・4週間から検証する</small></p></li>
            </ul><footer><strong>成功条件</strong><p>HRが週30分以内で確認でき、実際の手戻り原因を1件以上早期発見できること。</p></footer></article>
          </section>
        </div>}
      </section>
    </main>
  );
}
