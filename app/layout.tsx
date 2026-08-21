import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeLanguageProvider } from "./context/ThemeLanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ELIF TRADING - Professional Trading Terminal & Calculator",
  description: "AI Assisted Smart Money Concepts Trading Terminal & Risk Calculator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <ThemeLanguageProvider>{children}</ThemeLanguageProvider>
      </body>
    </html>
  );
}
