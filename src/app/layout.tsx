import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "fireable.ai — Find out when AI is coming for your job",
  description:
    "Upload your LinkedIn or CV. Get your termination probability score.",
  openGraph: {
    title: "fireable.ai — Find out when AI is coming for your job",
    description:
      "Upload your LinkedIn or CV. Get your termination probability score.",
    siteName: "fireable.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "fireable.ai — Find out when AI is coming for your job",
    description:
      "Upload your LinkedIn or CV. Get your termination probability score.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
