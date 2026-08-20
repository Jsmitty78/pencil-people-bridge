import "./globals.css";

export const metadata = {
  title: "PENCIL People Bridge",
  description: "AI support for clearer HR issue organization and manager communication",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
