import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "InsightPulse",
  description: "Insight Cards analytics copilot",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
