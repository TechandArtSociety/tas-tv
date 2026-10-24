import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAS TV — Allumez. Et laissez tourner.",
  description: "Une programmation choisie par TAS, partagée à la même minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
