// Root layout: fonts, page background and metadata shared by every page.
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Rootline", template: "%s · Rootline" },
  description: "Where your food and drink came from, batch by batch.",
};

export const viewport: Viewport = {
  themeColor: "#F6F1E7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
