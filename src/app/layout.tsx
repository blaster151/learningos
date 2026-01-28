import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearningOS - AI-Powered Learning Platform",
  description: "Master any topic through intelligent conversation and visual knowledge mapping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
