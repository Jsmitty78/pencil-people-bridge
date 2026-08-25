"use client";

import { useMemo, useState } from "react";

type Lang = "ja" | "en";

type NumberFieldProps = {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
};

function NumberField({ label, value, suffix, onChange }: NumberFieldProps) {
  return <label className="valueField"><span>{label}</span><div><input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} /><b>{suffix}</b></div></label>;
}

function yen(value: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(Math.round(value));
}

export default function BusinessValue({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const [casesPerMonth, setCasesPerMonth] = useState(8);
  const [hrHoursSaved, setHrHoursSaved] = useState(1.5);
  const [hrHourlyCost, setHrHourlyCost] = useState(3500);
  const [affectedStaff, setAffectedStaff] = useState(20);
  const [weeklyReworkHours, setWeeklyReworkHours] = useState(1);
  const [reworkReduction, setReworkReduction] = useState(20);
  const [staffHourlyCost, setStaffHourlyCost] = useState(3000);
  const [resolutionHoursSaved, setResolutionHoursSaved] = useState(2);

  const value = useMemo(() => {
    const hr = casesPerMonth * hrHoursSaved * hrHourlyCost * 12;
    const rework = affectedStaff * weeklyReworkHours * 52 * (reworkReduction / 100) * staffHourlyCost;
    const resolution = casesPerMonth * resolutionHoursSaved * staffHourlyCost * 12;
    const annual = hr + rework + resolution;
    return { hr, rework, resolution, annual, referenceAnnualPrice: annual * .2, referenceMonthlyPrice: annual * .2 / 12 };
  }, [casesPerMonth, hrHoursSaved, hrHourlyCost, affectedStaff, weeklyReworkHours, reworkReduction, staffHourlyCost, resolutionHoursSaved]);

  const groups = [
    {
      label: "HR",
      before: en ? ["Problems found mainly through interviews", "Cases surface slowly", "Information is not accumulated", "Next action depends on individual judgment"] : ["個別面談を通じて問題を発見", "問題が表面化するまで時間がかかる", "情報がデータとして蓄積されない", "次の行動が個人判断に依存"],
      after: en ? ["Problems detected from existing records", "Evidence appears earlier", "Cases and feedback accumulate", "Interview targets and topics become clearer"] : ["既存記録から問題候補を自動検知", "根拠付きで早期に可視化", "案件とフィードバックを蓄積", "面談対象と質問を絞り込める"],
    },
    {
      label: en ? "Managers" : "管理職",
      before: en ? ["Instructions are scattered across tools", "Decision changes rely on memory", "Support begins after escalation", "Recurring workflow gaps stay hidden"] : ["指示が複数ツールに分散", "方針変更が個人の記憶に依存", "問題拡大後に支援を開始", "繰り返す業務上のズレが見えない"],
      after: en ? ["One evidence-linked decision history", "Changes become traceable", "Specific topics surface earlier", "Patterns can guide process improvement"] : ["根拠付きの判断履歴を一元化", "方針変更を追跡可能", "具体的な確認事項を早期提示", "パターンから業務改善へつなげる"],
    },
    {
      label: en ? "Company" : "会社",
      before: en ? ["Communication loss is invisible", "Rework cost is not measured", "Similar problems repeat", "Multilingual issues look like individual issues"] : ["コミュニケーション損失が見えない", "手戻りコストを測定できない", "同じ問題が繰り返される", "多言語問題が個人問題に見える"],
      after: en ? ["Loss becomes measurable by issue", "Rework and resolution time are tracked", "Repeated causes become visible", "Process gaps can be separated from language gaps"] : ["案件単位で損失を測定", "手戻りと解決時間を記録", "繰り返す原因を可視化", "業務プロセスと語学の課題を分離"],
    },
  ];

  const roadmap = [
    { step: "01", title: en ? "Detect" : "検知", state: en ? "WORKING NOW" : "現在の実装", body: en ? "Contradictions, undocumented decisions, unusual rework, and source evidence." : "指示矛盾、記録外の決定、手戻り増加、元記録の根拠を検知。" },
    { step: "02", title: en ? "Understand" : "理解", state: en ? "PILOT NEXT" : "次のパイロット", body: en ? "Classify root causes and learn from HR false-positive feedback." : "原因を分類し、HRの誤検知フィードバックから改善。" },
    { step: "03", title: en ? "Act" : "行動", state: en ? "AFTER VALIDATION" : "検証後", body: en ? "Prepare interview questions, record missing decisions, and route follow-up." : "面談質問の準備、未記録の決定の記録、フォロー先の整理。" },
    { step: "04", title: en ? "Improve" : "改善", state: en ? "FUTURE" : "将来", body: en ? "Suggest clearer phrasing, tone, formality, communication method, and manager actions." : "表現、トーン、敬語、伝達方法、管理職の改善行動を提案。" },
  ];

  return <div className="content businessView">
    <section className="valueNotice"><div><span>ILLUSTRATIVE MODEL</span><strong>{en ? "Replace every assumption with PENCIL-validated data before claiming financial impact." : "財務効果を主張する前に、すべての仮定をPENCILの実データで検証します。"}</strong></div><p>{en ? "This calculator makes the logic transparent. It is not a validated ROI claim." : "計算ロジックを透明化するための試算であり、検証済みROIではありません。"}</p></section>

    <section className="valueHero">
      <article><span>{en ? "Illustrative annual value" : "年間価値の試算"}</span><strong>{yen(value.annual)}</strong><small>{en ? "HR time + avoided rework + faster resolution" : "HR時間＋手戻り削減＋解決時間短縮"}</small></article>
      <article><span>{en ? "HR discovery savings" : "HR発見時間の削減"}</span><strong>{yen(value.hr)}</strong><small>{casesPerMonth} × {hrHoursSaved}h × {yen(hrHourlyCost)} × 12</small></article>
      <article><span>{en ? "Productivity value" : "生産性向上価値"}</span><strong>{yen(value.rework + value.resolution)}</strong><small>{en ? "Rework reduction + resolution time" : "手戻り削減＋問題解決時間"}</small></article>
      <article className="priceCard"><span>{en ? "20% value reference" : "価値の20%参考価格"}</span><strong>{yen(value.referenceMonthlyPrice)}<b>/{en ? "mo" : "月"}</b></strong><small>{yen(value.referenceAnnualPrice)} / {en ? "year" : "年"}</small></article>
    </section>

    <section className="businessGrid">
      <article className="panel assumptionsPanel"><header className="panelHeader"><div><span className="eyebrow">ASSUMPTIONS</span><h2>{en ? "Edit the calculation inputs" : "計算条件を編集"}</h2></div></header><div className="valueFields">
        <NumberField label={en ? "Cases discovered per month" : "月間の問題案件"} value={casesPerMonth} suffix={en ? "cases" : "件"} onChange={setCasesPerMonth} />
        <NumberField label={en ? "HR hours saved per case" : "1案件あたりHR削減時間"} value={hrHoursSaved} suffix={en ? "hours" : "時間"} onChange={setHrHoursSaved} />
        <NumberField label={en ? "HR hourly cost" : "HR時間単価"} value={hrHourlyCost} suffix="¥/h" onChange={setHrHourlyCost} />
        <NumberField label={en ? "Affected staff" : "対象スタッフ数"} value={affectedStaff} suffix={en ? "people" : "人"} onChange={setAffectedStaff} />
        <NumberField label={en ? "Weekly rework per person" : "1人あたり週次手戻り"} value={weeklyReworkHours} suffix={en ? "hours" : "時間"} onChange={setWeeklyReworkHours} />
        <NumberField label={en ? "Expected rework reduction" : "想定手戻り削減率"} value={reworkReduction} suffix="%" onChange={setReworkReduction} />
        <NumberField label={en ? "Average staff hourly cost" : "スタッフ平均時間単価"} value={staffHourlyCost} suffix="¥/h" onChange={setStaffHourlyCost} />
        <NumberField label={en ? "Resolution hours saved per case" : "1案件あたり解決短縮時間"} value={resolutionHoursSaved} suffix={en ? "hours" : "時間"} onChange={setResolutionHoursSaved} />
      </div></article>
      <article className="panel formulaPanel"><header className="panelHeader"><div><span className="eyebrow">VALUE BREAKDOWN</span><h2>{en ? "Where the value comes from" : "価値の内訳"}</h2></div></header><div className="formulaRows">
        <div><span>01</span><p><strong>{en ? "HR discovery time" : "HR問題発見時間"}</strong><small>{en ? "Cases × saved hours × hourly cost × 12" : "案件数 × 削減時間 × 時間単価 × 12"}</small></p><b>{yen(value.hr)}</b></div>
        <div><span>02</span><p><strong>{en ? "Avoided communication rework" : "コミュニケーション手戻り削減"}</strong><small>{en ? "Staff × weekly rework × 52 × reduction × cost" : "人数 × 週次手戻り × 52 × 削減率 × 単価"}</small></p><b>{yen(value.rework)}</b></div>
        <div><span>03</span><p><strong>{en ? "Faster problem resolution" : "問題解決時間の短縮"}</strong><small>{en ? "Cases × resolution hours saved × staff cost × 12" : "案件数 × 解決短縮時間 × スタッフ単価 × 12"}</small></p><b>{yen(value.resolution)}</b></div>
      </div><footer><span>{en ? "Illustrative annual total" : "年間合計試算"}</span><strong>{yen(value.annual)}</strong></footer></article>
    </section>

    <section className="beforeAfterSection"><header><span className="eyebrow">BEFORE → AFTER</span><h2>{en ? "Concrete state change by stakeholder" : "関係者別の具体的な状態変化"}</h2></header><div className="beforeAfterGrid">{groups.map((group) => <article key={group.label}><h3>{group.label}</h3><div className="stateColumns"><div><span>BEFORE</span>{group.before.map((item) => <p key={item}>{item}</p>)}</div><i>→</i><div className="afterState"><span>AFTER</span>{group.after.map((item) => <p key={item}>{item}</p>)}</div></div></article>)}</div></section>

    <section className="roadmapSection"><header><span className="eyebrow">PRODUCT ROADMAP</span><h2>Detect → Understand → Act → Improve</h2></header><div className="roadmapGrid">{roadmap.map((item, index) => <article className={index === 0 ? "current" : ""} key={item.step}><span>{item.step}</span><small>{item.state}</small><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><footer>{en ? "Future communication coaching only follows privacy review, staff validation, and successful detection-pilot evidence." : "将来のコミュニケーション支援機能は、プライバシー審査、スタッフ検証、検知パイロットの成功後に進めます。"}</footer></section>
  </div>;
}
