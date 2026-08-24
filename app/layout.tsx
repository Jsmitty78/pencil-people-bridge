import "./globals.css";

export const metadata = {
  title: "PENCIL Bridge — Shared Understanding Detection",
  description: "HR-only concept prototype for cross-channel operational-log detection",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
