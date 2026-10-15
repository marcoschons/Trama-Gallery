import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trama — Arte encontra conexão",
  description: "Descubra artistas, explore estilos e encontre quem vai dar vida à sua próxima ideia. Uma galeria para criar conexões.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
