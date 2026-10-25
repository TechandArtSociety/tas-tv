import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TAS TV · Turn it on. Don't choose.",
  description: "A 24/7 channel of independent creators, programmed by humans with Kayo, watched by everyone at the same minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
