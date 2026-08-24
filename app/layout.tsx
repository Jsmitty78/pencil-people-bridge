import "./globals.css";

export const metadata = {
  title: "PENCIL Context Bridge",
  description: "Local AI pre-send context check for clearer shared understanding in workplace communication",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
