import type { Metadata, Viewport } from "next";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { NativeBridge } from "@/components/native/NativeBridge";
import { OneSignalInit } from "@/components/native/OneSignalInit";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Iloilo Real Estate — Real Estate Made Easy in Iloilo",
  description:
    "Real estate made easy in Iloilo — homes, land, rentals and commercial property across Iloilo City and its neighbouring towns. Every listing checked before it goes live.",
};

export const viewport: Viewport = {
  themeColor: "#F4F0E6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // prevent zoom jank inside the native WebView
  viewportFit: "cover", // extend under notches; components use env(safe-area-inset-*)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrumentSerif.variable}`}>
      <body className="font-sans antialiased">
        <NativeBridge />
        <OneSignalInit />
        {children}
      </body>
    </html>
  );
}
