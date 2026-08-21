import "./globals.css";

export const metadata = {
  title: "PENCIL People Bridge",
  description: "Local AI prototype for clearer HR issue organization",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
