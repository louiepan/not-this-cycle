import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Not This Cycle — A PM Simulator",
  description: "Navigate Q4 planning as a Product Manager at a big tech company. Satire that stings.",
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
