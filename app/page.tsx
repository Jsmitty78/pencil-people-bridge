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

type InputMode = "guided" | "freeform";

type GuidedInput = {
  summary: string;
  timing: string;
  source: string;
  records: string;
  otherPerspectives: string;
  concerns: string;
  desiredOutcome: string;
};

const MAX_NOTES_LENGTH = 8000;
const GUIDED_FIELD_MAX_LENGTH = 900;

const EMPTY_GUIDED_INPUT: GuidedInput = {
  summary: "",
  timing: "",
  source: "",
  records: "",
  otherPerspectives: "",
  concerns: "",
  desiredOutcome: "",
};

const GUIDED_SAMPLE: GuidedInput = {
  summary:
    "社員Aから、担当マネージャーの指示が途中で変わり、何を優先すべきか分からなくなるという相談があった。",
  timing:
    "月曜日に新規顧客対応を優先するよう伝えられ、水曜日に既存顧客向け資料を先に仕上げるよう口頭で指示されたという。頻度はまだ確認していない。",
  source:
    "社員A本人から聞いた内容であり、HRはマネージャーや同席者にはまだ確認していない。",
  records:
    "月曜日の会議記録と、水曜日の指示がメールやチャットに残っているかは未確認。",
  otherPerspectives:
    "指示を変更した理由、期限、マネージャー側の説明はまだ不明。",
  concerns:
    "社員Aは混乱していると話し、質問すると迷惑に思われるのではないかと心配している。",
  desiredOutcome:
    "社員Aは、業務の優先順位と期限を文書で確認できるようにしたいと希望している。",
};

const SAMPLE_NOTES =
  "社員から、担当マネージャーの指示が途中で変わることがあり、何を優先すべきか分からなくなるという相談があった。本人は質問すると迷惑に思われている気がして、最近は確認をためらうことがあると話している。指示変更がどのように伝えられたか、書面で残っているかはまだ確認できていない。";

const guidedFields: Array<{
  key: keyof GuidedInput;
  label: string;
  help: string;
  placeholder: string;
  wide?: boolean;
}> = [
  {
    key: "summary",
    label: "何についての相談ですか？（必須）",
    help: "結論ではなく、相談者が述べた出来事を匿名で要約します。",
    placeholder: "例：社員Aから、担当業務の優先順位について相談があった…",
    wide: true,
  },
  {
    key: "timing",
    label: "いつ・どこで・何回ありましたか？",
    help: "分からない場合は空欄で構いません。未入力として扱います。",
    placeholder: "例：月曜の会議と水曜の1on1。頻度は未確認…",
  },
  {
    key: "source",
    label: "誰から聞いた／誰が観察しましたか？",
    help: "本人の報告、HRの直接観察、伝聞を区別します。",
    placeholder: "例：社員A本人から聞いた。HRは直接見ていない…",
  },
  {
    key: "records",
    label: "確認できる記録はありますか？",
    help: "メール、チャット、会議メモ、シフト表など。内容は貼らず有無だけでも十分です。",
    placeholder: "例：会議メモの有無は未確認。チャットは残っている可能性がある…",
  },
  {
    key: "otherPerspectives",
    label: "他の関係者の説明は確認しましたか？",
    help: "未確認の視点を明示すると、一方の主張を事実扱いしにくくなります。",
    placeholder: "例：マネージャーと同席者にはまだ確認していない…",
  },
  {
    key: "concerns",
    label: "本人が実際に述べた懸念・感情・影響は？",
    help: "推測や診断ではなく、本人が使った表現だけを書きます。",
    placeholder: "例：本人は混乱し、再度質問することを心配していると話した…",
  },
  {
    key: "desiredOutcome",
    label: "本人は何を望んでいますか？",
    help: "AIが妥当性を判断するのではなく、希望として記録します。",
    placeholder: "例：優先順位と期限を文書で確認したい…",
  },
];

const sections: Array<[keyof Analysis, string]> = [
  ["facts", "報告された事実 / Reported facts"],
  ["interpretations", "解釈・受け止め / Interpretations"],
  ["concerns", "懸念・感情 / Concerns"],
  ["missing_information", "不足している情報 / Missing information"],
  ["questions_to_clarify", "確認すべき質問 / Questions to clarify"],
  ["desired_outcomes", "望んでいる結果 / Desired outcomes"],
  ["possible_next_steps", "次のステップ候補 / Possible next steps"],
];

function buildGuidedNotes(input: GuidedInput) {
  const labels: Array<[keyof GuidedInput, string]> = [
    ["summary", "相談概要"],
    ["timing", "日時・場所・頻度"],
    ["source", "情報源・観察者"],
    ["records", "確認できる記録"],
    ["otherPerspectives", "他の関係者の説明"],
    ["concerns", "本人が述べた懸念・感情・影響"],
    ["desiredOutcome", "本人が望む結果"],
  ];

  return labels
    .map(([key, label]) => `【${label}】\n${input[key].trim() || "未入力（不明）"}`)
    .join("\n\n");
}

function ActionList({ items }: { items: string[] }) {
  return items.length ? (
    <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
  ) : (
    <span className="empty">なし / None identified</span>
  );
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("guided");
  const [guidedInput, setGuidedInput] = useState<GuidedInput>(EMPTY_GUIDED_INPUT);
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filledGuidedCount = guidedFields.filter(({ key }) => guidedInput[key].trim()).length;
  const guidedNotes = buildGuidedNotes(guidedInput);
  const hasInput = inputMode === "guided" ? Boolean(guidedInput.summary.trim()) : Boolean(notes.trim());

  function clearResults() {
    setAnalysis(null);
    setError("");
  }

  function reset() {
    setGuidedInput(EMPTY_GUIDED_INPUT);
    setNotes("");
    setAnalysis(null);
    setError("");
  }

  async function analyze() {
    const submittedNotes = inputMode === "guided" ? guidedNotes : notes.trim();
    if (!hasInput || loading) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: submittedNotes }),
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
        <div className="eyebrow">PENCIL Internship 2026 · HR Issue Organizer V0</div>
        <h1>PENCIL People Bridge</h1>
        <div className="localBadge">Local AI prototype</div>
        <p className="subtitle">
          短いガイド質問から相談情報を集め、報告された事実・解釈・感情・不足情報を分けて、
          次回の対話準備まで整理します。
        </p>
        <p className="localNote">
          このプロトタイプは、このPC上で動作するローカルモデル（Ollama / qwen3:4b）を使用します。
          有料AI APIやAPIキーは必要ありません。
        </p>
      </section>

      <div className="notice">
        <strong>Human review required.</strong> AIの出力は事実認定・人事判断ではありません。必ずHRまたはマネージャーが確認してください。
      </div>

      <section className="card inputCard" aria-busy={loading}>
        <div className="resultHeader">
          <div>
            <h2>1. 相談情報を集める</h2>
            <p className="empty inputIntro">
              実在の氏名、クライアント名、機密情報は入力しないでください。空欄は「不明」としてAIに渡します。
            </p>
          </div>
          {(analysis || hasInput) && (
            <button className="textButton" type="button" onClick={reset} disabled={loading}>
              すべてリセット
            </button>
          )}
        </div>

        <div className="modeTabs" role="group" aria-label="入力方法">
          <button
            className={`modeButton ${inputMode === "guided" ? "active" : ""}`}
            type="button"
            aria-pressed={inputMode === "guided"}
            onClick={() => {
              setInputMode("guided");
              clearResults();
            }}
            disabled={loading}
          >
            ガイド入力（推奨）
          </button>
          <button
            className={`modeButton ${inputMode === "freeform" ? "active" : ""}`}
            type="button"
            aria-pressed={inputMode === "freeform"}
            onClick={() => {
              setInputMode("freeform");
              clearResults();
            }}
            disabled={loading}
          >
            自由記述メモ
          </button>
        </div>

        {inputMode === "guided" ? (
          <>
            <div className="completeness" aria-label={`入力済み ${filledGuidedCount} / ${guidedFields.length} 項目`}>
              <div className="completenessHeader">
                <strong>情報の充足度：{filledGuidedCount} / {guidedFields.length} 項目</strong>
                <button
                  className="textButton"
                  type="button"
                  onClick={() => {
                    setGuidedInput(GUIDED_SAMPLE);
                    clearResults();
                  }}
                  disabled={loading}
                >
                  架空サンプルを入力
                </button>
              </div>
              <div className="completenessTrack" aria-hidden="true">
                <span style={{ width: `${(filledGuidedCount / guidedFields.length) * 100}%` }} />
              </div>
              <p>
                {filledGuidedCount >= 5
                  ? "分析に必要な観点がある程度そろっています。"
                  : "5項目以上を目安にすると、不足情報と確認質問を具体化しやすくなります。"}
              </p>
            </div>

            <div className="guidedGrid">
              {guidedFields.map(({ key, label, help, placeholder, wide }) => (
                <div className={`guidedField ${wide ? "wide" : ""}`} key={key}>
                  <label className="label" htmlFor={`guided-${key}`}>{label}</label>
                  <p className="fieldHelp">{help}</p>
                  <textarea
                    className="guidedTextarea"
                    id={`guided-${key}`}
                    value={guidedInput[key]}
                    maxLength={GUIDED_FIELD_MAX_LENGTH}
                    onChange={(event) => {
                      setGuidedInput((current) => ({ ...current, [key]: event.target.value }));
                      clearResults();
                    }}
                    placeholder={placeholder}
                  />
                  <span className="fieldCount">{guidedInput[key].length} / {GUIDED_FIELD_MAX_LENGTH}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="label" htmlFor="notes">匿名化したメモ / Anonymized notes</label>
            <textarea
              id="notes"
              value={notes}
              maxLength={MAX_NOTES_LENGTH}
              onChange={(event) => {
                setNotes(event.target.value);
                clearResults();
              }}
              placeholder="例：社員から、指示が途中で変わることが多く、質問すると迷惑に思われている気がするという相談があった…"
            />
            <div className="inputMeta">
              <span>{notes.length.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()} characters</span>
              <button
                className="textButton"
                type="button"
                onClick={() => {
                  setNotes(SAMPLE_NOTES);
                  clearResults();
                }}
                disabled={loading}
              >
                サンプルを入力
              </button>
            </div>
          </>
        )}

        <button className="primaryButton" type="button" onClick={analyze} disabled={loading || !hasInput}>
          {loading ? "整理しています…" : "AIで状況と次回アクションを整理する"}
        </button>
        {error && <div className="error" role="alert">{error}</div>}
      </section>

      <section className="resultWorkspace">
        <div className="card resultCard">
          <h2>2. 客観的に整理</h2>
          {!analysis ? (
            <p className="empty">
              分析結果がここに表示されます。報告された事実と解釈を分け、不足情報と確認質問を明確にします。
            </p>
          ) : (
            sections.map(([key, title]) => (
              <div className="resultSection" key={key}>
                <h3>{title}</h3>
                <ActionList items={analysis[key]} />
              </div>
            ))
          )}
        </div>

        <div className="card meetingPlan">
          <h2>3. 次回ミーティングに活かす</h2>
          <p className="meetingPlanIntro">
            AIが決定する行動ではありません。HRが選び、修正して使うための準備リストです。
          </p>
          {!analysis ? (
            <p className="empty">分析後、不足情報と質問を次回ミーティングの流れに並べ替えて表示します。</p>
          ) : (
            <>
              <div className="actionStage">
                <span className="stageNumber">Before</span>
                <h3>ミーティング前に確認</h3>
                <ActionList items={analysis.missing_information} />
              </div>
              <div className="actionStage">
                <span className="stageNumber">During</span>
                <h3>ミーティングで中立的に質問</h3>
                <ActionList items={analysis.questions_to_clarify} />
              </div>
              <div className="actionStage">
                <span className="stageNumber">After</span>
                <h3>ミーティング後の候補</h3>
                <ActionList items={analysis.possible_next_steps} />
              </div>
              <div className="humanGate">
                <strong>Human decision gate</strong>
                <span>確認結果を反映し、次の指示・対応は人間のHRが決めます。</span>
              </div>
            </>
          )}
        </div>
      </section>

      <p className="footerNote">V0 scope: HR Issue Organizer only. AI output is a preparation aid, not an HR decision.</p>
    </main>
  );
}
