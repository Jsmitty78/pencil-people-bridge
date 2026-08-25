import "./globals.css";

export const metadata = {
  title: "PENCIL Bridge | HR Review Console",
  description: "Issue-level shared-understanding review prototype for PENCIL",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
