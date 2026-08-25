import "./globals.css";

export const metadata = {
  title: "PENCIL Bridge V2 | HR Review Console",
  description: "Engineer-feedback build of the issue-level HR communication review prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
