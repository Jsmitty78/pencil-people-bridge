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
}> = [
  {
    key: "summary",
    label: "何についての相談ですか？",
    help: "結論ではなく、相談者が述べた出来事を匿名で要約します。",
    placeholder: "例：社員Aから、担当業務の優先順位について相談があった…",
  },
  {
    key: "timing",
    label: "いつ・どこで・何回？",
    help: "分からない場合は空欄で構いません。未入力として扱います。",
    placeholder: "例：月曜の会議と水曜の1on1。頻度は未確認…",
  },
  {
    key: "source",
    label: "情報源",
    help: "本人の報告、HRの直接観察、伝聞を区別します。",
    placeholder: "例：社員A本人から聞いた。HRは直接見ていない…",
  },
  {
    key: "records",
    label: "記録",
    help: "メール、チャット、会議メモ、シフト表など。内容は貼らず有無だけでも十分です。",
    placeholder: "例：会議メモの有無は未確認。チャットは残っている可能性がある…",
  },
  {
    key: "otherPerspectives",
    label: "他の関係者の説明",
    help: "未確認の視点を明示すると、一方の主張を事実扱いしにくくなります。",
    placeholder: "例：マネージャーと同席者にはまだ確認していない…",
  },
  {
    key: "concerns",
    label: "懸念・感情・影響",
    help: "推測や診断ではなく、本人が使った表現だけを書きます。",
    placeholder: "例：本人は混乱し、再度質問することを心配していると話した…",
  },
  {
    key: "desiredOutcome",
    label: "望んでいること",
    help: "AIが妥当性を判断するのではなく、希望として記録します。",
    placeholder: "例：優先順位と期限を文書で確認したい…",
  },
];

const guidedGroups: Array<{
  eyebrow: string;
  title: string;
  description: string;
  keys: Array<keyof GuidedInput>;
}> = [
  {
    eyebrow: "FACT CHECK",
    title: "事実確認",
    description: "いつ、誰から、どの記録で確認できるかを分けます。",
    keys: ["timing", "source", "records"],
  },
  {
    eyebrow: "PERSPECTIVE",
    title: "視点",
    description: "一方の説明だけで結論づけないための確認です。",
    keys: ["otherPerspectives"],
  },
  {
    eyebrow: "EMPLOYEE VOICE",
    title: "本人の声",
    description: "本人が実際に述べた感情と希望だけを記録します。",
    keys: ["concerns", "desiredOutcome"],
  },
];

const workflowSteps = [
  { number: 1, label: "相談情報", eyebrow: "INPUT" },
  { number: 2, label: "AI整理", eyebrow: "AI DRAFT" },
  { number: 3, label: "HR確認", eyebrow: "HUMAN REVIEW" },
  { number: 4, label: "面談準備", eyebrow: "MEETING PREP" },
];

const sections: Array<[keyof Analysis, string]> = [
  ["facts", "報告された出来事・主張 / Reported events & claims"],
  ["interpretations", "解釈・受け止め / Interpretations"],
  ["concerns", "懸念・表明された感情 / Concerns & emotions expressed"],
  ["missing_information", "不足している情報 / Missing information"],
  ["questions_to_clarify", "確認すべき質問 / Questions to clarify"],
  ["desired_outcomes", "望んでいる結果 / Desired outcomes"],
  ["possible_next_steps", "次のステップ候補 / Possible next steps"],
];

const analysisKeys: Array<keyof Analysis> = [
  "facts",
  "interpretations",
  "concerns",
  "missing_information",
  "questions_to_clarify",
  "desired_outcomes",
  "possible_next_steps",
];

const summaryHeadings: Record<keyof Analysis, string> = {
  facts: "報告された出来事・主張",
  interpretations: "解釈・受け止め",
  concerns: "懸念・表明された感情",
  missing_information: "不足している情報",
  questions_to_clarify: "確認すべき質問",
  desired_outcomes: "望んでいる結果",
  possible_next_steps: "次のステップ候補",
};

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

type GuidedFieldEditorProps = {
  field: (typeof guidedFields)[number];
  value: string;
  primary?: boolean;
  onChange: (value: string) => void;
};

function GuidedFieldEditor({ field, value, primary = false, onChange }: GuidedFieldEditorProps) {
  return (
    <div className={`guidedField ${primary ? "primaryQuestion" : ""}`}>
      <label className="fieldLabel" htmlFor={`guided-${field.key}`}>
        <span>{field.label}</span>
        {field.key === "summary" && <span className="requiredMark">必須</span>}
      </label>
      <p className="fieldHelp">{field.help}</p>
      <textarea
        className="guidedTextarea"
        id={`guided-${field.key}`}
        value={value}
        maxLength={GUIDED_FIELD_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
      <span className="fieldCount">{value.length} / {GUIDED_FIELD_MAX_LENGTH}</span>
    </div>
  );
}

function cloneAnalysis(source: Analysis): Analysis {
  return Object.fromEntries(
    analysisKeys.map((key) => [key, [...source[key]]])
  ) as Analysis;
}

function normalizeReviewedAnalysis(source: Analysis): Analysis {
  return Object.fromEntries(
    analysisKeys.map((key) => [
      key,
      source[key].map((item) => item.trim()).filter(Boolean),
    ])
  ) as Analysis;
}

function buildReviewedSummary(source: Analysis) {
  const content = analysisKeys.flatMap((key) => [
    `【${summaryHeadings[key]}】`,
    ...(source[key].length ? source[key].map((item) => `・${item}`) : ["・なし"]),
    "",
  ]);

  return [
    "PENCIL People Bridge — HR Issue Organizer V0",
    "確認状況：HRレビュー済み（AIの出力を人間のHRが確認・編集した内容です）",
    "",
    ...content,
    "注意：この整理結果は事実認定や人事判断ではありません。最終判断は人間のHRが行います。",
  ].join("\n");
}

type EditableSectionProps = {
  sectionKey: keyof Analysis;
  sectionIndex: number;
  title: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
};

function EditableSection({
  sectionKey,
  sectionIndex,
  title,
  items,
  onChange,
  onDelete,
  onAdd,
}: EditableSectionProps) {
  const [japaneseTitle, englishTitle] = title.split(" / ");

  return (
    <div className="editableSection" data-testid={`review-section-${sectionKey}`}>
      <div className="editableSectionHeader">
        <div className="reviewCategoryTitle">
          <span className="categoryIndex">{String(sectionIndex + 1).padStart(2, "0")}</span>
          <div>
            <h3>{japaneseTitle}</h3>
            <span>{englishTitle}</span>
          </div>
        </div>
        <button
          className="addItemButton"
          type="button"
          onClick={onAdd}
          data-testid={`add-${sectionKey}`}
        >
          ＋ 項目を追加
        </button>
      </div>
      {items.length ? (
        <div className="editableItems">
          {items.map((item, index) => (
            <div className="editableItem" key={`${sectionKey}-${index}`}>
              <span className="itemMarker" aria-hidden="true" />
              <textarea
                className="reviewTextarea"
                value={item}
                onChange={(event) => onChange(index, event.target.value)}
                aria-label={`${title} ${index + 1}`}
                data-testid={`review-item-${sectionKey}-${index}`}
              />
              <button
                className="deleteItemButton"
                type="button"
                onClick={() => onDelete(index)}
                aria-label={`${japaneseTitle}の項目${index + 1}を削除`}
                data-testid={`delete-${sectionKey}-${index}`}
                title="この項目を削除"
              >
                <span aria-hidden="true">×</span>
                <span className="srOnly">削除</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty editableEmpty">項目なし。「項目を追加」からHRの確認内容を追加できます。</p>
      )}
    </div>
  );
}

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("guided");
  const [guidedInput, setGuidedInput] = useState<GuidedInput>(EMPTY_GUIDED_INPUT);
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reviewedAnalysis, setReviewedAnalysis] = useState<Analysis | null>(null);
  const [reviewApproved, setReviewApproved] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filledGuidedCount = guidedFields.filter(({ key }) => guidedInput[key].trim()).length;
  const guidedNotes = buildGuidedNotes(guidedInput);
  const hasInput = inputMode === "guided" ? Boolean(guidedInput.summary.trim()) : Boolean(notes.trim());
  const currentStep = loading ? 2 : !analysis ? 1 : !reviewApproved ? 3 : 4;

  function clearResults() {
    setAnalysis(null);
    setReviewedAnalysis(null);
    setReviewApproved(false);
    setCopyStatus("");
    setError("");
  }

  function reset() {
    setGuidedInput(EMPTY_GUIDED_INPUT);
    setNotes("");
    setAnalysis(null);
    setReviewedAnalysis(null);
    setReviewApproved(false);
    setCopyStatus("");
    setError("");
  }

  function invalidateApproval() {
    setReviewApproved(false);
    setCopyStatus("");
  }

  function updateReviewedItem(key: keyof Analysis, index: number, value: string) {
    setReviewedAnalysis((current) => current ? {
      ...current,
      [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item),
    } : current);
    invalidateApproval();
  }

  function deleteReviewedItem(key: keyof Analysis, index: number) {
    setReviewedAnalysis((current) => current ? {
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    } : current);
    invalidateApproval();
  }

  function addReviewedItem(key: keyof Analysis) {
    setReviewedAnalysis((current) => current ? {
      ...current,
      [key]: [...current[key], ""],
    } : current);
    invalidateApproval();
  }

  function approveReviewedContent() {
    if (!reviewedAnalysis) return;
    setReviewedAnalysis(normalizeReviewedAnalysis(reviewedAnalysis));
    setReviewApproved(true);
    setCopyStatus("");
  }

  async function copyReviewedSummary() {
    if (!reviewedAnalysis || !reviewApproved) return;

    try {
      await navigator.clipboard.writeText(buildReviewedSummary(reviewedAnalysis));
      setCopyStatus("HRレビュー済みの整理結果をコピーしました。");
    } catch {
      setCopyStatus("コピーできませんでした。ブラウザのクリップボード権限を確認してください。");
    }
  }

  async function analyze() {
    const submittedNotes = inputMode === "guided" ? guidedNotes : notes.trim();
    if (!hasInput || loading) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setReviewedAnalysis(null);
    setReviewApproved(false);
    setCopyStatus("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: submittedNotes }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI analysis failed");
      if (!data.analysis) throw new Error("分析結果を取得できませんでした。");

      const aiAnalysis = data.analysis as Analysis;
      setAnalysis(aiAnalysis);
      setReviewedAnalysis(cloneAnalysis(aiAnalysis));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="appPage">
      <header className="appHeader">
        <div className="brandLockup" aria-label="PENCIL People Bridge">
          <div className="brandName">PENCIL<span aria-hidden="true">.</span></div>
          <div className="productName">People Bridge</div>
          <div className="productMeta">HR Issue Organizer / Prototype V0</div>
        </div>
        <div className="localStatus" role="status" aria-label="ローカルAI接続情報">
          <span className="statusDot" aria-hidden="true" />
          <div>
            <strong>Local AI</strong>
            <span>Ollama · qwen3:4b</span>
          </div>
          <small>No external API</small>
        </div>
      </header>

      <nav className="stepNavigation" aria-label="HR Issue Organizerの進行状況">
        {workflowSteps.map((step) => {
          const state = step.number === currentStep ? "active" : step.number < currentStep ? "complete" : "upcoming";
          return (
            <a
              className={`stepLink ${state}`}
              href={`#step-${step.number}`}
              key={step.number}
              aria-current={state === "active" ? "step" : undefined}
            >
              <span className="stepNumber">{String(step.number).padStart(2, "0")}</span>
              <span className="stepCopy">
                <strong>{step.label}</strong>
                <small>{step.eyebrow}</small>
              </span>
            </a>
          );
        })}
      </nav>

      <section className="heroIntro">
        <div className="heroRule" aria-hidden="true" />
        <div>
          <span className="eyebrow">HUMAN-CENTERED ISSUE ORGANIZATION</span>
          <h1>曖昧な相談を、<br /><span>対話できる情報へ。</span></h1>
        </div>
        <div className="heroDescription">
          <p>
            報告された出来事、解釈、感情、不足情報を分け、HRが確認した内容だけを面談準備に使います。
          </p>
          <p className="localNote">すべてのAI処理は、このPC上のローカルモデルで行われます。</p>
        </div>
      </section>

      <div className="safetyNotice" role="note">
        <span className="safetyLabel">HUMAN REVIEW REQUIRED</span>
        <p>AIの出力は事実認定・人事判断ではありません。必ず人間のHRが確認・修正してください。</p>
      </div>

      <div className="workflowCanvas">
        <section id="step-1" className={`workflowSection intakeSection ${currentStep === 1 ? "current" : ""}`} aria-busy={loading}>
          <div className="workflowHeading">
            <span className="oversizedNumber" aria-hidden="true">01</span>
            <div className="workflowHeadingCopy">
              <span className="sectionEyebrow">INPUT</span>
              <h2>相談情報を集める</h2>
              <p>匿名化した情報から、確認できることと不明なことを整理します。</p>
            </div>
            {(analysis || hasInput) && (
              <button className="textButton resetButton" type="button" onClick={reset} disabled={loading}>
                すべてリセット
              </button>
            )}
          </div>

          <div className="intakeToolbar">
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
                ガイド入力 <span>推奨</span>
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

            {inputMode === "guided" && (
              <div className="completeness" aria-label={`入力済み ${filledGuidedCount} / ${guidedFields.length} 項目`}>
                <div className="completenessCopy">
                  <span>INFORMATION</span>
                  <strong>{filledGuidedCount}<small> / {guidedFields.length}</small></strong>
                </div>
                <div className="completenessProgress">
                  <div className="completenessTrack" aria-hidden="true">
                    <span style={{ width: `${(filledGuidedCount / guidedFields.length) * 100}%` }} />
                  </div>
                  <p>
                    {filledGuidedCount >= 5
                      ? "分析に必要な観点がある程度そろっています。"
                      : "5項目以上を目安にすると、確認質問が具体的になります。"}
                  </p>
                </div>
                <button
                  className="sampleButton"
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
            )}
          </div>

          {inputMode === "guided" ? (
            <div className="guidedExperience">
              <GuidedFieldEditor
                field={guidedFields[0]}
                value={guidedInput.summary}
                primary
                onChange={(value) => {
                  setGuidedInput((current) => ({ ...current, summary: value }));
                  clearResults();
                }}
              />

              {guidedGroups.map((group) => (
                <section className="intakeGroup" key={group.title}>
                  <div className="intakeGroupHeading">
                    <span>{group.eyebrow}</span>
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                  <div className={`intakeGroupFields fields-${group.keys.length}`}>
                    {group.keys.map((key) => {
                      const field = guidedFields.find((item) => item.key === key);
                      if (!field) return null;
                      return (
                        <GuidedFieldEditor
                          field={field}
                          value={guidedInput[key]}
                          key={key}
                          onChange={(value) => {
                            setGuidedInput((current) => ({ ...current, [key]: value }));
                            clearResults();
                          }}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="freeformPanel">
              <div className="freeformHeading">
                <span className="sectionEyebrow">SECONDARY INPUT</span>
                <h3>匿名化したメモ</h3>
                <p>既に相談メモがある場合はこちらに入力できます。</p>
              </div>
              <label className="srOnly" htmlFor="notes">匿名化したメモ / Anonymized notes</label>
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
            </div>
          )}

          <div className="analysisAction">
            <p><strong>入力時の注意</strong> 実在の氏名、クライアント名、機密情報は入力しないでください。</p>
            <button className="primaryButton" type="button" onClick={analyze} disabled={loading || !hasInput}>
              <span>{loading ? "ローカルAIが整理しています…" : "AIで相談内容を整理する"}</span>
              <span className="buttonArrow" aria-hidden="true">→</span>
            </button>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
        </section>

        <section id="step-2" className={`workflowSection draftSection ${currentStep === 2 ? "current" : ""}`}>
          <div className="workflowHeading compact">
            <span className="oversizedNumber" aria-hidden="true">02</span>
            <div className="workflowHeadingCopy">
              <span className="sectionEyebrow">AI DRAFT</span>
              <h2>AIが整理した下書き</h2>
              <p>これは作業用の下書きです。まだ確認済みの情報ではありません。</p>
            </div>
            {(analysis || loading) && (
              <span
                className={`statusBadge ${reviewApproved ? "reference" : "draft"}`}
                data-testid="ai-draft-status"
              >
                {loading ? "PROCESSING" : reviewApproved ? "REFERENCE ONLY" : "AI DRAFT · 未確認"}
              </span>
            )}
          </div>

          {!analysis ? (
            <div className="pendingState">
              <span aria-hidden="true">02</span>
              <p>{loading ? "Ollama · qwen3:4b が情報を整理しています。" : "相談情報を入力すると、AIの下書きがここに表示されます。"}</p>
            </div>
          ) : (
            <>
              <div className="draftWarning">
                <strong>未確認 / UNREVIEWED</strong>
                <span>主張は検証済みの事実ではありません。次のHR確認で必ず修正してください。</span>
              </div>
              <div className="draftGrid">
                {sections.map(([key, title], index) => {
                  const [japaneseTitle, englishTitle] = title.split(" / ");
                  return (
                    <div className="resultSection" key={key}>
                      <div className="draftCategory">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div><h3>{japaneseTitle}</h3><small>{englishTitle}</small></div>
                      </div>
                      <ActionList items={analysis[key]} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section id="step-3" className={`workflowSection reviewSection ${reviewApproved ? "approved" : ""} ${currentStep === 3 ? "current" : ""}`}>
          <div className="workflowHeading compact">
            <span className="oversizedNumber" aria-hidden="true">03</span>
            <div className="workflowHeadingCopy">
              <span className="sectionEyebrow">HUMAN REVIEW</span>
              <h2>HRが確認・修正</h2>
              <p>AIの整理をそのまま採用せず、人間が確認します。</p>
            </div>
            {reviewedAnalysis && (
              <span
                className={`statusBadge ${reviewApproved ? "reviewed" : "reviewing"}`}
                data-testid="hr-review-status"
              >
                {reviewApproved ? "HR REVIEWED" : "REVIEW IN PROGRESS"}
              </span>
            )}
          </div>

          {!reviewedAnalysis ? (
            <div className="pendingState reviewPending">
              <span aria-hidden="true">03</span>
              <p>AI整理の後、すべての項目をここで編集・削除・追加できます。</p>
            </div>
          ) : (
            <>
              <div className={`reviewNotice ${reviewApproved ? "approved" : ""}`}>
                <strong>{reviewApproved ? "HR REVIEWED" : "確認ポイント"}</strong>
                <span>
                  {reviewApproved
                    ? "この内容は人間のHRが確認しました。編集すると承認状態は解除されます。"
                    : "根拠、表現、安全性を確認してください。空欄の項目は承認時に除外されます。"}
                </span>
              </div>
              <div className="reviewEditor">
                {sections.map(([key, title], index) => (
                  <EditableSection
                    key={key}
                    sectionKey={key}
                    sectionIndex={index}
                    title={title}
                    items={reviewedAnalysis[key]}
                    onChange={(itemIndex, value) => updateReviewedItem(key, itemIndex, value)}
                    onDelete={(itemIndex) => deleteReviewedItem(key, itemIndex)}
                    onAdd={() => addReviewedItem(key)}
                  />
                ))}
              </div>
              <div className="reviewActions">
                <button
                  className="reviewCompleteButton"
                  type="button"
                  onClick={approveReviewedContent}
                  data-testid="review-complete"
                >
                  <span>内容を確認しました</span>
                  <small>Review complete</small>
                </button>
                {reviewApproved && (
                  <button
                    className="copyButton"
                    type="button"
                    onClick={copyReviewedSummary}
                    data-testid="copy-reviewed-summary"
                  >
                    整理結果をコピー
                  </button>
                )}
              </div>
              {copyStatus && <p className="copyStatus" role="status">{copyStatus}</p>}
            </>
          )}
        </section>

        <section id="step-4" className={`workflowSection meetingPlan ${reviewApproved ? "unlocked" : "locked"} ${currentStep === 4 ? "current" : ""}`}>
          <div className="workflowHeading compact">
            <span className="oversizedNumber" aria-hidden="true">04</span>
            <div className="workflowHeadingCopy">
              <span className="sectionEyebrow">MEETING PREP</span>
              <h2>面談準備</h2>
              <p>HRが確認した内容だけを、次の対話の流れに整えます。</p>
            </div>
            {reviewApproved && <span className="statusBadge reviewed">HR REVIEWED</span>}
          </div>

          {!reviewApproved || !reviewedAnalysis ? (
            <div className="approvalGate" data-testid="meeting-approval-gate">
              <div className="lockMark" aria-hidden="true">04</div>
              <div>
                <strong>HR APPROVAL REQUIRED</strong>
                <span>「内容を確認しました」を押すと、面談準備が表示されます。</span>
              </div>
            </div>
          ) : (
            <>
              <div className="meetingTimeline">
                <div className="actionStage">
                  <div className="stageMarker"><span>01</span></div>
                  <div className="stageContent">
                    <span className="stageNumber">BEFORE</span>
                    <h3>事前に確認</h3>
                    <ActionList items={reviewedAnalysis.missing_information} />
                  </div>
                </div>
                <div className="actionStage">
                  <div className="stageMarker"><span>02</span></div>
                  <div className="stageContent">
                    <span className="stageNumber">DURING</span>
                    <h3>中立的に質問</h3>
                    <ActionList items={reviewedAnalysis.questions_to_clarify} />
                  </div>
                </div>
                <div className="actionStage">
                  <div className="stageMarker"><span>03</span></div>
                  <div className="stageContent">
                    <span className="stageNumber">AFTER</span>
                    <h3>次の対応候補</h3>
                    <ActionList items={reviewedAnalysis.possible_next_steps} />
                  </div>
                </div>
              </div>
              <div className="humanGate">
                <span>HUMAN DECISION</span>
                <strong>最終判断は人間のHRが行います。</strong>
                <p>確認結果を反映し、次の指示・対応を決めてください。</p>
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="appFooter">
        <span>PENCIL People Bridge</span>
        <p>V0 scope: HR Issue Organizer only · Local AI prototype · Human review required</p>
      </footer>
    </main>
  );
}
