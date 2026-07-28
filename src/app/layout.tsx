import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RepoPilot",
  description: "A reliable, event-driven GitHub automation bot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
