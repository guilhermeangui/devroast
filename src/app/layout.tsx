import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "devroast",
  description:
    "Paste your code and get roasted. Brutally honest code reviews powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} antialiased`}>
      <body className="bg-bg-page font-sans text-text-primary">
        <TRPCReactProvider>
          <nav className="flex h-14 items-center justify-between border-b border-border-primary px-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-accent-green">
                {">"}
              </span>
              <span className="font-mono text-lg font-medium text-text-primary">
                devroast
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/leaderboard"
                className="font-mono text-[13px] text-text-secondary transition-colors hover:text-text-primary"
              >
                leaderboard
              </Link>
            </div>
          </nav>
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
