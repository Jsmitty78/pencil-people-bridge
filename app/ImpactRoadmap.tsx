type Lang = "ja" | "en";

export default function ImpactRoadmap({ lang }: { lang: Lang }) {
  const en = lang === "en";

  const groups = [
    {
      label: "HR",
      before: en
        ? ["Problems found mainly through interviews", "Cases surface slowly", "Information is not accumulated", "Next action depends on individual judgment"]
        : ["個別面談を通じて問題を発見", "問題が表面化するまで時間がかかる", "情報がデータとして蓄積されない", "次の行動が個人判断に依存"],
      after: en
        ? ["Problems detected from existing records", "Evidence appears earlier", "Cases and feedback accumulate", "Interview targets and topics become clearer"]
        : ["既存記録から問題候補を自動検知", "根拠付きで早期に可視化", "案件とフィードバックを蓄積", "面談対象と質問を絞り込める"],
    },
    {
      label: en ? "Managers" : "管理職",
      before: en
        ? ["Instructions are scattered across tools", "Decision changes rely on memory", "Support begins after escalation", "Recurring workflow gaps stay hidden"]
        : ["指示が複数ツールに分散", "方針変更が個人の記憶に依存", "問題拡大後に支援を開始", "繰り返す業務上のズレが見えない"],
      after: en
        ? ["One evidence-linked decision history", "Changes become traceable", "Specific topics surface earlier", "Patterns can guide process improvement"]
        : ["根拠付きの判断履歴を一元化", "方針変更を追跡可能", "具体的な確認事項を早期提示", "パターンから業務改善へつなげる"],
    },
    {
      label: en ? "Company" : "会社",
      before: en
        ? ["Communication gaps are hard to see", "Rework causes are not tracked", "Similar problems repeat", "Process gaps can look like individual language issues"]
        : ["コミュニケーションのズレが見えない", "手戻りの原因が記録されない", "同じ問題が繰り返される", "業務上の問題が個人の語学問題に見える"],
      after: en
        ? ["Gaps are visible by work issue", "Rework and resolution patterns are tracked", "Recurring causes become visible", "Process gaps can be separated from language gaps"]
        : ["案件単位でズレを可視化", "手戻りと解決の傾向を記録", "繰り返す原因を可視化", "業務プロセスと語学の課題を分離"],
    },
  ];

  const roadmap = [
    { step: "01", title: en ? "Detect" : "検知", state: en ? "WORKING NOW" : "現在の実装", body: en ? "Contradictions, undocumented decisions, unusual rework, and source evidence." : "指示矛盾、記録外の決定、手戻り増加、元記録の根拠を検知。" },
    { step: "02", title: en ? "Understand" : "理解", state: en ? "PILOT NEXT" : "次のパイロット", body: en ? "Classify root causes and learn from HR false-positive feedback." : "原因を分類し、HRの誤検知フィードバックから改善。" },
    { step: "03", title: en ? "Act" : "行動", state: en ? "AFTER VALIDATION" : "検証後", body: en ? "Prepare interview questions, record missing decisions, and route follow-up." : "面談質問の準備、未記録の決定の記録、フォロー先の整理。" },
    { step: "04", title: en ? "Improve" : "改善", state: en ? "FUTURE" : "将来", body: en ? "Suggest clearer phrasing, tone, formality, communication method, and manager actions." : "表現、トーン、敬語、伝達方法、管理職の改善行動を提案。" },
  ];

  return <div className="content impactView">
    <section className="impactIntro">
      <div><span className="eyebrow">EXPECTED IMPACT</span><h2>{en ? "What changes when communication gaps become visible" : "コミュニケーションのズレが見えると何が変わるか"}</h2></div>
      <p>{en ? "See how evidence-backed detection supports earlier review, clearer follow-up, and better communication processes." : "根拠付きの検知によって、早期確認、明確なフォロー、より良いコミュニケーション業務を支援します。"}</p>
    </section>

    <section className="beforeAfterSection"><header><span className="eyebrow">BEFORE → AFTER</span><h2>{en ? "Concrete state change by stakeholder" : "関係者別の具体的な状態変化"}</h2></header><div className="beforeAfterGrid">{groups.map((group) => <article key={group.label}><h3>{group.label}</h3><div className="stateColumns"><div><span>BEFORE</span>{group.before.map((item) => <p key={item}>{item}</p>)}</div><i>→</i><div className="afterState"><span>AFTER</span>{group.after.map((item) => <p key={item}>{item}</p>)}</div></div></article>)}</div></section>

    <section className="roadmapSection"><header><span className="eyebrow">PRODUCT ROADMAP</span><h2>Detect → Understand → Act → Improve</h2></header><div className="roadmapGrid">{roadmap.map((item, index) => <article className={index === 0 ? "current" : ""} key={item.step}><span>{item.step}</span><small>{item.state}</small><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><footer>{en ? "Future communication coaching only follows privacy review, staff validation, and successful detection-pilot evidence." : "将来のコミュニケーション支援機能は、プライバシー審査、スタッフ検証、検知パイロットの成功後に進めます。"}</footer></section>
  </div>;
}
