"use client";

import { useMemo, useState } from "react";

type Channel = "chatwork" | "backlog" | "email" | "other";
type Status = "clear" | "unclear" | "missing";

type ContextItem = {
  label: string;
  status: Status;
  note: string;
};

type ContextCheckResult = {
  clarity_score: number;
  summary: string;
  items: ContextItem[];
  risks: string[];
  questions: string[];
  improved_ja: string;
  improved_en: string;
};

type Sample = {
  title: string;
  hint: string;
  channel: Channel;
  text: string;
  source?: "hr";
};

const CHANNEL_LABELS: Record<Channel, string> = {
  chatwork: "Chatwork",
  backlog: "Backlog",
  email: "メール",
  other: "その他",
};

const SAMPLES: Sample[] = [
  {
    title: "HR実例 1",
    hint: "目的・依頼内容が抜けた共有",
    channel: "chatwork",
    source: "hr",
    text: "▼3ヶ月振り返りシートです。\n（共有リンク）",
  },
  {
    title: "HR実例 2",
    hint: "期限の粒度があいまい",
    channel: "chatwork",
    source: "hr",
    text: "シートを記入しました。\n（共有リンク）\n面談まで記入してください",
  },
  {
    title: "あいまい表現",
    hint: "『いつもの感じで』『例の件』",
    channel: "chatwork",
    text: "お疲れさまです。\n例の資料、いつもの感じで直しておいてもらえますか？\n前回と同じ流れで大丈夫です。よろしくお願いします。",
  },
  {
    title: "期限・担当不明",
    hint: "誰が・いつまでか不明",
    channel: "backlog",
    text: "架空プロジェクトAの見積もり、そろそろ更新が必要そうです。\n新しい要件が増えたので反映をお願いします。\n完了したら共有してください。",
  },
  {
    title: "指示が食い違う",
    hint: "上長間で内容が矛盾",
    channel: "email",
    text: "架空商事さま向け提案書について。\n田中部長からは『来週の会議までに簡易版で出して』と言われていますが、佐藤課長からは『詳細版を今日中に』と聞いています。\nとりあえず進めておきます。",
  },
  {
    title: "背景不足",
    hint: "目的・経緯が共有されていない",
    channel: "chatwork",
    text: "架空チームBの定例、来週から水曜に変更します。\nアジェンダは前回のものを流用でお願いします。",
  },
];

const STATUS_LABELS: Record<Status, string> = {
  clear: "明確",
  unclear: "要確認",
  missing: "不足",
};

function CopyButton({ text, label, primary = false }: { text: string; label: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className={`copyBtn ${primary ? "primary" : ""}`} type="button" onClick={copy} disabled={!text}>
      <span className="copyIcon" aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      {copied ? "コピー済み" : label}
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, score));
  return (
    <div className="scoreRing" style={{ "--score": `${safe * 3.6}deg` } as React.CSSProperties}>
      <div className="scoreRingInner">
        <strong>{safe}</strong>
        <span>/ 100</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("chatwork");
  const [withEnglish, setWithEnglish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContextCheckResult | null>(null);
  const [activeTopTab, setActiveTopTab] = useState<"compose" | "check" | "rewrite">("compose");

  const warningCount = useMemo(
    () => result?.items.filter((item) => item.status !== "clear").length ?? 0,
    [result],
  );

  async function runCheck() {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    setActiveTopTab("check");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), channel, withEnglish }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "チェックに失敗しました。");
      if (!data.analysis) throw new Error("分析結果を取得できませんでした。");
      setResult(data.analysis as ContextCheckResult);
      setActiveTopTab("rewrite");
    } catch (err) {
      setError(err instanceof Error ? err.message : "チェックに失敗しました。");
      setActiveTopTab("compose");
    } finally {
      setLoading(false);
    }
  }

  function loadSample(sample: Sample) {
    setMessage(sample.text);
    setChannel(sample.channel);
    setResult(null);
    setError("");
    setActiveTopTab("compose");
  }

  return (
    <div className="shell">
      <aside className="brandRail" aria-label="PENCIL brand rail">
        <div className="railLogo">PENCIL<span>.</span></div>
        <div className="railMark">CB</div>
        <div className="railBottom">AI</div>
      </aside>

      <div className="appFrame">
        <header className="topBar">
          <div className="topTitle">
            <strong>PENCIL Context Bridge</strong>
            <span>送信前コミュニケーション支援</span>
          </div>
          <nav className="topTabs" aria-label="workflow tabs">
            <button className={activeTopTab === "compose" ? "active" : ""} onClick={() => setActiveTopTab("compose")} type="button">
              <span>01</span> メッセージ作成
            </button>
            <button className={activeTopTab === "check" ? "active" : ""} onClick={() => setActiveTopTab("check")} type="button">
              <span>02</span> コンテキストチェック
            </button>
            <button className={activeTopTab === "rewrite" ? "active" : ""} onClick={() => setActiveTopTab("rewrite")} type="button">
              <span>03</span> AI提案
            </button>
          </nav>
          <div className="aiStatus">
            <span className="liveDot" aria-hidden="true" />
            <div><strong>LOCAL AI</strong><small>Ollama · qwen3:4b</small></div>
          </div>
        </header>

        <main className="dashboard">
          <section className="panel composerPanel">
            <div className="panelHeader">
              <div>
                <span className="panelKicker">MESSAGE COMPOSER</span>
                <h1>送信前メッセージ</h1>
              </div>
              <span className="privacyPill">匿名・架空データのみ</span>
            </div>

            <div className="composerMetaRow">
              <div className="fieldGroup compactField">
                <label>送信先</label>
                <div className="channelTabs">
                  {(Object.keys(CHANNEL_LABELS) as Channel[]).map((key) => (
                    <button
                      type="button"
                      key={key}
                      className={channel === key ? "active" : ""}
                      onClick={() => setChannel(key)}
                    >
                      {CHANNEL_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="englishSwitch">
                <input type="checkbox" checked={withEnglish} onChange={(event) => setWithEnglish(event.target.checked)} />
                <span className="switchTrack"><i /></span>
                <span>英語版</span>
              </label>
            </div>

            <div className="fieldGroup messageField">
              <div className="fieldLabelRow">
                <label htmlFor="message-draft">メッセージ</label>
                <span>{message.length.toLocaleString()} / 6,000</span>
              </div>
              <textarea
                id="message-draft"
                value={message}
                maxLength={6000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="送信予定のメッセージを入力してください…"
              />
            </div>

            <button className="checkButton" type="button" onClick={runCheck} disabled={!message.trim() || loading}>
              <span aria-hidden="true">✦</span>
              {loading ? "AIが確認中…" : "送信前コンテキストチェック"}
            </button>
            {error && <div className="inlineError">{error}</div>}

            <div className="samplesSection">
              <div className="samplesHeader">
                <div>
                  <span className="panelKicker">TEST CASES</span>
                  <h2>サンプルケース</h2>
                </div>
                <small>クリックして入力</small>
              </div>
              <div className="sampleList">
                {SAMPLES.map((sample, index) => (
                  <button key={sample.title} className={`sampleRow ${sample.source === "hr" ? "hr" : ""}`} type="button" onClick={() => loadSample(sample)}>
                    <span className="sampleIndex">{String(index + 1).padStart(2, "0")}</span>
                    <span className="sampleText"><strong>{sample.title}</strong><small>{sample.hint}</small></span>
                    {sample.source === "hr" && <em>HR実例</em>}
                    <span className="sampleArrow">›</span>
                  </button>
                ))}
              </div>
              <p className="sourceNote">HR実例は、提供されたコミュニケーション記録から個人・固有情報を取り除いた検証用ケースです。</p>
            </div>
          </section>

          <section className="panel checkPanel">
            <div className="panelHeader dense">
              <div>
                <span className="panelKicker">CONTEXT CHECK</span>
                <h2>共通理解チェック</h2>
              </div>
              {result && <span className={`issueCount ${warningCount ? "hasIssues" : ""}`}>{warningCount} issues</span>}
            </div>

            {!result ? (
              <div className="emptyState">
                <div className="emptyIcon">◎</div>
                <strong>{loading ? "メッセージを分析しています" : "まだチェックされていません"}</strong>
                <p>{loading ? "目的・背景・担当・期限・曖昧表現などを確認中です。" : "左のメッセージを入力して、送信前チェックを実行してください。"}</p>
              </div>
            ) : (
              <>
                <div className="scoreBlock">
                  <ScoreRing score={result.clarity_score} />
                  <div className="scoreCopy">
                    <span>CONTEXT SCORE</span>
                    <h3>{result.clarity_score >= 80 ? "かなり明確です" : result.clarity_score >= 60 ? "少し補足すると安心です" : "送信前に確認が必要です"}</h3>
                    <p>{result.summary}</p>
                  </div>
                </div>

                <div className="contextRows">
                  {result.items.map((item, index) => (
                    <div className="contextRow" key={`${item.label}-${index}`}>
                      <span className={`contextStatus ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                      <div><strong>{item.label}</strong><p>{item.note}</p></div>
                    </div>
                  ))}
                </div>

                <div className="miniCards">
                  <article>
                    <span>⚠</span>
                    <div><strong>誤解リスク</strong><p>{result.risks[0] || "大きなリスクは検出されませんでした。"}</p></div>
                  </article>
                  <article>
                    <span>?</span>
                    <div><strong>送信前の確認</strong><p>{result.questions[0] || "追加確認は不要です。"}</p></div>
                  </article>
                </div>
              </>
            )}
          </section>

          <section className="panel rewritePanel">
            <div className="panelHeader dense">
              <div>
                <span className="panelKicker">AI SUGGESTION</span>
                <h2>AI提案文</h2>
              </div>
              <span className="toolBadge">{CHANNEL_LABELS[channel]}</span>
            </div>

            {!result ? (
              <div className="emptyState rewriteEmpty">
                <div className="emptyIcon">✦</div>
                <strong>改善案はここに表示されます</strong>
                <p>不足情報はAIが勝手に作らず、【要確認: ...】として残します。</p>
              </div>
            ) : (
              <>
                <div className="rewriteInfo">
                  <span className="rewriteLabel">改善後の日本語</span>
                  <span className="rewriteHint">そのまま編集できます</span>
                </div>
                <textarea
                  className="rewriteTextarea"
                  value={result.improved_ja}
                  onChange={(event) => setResult({ ...result, improved_ja: event.target.value })}
                />

                <div className="rewriteActions">
                  <CopyButton text={result.improved_ja} label={`${CHANNEL_LABELS[channel]}用にコピー`} primary />
                  <CopyButton text={result.improved_ja} label="テキストコピー" />
                </div>

                {result.improved_en && (
                  <div className="englishOutput">
                    <div className="rewriteInfo"><span className="rewriteLabel">English</span><span className="rewriteHint">optional</span></div>
                    <textarea value={result.improved_en} onChange={(event) => setResult({ ...result, improved_en: event.target.value })} />
                    <CopyButton text={result.improved_en} label="Copy English" />
                  </div>
                )}

                <div className="confirmQuestions">
                  <span className="panelKicker">BEFORE SEND</span>
                  <h3>送信前に確認したいこと</h3>
                  {result.questions.length ? (
                    <ol>{result.questions.map((question, index) => <li key={index}>{question}</li>)}</ol>
                  ) : (
                    <p>追加確認は不要です。</p>
                  )}
                </div>
              </>
            )}

            <div className="futureStrip">
              <span>FUTURE</span>
              <p>将来は、本人同意と適切な保護のもとで、既存のコミュニケーション傾向データに合わせた文章調整を検討。</p>
            </div>
          </section>
        </main>

        <footer className="statusFooter">
          <div><span className="liveDot" /> Local AI connected</div>
          <div>Input not persisted</div>
          <div>PENCIL Context Bridge · Internship Prototype</div>
        </footer>
      </div>
    </div>
  );
}
