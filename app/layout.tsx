import "./globals.css";

export const metadata = {
  title: "PENCIL Bridge | Bilingual HR workspace",
  description: "Explore the bilingual PENCIL Bridge prototype: compare source records, prepare clarification questions, and watch the original HR demonstration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
