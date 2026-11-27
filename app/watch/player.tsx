'use client';

import { useEffect, useRef, useState } from 'react';

export default function WatchPlayer({ lang }: { lang: 'en' | 'ja' }) {
  const ja = lang === 'ja';
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const story = `https://github.com/Jsmitty78/Jsmitty78/blob/main/projects/bridge${ja ? '.ja' : ''}.md`;
  return <main className="watchPage">
    <header className="watchHeader">
      <a className="watchBrand" href={`/?lang=${lang}`}><span>P</span>PENCIL Bridge</a>
      <nav aria-label="Language"><a href="/watch?lang=en" aria-current={!ja ? 'page' : undefined}>English</a><span> | </span><a href="/watch?lang=ja" aria-current={ja ? 'page' : undefined}>日本語</a></nav>
    </header>
    <section className="watchIntro">
      <p>{ja ? '株式会社ペンシル × 九州大学QREC' : 'PENCIL × Kyushu University QREC'}</p>
      <h1>{ja ? '10日間でつくったものを、実際の人事担当者へ。' : 'Ten days of building. A real HR conversation.'}</h1>
      <p>{ja ? '人事スーパーバイザーのHitomiさんに試していただいた、当時の84秒のデモ。まず動画を見て、その後はご自身でプロトタイプを操作できます。' : 'The original 84-second demonstration featuring HR supervisor Hitomi-san. Watch the team’s work, then try the prototype yourself.'}</p>
    </section>
    <section className="cinema" aria-label={ja ? '製品デモ動画' : 'Product demonstration video'}>
      <video ref={video} controls playsInline preload="metadata" poster="/media/pitch-deck-cover.jpg" onPlay={() => setStarted(true)} onError={() => setFailed(true)} aria-label={ja ? 'PENCIL Bridge 当時の人事向けデモ' : 'PENCIL Bridge original HR demonstration'}>
        <source src="/media/pencil-bridge-hr-demo.mp4" type="video/mp4" />
        {ja ? '動画を下のリンクからダウンロードできます。' : 'Download the video using the link below.'}
      </video>
      {!started && !failed && <button className="playOverlay" onClick={() => { video.current?.play().catch(() => setFailed(true)); }}><span aria-hidden="true">▶</span>{ja ? '84秒のデモを再生' : 'Play the 84-second demo'}</button>}
    </section>
    {failed && <p role="status">{ja ? '再生できない場合は、動画をダウンロードしてご覧ください。' : 'If playback is unavailable, download the video to watch it.'} <a href="/media/pencil-bridge-hr-demo.mp4" download>{ja ? '動画をダウンロード' : 'Download video'}</a></p>}
    <div className="watchCaption"><p>{ja ? '当時の映像・音声・字幕をそのまま収録しています。ページの言語を切り替えても、動画自体は変わりません。' : 'Original footage, audio and on-screen subtitles. Switching this page’s language does not change the recording.'}</p><a href="/media/pencil-bridge-hr-demo.mp4" download>{ja ? 'MP4をダウンロード' : 'Download MP4'}</a></div>
    <section className="watchNext">
      <div><h2>{ja ? '次は、ご自身で試してみてください。' : 'Now try the workflow yourself.'}</h2><p>{ja ? 'サンプル案件を開き、記録を比較し、確認質問を準備。ログインやAPIキーは不要です。' : 'Open a sample case, compare the records and prepare a clarification. No login or API key required.'}</p></div>
      <a className="primaryAction" href={`/?lang=${lang}&start=review`}>{ja ? 'サンプル案件を確認' : 'Review a sample case'}</a>
    </section>
    <footer className="watchLinks"><a href={story}>{ja ? '全編ストーリーと15枚の写真' : 'Full story and 15 photos'}</a><a href="https://github.com/Jsmitty78/pencil-people-bridge/blob/main/docs/media/deliverables/pencil-bridge-kyushu-pitch-deck.pdf">{ja ? '全13スライドのピッチデック' : '13-slide pitch deck'}</a><a href="https://github.com/Jsmitty78/pencil-people-bridge/blob/main/docs/media/deliverables/pencil-bridge-hr-demo.mp4">{ja ? 'オリジナル動画の保存先' : 'Original video archive'}</a></footer>
  </main>;
}
