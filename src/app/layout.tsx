import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/layout/footer";
import { SessionProviderWrapper } from "@/components/session-provider";
import { AuthProviderWrapper } from "@/components/auth-provider-wrapper";
import { BaseSignInBanner } from "@/components/auth/base-signin-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChainProof AI - Smart Contract Security Auditing",
  description: "AI-powered smart contract security auditing platform. Comprehensive vulnerability detection in under 2 minutes with cryptographic proofs on Base blockchain.",
  keywords: ["ChainProof AI", "smart contract audit", "security", "Solidity", "blockchain", "Base", "AI", "vulnerability detection"],
  authors: [{ name: "ChainProof AI Team" }],
  openGraph: {
    title: "ChainProof AI - Smart Contract Security Auditing",
    description: "AI-powered smart contract security auditing platform with comprehensive vulnerability detection",
    url: "https://chainproof.ai",
    siteName: "ChainProof AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChainProof AI - Smart Contract Security Auditing",
    description: "AI-powered smart contract security auditing platform with comprehensive vulnerability detection",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <SessionProviderWrapper>
          <AuthProviderWrapper>
            <BaseSignInBanner />
            <Navigation />
            {children}
            <Footer />
            <Toaster />
          </AuthProviderWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
