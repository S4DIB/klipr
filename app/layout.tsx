import type { Metadata, Viewport } from "next";
import {
  Stack_Sans_Headline,
  Stack_Sans_Text,
  Martian_Mono,
  Google_Sans_Flex,
} from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

/* Display — Stack Sans Headline: the official Klipr branding font
 * (brand guideline p17, "Stack Sans — Headline · Notch · Text"; OFL-licensed). */
const display = Stack_Sans_Headline({
  variable: "--font-stack-headline",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/* Logotype — Google Sans Flex: the font the logo/wordmark is set in
 * (brand guideline p16, "Typography / Logotype"). Used ONLY for the klipr
 * wordmark, not body/headlines. */
const logotype = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

/* Body — Stack Sans Text: the text-optimized cut of the same family. */
const sans = Stack_Sans_Text({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* Load-bearing data voice — exact spec match (DESIGN.md §4) */
const mono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const SITE = "https://joinklipr.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Klipr · Post clips. Get paid per view.",
    template: "%s · Klipr",
  },
  description:
    "Klipr is a content-rewards marketplace. Brands fund campaigns; creators post clips and earn for every verified view. No follower minimums, pay only for results.",
  keywords: [
    "content rewards",
    "clipping",
    "clippers",
    "pay per view",
    "performance marketing",
    "creator economy",
    "verified views",
  ],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Klipr",
    title: "Klipr · Post clips. Get paid per view.",
    description:
      "Brands fund campaigns. Creators post clips and earn for every verified view. Pay only for results.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klipr · Post clips. Get paid per view.",
    description:
      "Get paid to post. Earn for every verified view. No follower minimums.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#35055a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${logotype.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
