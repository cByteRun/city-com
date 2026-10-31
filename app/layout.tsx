import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/app/styles/globals.css";
export const metadata: Metadata = {
  title: "CityCom — Городская аналитика",
  description:
    "Раннее выявление городских проблем и анализ обратной связи жителей Павлодара",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
