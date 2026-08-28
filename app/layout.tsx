import "./globals.css";

export const metadata = {
  title: "PENCIL Bridge V2 | HR Review Console",
  description: "A privacy-safe concept demo for issue-level HR communication review using fictional data.",
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
