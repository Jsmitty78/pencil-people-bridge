"use client";

import { useState } from "react";

type Analysis = {
  facts: string[];
  interpretations: string[];
  concerns: string[];
  missing_information: string[];
  questions_to_clarify: string[];
  desired_outcomes: string[];
  possible_next_steps: string[];
};

const MAX_NOTES_LENGTH = 8000;
const SAMPLE_NOTES =
  "社員から、担当マネージャーの指示が途中で変わることがあり、何を優先すべきか分からなくなるという相談があった。本人は質問すると迷惑に思われている気がして、最近は確認をためらうことがあると話している。指示変更がどのように伝えられたか、書面で残っているかはまだ確認できていない。";

const sections: Array<[keyof Analysis, string]> = [
  ["facts", "確認できる事実 / Facts"],
  ["interpretations", "解釈・受け止め / Interpretations"],
  ["concerns", "懸念・感情 / Concerns"],
  ["missing_information", "不足している情報 / Missing information"],
  ["questions_to_clarify", "確認すべき質問 / Questions to clarify"],
  ["desired_outcomes", "望んでいる結果 / Desired outcomes"],
  ["possible_next_steps", "次のステップ候補 / Possible next steps"],
];

export default function Home() {
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setNotes("");
    setAnalysis(null);
    setError("");
  }

  async function analyze() {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes || loading) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: trimmedNotes }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI analysis failed");
      if (!data.analysis) throw new Error("分析結果を取得できませんでした。");

      setAnalysis(data.analysis as Analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="eyebrow">PENCIL Internship 2026 · Prototype V0</div>
        <h1>PENCIL People Bridge</h1>
        <p className="subtitle">
          人事相談の内容をAIが整理し、HRが状況をより客観的に確認するための実験的ツールです。
          AIが判断するのではなく、人がより良い対話をするための準備を支援します。
        </p>
      </section>

      <div className="notice">
        <strong>Human review required.</strong> AIの出力は事実認定・人事判断ではありません。必ずHRまたはマネージャーが確認してください。
      </div>

      <section className="grid" aria-busy={loading}>
        <div className="card">
          <h2>1. 相談内容を入力</h2>
          <p className="empty">実在の氏名、クライアント名、機密情報は入力しないでください。</p>
          <label className="label" htmlFor="notes">匿名化したメモ / Anonymized notes</label>
          <textarea
            id="notes"
            value={notes}
            maxLength={MAX_NOTES_LENGTH}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="例：社員から、指示が途中で変わることが多く、質問すると迷惑に思われている気がするという相談があった…"
          />
          <div className="inputMeta">
            <span>{notes.length.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()} characters</span>
            <button
              className="textButton"
              type="button"
              onClick={() => {
                setNotes(SAMPLE_NOTES);
                setAnalysis(null);
                setError("");
              }}
              disabled={loading}
            >
              サンプルを入力
            </button>
          </div>
          <button type="button" onClick={analyze} disabled={loading || !notes.trim()}>
            {loading ? "整理しています…" : "AIで状況を整理する"}
          </button>
          {error && <div className="error" role="alert">{error}</div>}
        </div>

        <div className="card">
          <div className="resultHeader">
            <h2>2. 客観的に整理</h2>
            {(analysis || notes) && (
              <button className="textButton" type="button" onClick={reset} disabled={loading}>
                リセット
              </button>
            )}
          </div>
          {!analysis ? (
            <p className="empty">
              分析結果がここに表示されます。事実と解釈を分け、不足情報や次に確認すべき質問を整理します。
            </p>
          ) : (
            sections.map(([key, title]) => (
              <div className="resultSection" key={key}>
                <h3>{title}</h3>
                {analysis[key]?.length ? (
                  <ul>{analysis[key].map((item, i) => <li key={`${key}-${i}`}>{item}</li>)}</ul>
                ) : (
                  <span className="empty">なし / None identified</span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <p className="footerNote">V0 scope: HR Issue Organizer only. AI output is a preparation aid, not an HR decision.</p>
    </main>
  );
}
