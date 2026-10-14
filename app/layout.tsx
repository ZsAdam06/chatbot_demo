import "./globals.css";

export const metadata = { title: "Tudásbázis-asszisztens – POC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
