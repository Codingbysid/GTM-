import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GTM Lead Enrichment & ICP Scoring Engine",
  description:
    "Autonomous B2B Go-To-Market pipeline powered by Apollo.io and Google Gemini with Clay-style RevOps dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090B] text-zinc-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
