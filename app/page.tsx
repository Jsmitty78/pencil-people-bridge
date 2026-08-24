"use client";

import { useState } from "react";

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
    title: "HR実例（匿名化）",
    hint: "目的・依頼内容が抜けた共有",
    channel: "chatwork",
    source: "hr",
    text: "▼3ヶ月振り返りシートです。\n（共有リンク）",
  },
  {
    title: "依頼の伝え方・期限",
    hint: "HR実例（匿名化）／期限の粒度",
    channel: "chatwork",
    source: "hr",
    text: "シートを記入しました。\n（共有リンク）\n面談まで記入してください",
  },
  {
    title: "あいまいな表現",
    hint: "『いつもの感じで』『例のやつ』",
    channel: "chatwork",
    text: "お疲れさまです。\n例の資料、いつもの感じで直しておいてもらえますか？\n前回と同じ流れで大丈夫です。よろしくお願いします。",
  },
  {
    title: "期限・担当が不明",
    hint: "誰が・いつまでかが書かれていない",
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
    title: "背景が抜けている",
    hint: "目的・経緯が共有されていない",
    channel: "chatwork",
    text: "架空チームBの定例、来週から水曜に変更します。\nアジェンダは前回のものを流用でお願いします。",
  },
];

const STATUS_LABELS: Record<Status, string> = {
  clear: "OK",
  unclear: "あいまい",
  missing: "不足",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="copyButton" type="button" onClick={copy} disabled={!text}>
      {copied ? "コピーしました" : label}
    </button>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<Channel>("chatwork");
  const [withEnglish, setWithEnglish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContextCheckResult | null>(null);

  async function runCheck() {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "チェックに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="contextPage">
      <header className="contextHeader">
        <div className="brandLockup">
          <span className="brandName">PENCIL<span>.</span></span>
          <span className="productName">Context Bridge</span>
        </div>
        <div className="localStatus">
          <span className="statusDot" aria-hidden="true" />
          <div>
            <strong>Local AI</strong>
            <span>Ollama · qwen3:4b</span>
          </div>
          <small>No external API</small>
        </div>
      </header>

      <section className="hero">
        <div className="heroRule" aria-hidden="true" />
        <div>
          <span className="eyebrow">PRE-SEND CONTEXT CHECK</span>
          <h1>送信前に、<br /><span>共通理解をチェック。</span></h1>
        </div>
        <div className="heroCopy">
          <p>情報は伝わっている。でも、共通理解として残っていない。</p>
          <strong>翻訳から、共通理解へ。</strong>
          <p className="small">Chatwork・Backlog・メールに送る前のメッセージを、目的・背景・依頼内容・担当・期限などの観点から確認します。</p>
        </div>
      </section>

      <section className="privacyNotice">
        <strong>ANONYMIZED / FICTIONAL INPUTS ONLY</strong>
        <p>実在の顧客名・従業員名・機密情報は入力しないでください。入力内容は保存されません。AIは人物評価・診断・人事判断を行いません。</p>
      </section>

      <section className="workbench">
        <div className="sectionHeader">
          <div>
            <span className="sectionNumber">01</span>
            <span className="sectionEyebrow">DRAFT MESSAGE</span>
            <h2>送信予定のメッセージ</h2>
          </div>
        </div>

        <div className="samplesBlock">
          <div className="samplesTitle">
            <strong>サンプルで試す</strong>
            <span>架空・匿名化済み</span>
          </div>
          <div className="sampleGrid">
            {SAMPLES.map((sample) => (
              <button
                key={sample.title}
                className={`sampleCard ${sample.source === "hr" ? "hrSample" : ""}`}
                type="button"
                onClick={() => {
                  setMessage(sample.text);
                  setChannel(sample.channel);
                  setResult(null);
                  setError("");
                }}
              >
                <span className="sampleTitleRow">
                  <strong>{sample.title}</strong>
                  {sample.source === "hr" && <em>匿名化実例</em>}
                </span>
                <small>{sample.hint}</small>
              </button>
            ))}
          </div>
          <p className="sampleNote">「匿名化実例」は、HRからプロトタイプ検証用に提供されたコミュニケーション記録を、個人や固有情報が分からない形に短縮したものです。</p>
        </div>

        <label className="draftLabel" htmlFor="message-draft">メッセージ下書き</label>
        <textarea
          id="message-draft"
          className="draftTextarea"
          value={message}
          maxLength={6000}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="例：架空プロジェクトAの資料、例の感じで直しておいてください。"
        />
        <div className="charCount">{message.length.toLocaleString()} / 6,000</div>

        <div className="controlsRow">
          <div className="channelButtons" role="group" aria-label="送信先ツール">
            {(Object.keys(CHANNEL_LABELS) as Channel[]).map((key) => (
              <button
                key={key}
                type="button"
                className={channel === key ? "active" : ""}
                aria-pressed={channel === key}
                onClick={() => setChannel(key)}
              >
                {CHANNEL_LABELS[key]}
              </button>
            ))}
          </div>
          <label className="englishToggle">
            <input
              type="checkbox"
              checked={withEnglish}
              onChange={(event) => setWithEnglish(event.target.checked)}
            />
            <span>英語版も作成</span>
          </label>
        </div>

        <button className="primaryButton" type="button" onClick={runCheck} disabled={!message.trim() || loading}>
          {loading ? "チェック中…" : "共通理解をチェック"}
        </button>
        {error && <p className="errorMessage">{error}</p>}
      </section>

      {result && (
        <section className="resultsArea">
          <div className="sectionHeader resultHeader">
            <div>
              <span className="sectionNumber">02</span>
              <span className="sectionEyebrow">CONTEXT REVIEW</span>
              <h2>共通理解チェック結果</h2>
            </div>
            <div className="scoreCircle" aria-label={`共通理解スコア ${result.clarity_score}点`}>
              <strong>{result.clarity_score}</strong>
              <span>/ 100</span>
            </div>
          </div>

          <p className="summaryText">{result.summary}</p>

          <div className="checklist">
            {result.items.map((item, index) => (
              <div className="checkRow" key={`${item.label}-${index}`}>
                <span className={`statusBadge ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          {(result.risks.length > 0 || result.questions.length > 0) && (
            <div className="insightGrid">
              <article>
                <span className="cardEyebrow">RISK</span>
                <h3>誤解が生まれうる点</h3>
                {result.risks.length ? <ul>{result.risks.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>大きなリスクは検出されませんでした。</p>}
              </article>
              <article>
                <span className="cardEyebrow">CONFIRM</span>
                <h3>送信前に確認したいこと</h3>
                {result.questions.length ? <ul>{result.questions.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>追加確認は不要です。</p>}
              </article>
            </div>
          )}

          <article className="improvedCard">
            <span className="cardEyebrow">READY TO PASTE</span>
            <h3>改善案（日本語）</h3>
            <p className="placeholderNote">【要確認: ...】は、AIが勝手に埋めず、送信者が確認すべき情報として残しています。</p>
            <textarea
              className="improvedTextarea"
              value={result.improved_ja}
              onChange={(event) => setResult({ ...result, improved_ja: event.target.value })}
            />
            <div className="copyActions">
              <CopyButton text={result.improved_ja} label="Backlog用にコピー" />
              <CopyButton text={result.improved_ja} label="Chatwork用にコピー" />
              <CopyButton text={result.improved_ja} label="テキストをコピー" />
            </div>
          </article>

          {result.improved_en && (
            <article className="improvedCard englishCard">
              <span className="cardEyebrow">ENGLISH</span>
              <h3>English version</h3>
              <textarea
                className="improvedTextarea"
                value={result.improved_en}
                onChange={(event) => setResult({ ...result, improved_en: event.target.value })}
              />
              <div className="copyActions"><CopyButton text={result.improved_en} label="Copy English" /></div>
            </article>
          )}
        </section>
      )}

      <section className="futureVision">
        <span className="sectionEyebrow">FUTURE VISION</span>
        <h2>相手に合わせた「伝わり方」へ</h2>
        <p>Hitomiさんからのフィードバックとして、将来は本人同意と適切なプライバシー保護を前提に、社員の既存のパーソナリティ／コミュニケーション傾向データを活用し、「この相手にはどう伝えると理解されやすいか」に合わせて文章を調整する構想があります。</p>
        <strong>このプロトタイプでは、パーソナリティデータの取得・保存・推測は一切行いません。</strong>
      </section>

      <footer className="contextFooter">
        <strong>PENCIL Context Bridge</strong>
        <span>Local prototype · Input is not persisted</span>
      </footer>
    </main>
  );
}
