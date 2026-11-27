import WatchPlayer from './player';

export const metadata = {
  title: 'PENCIL Bridge | Watch the original HR demo',
  description: 'Watch the 84-second PENCIL Bridge demonstration, then explore the bilingual prototype built in ten days.',
};

export default async function WatchPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return <WatchPlayer lang={lang === 'ja' ? 'ja' : 'en'} />;
}
