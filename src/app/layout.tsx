import type { Metadata } from "next";
import { Archivo, Noto_Sans_Bengali, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

// The output script. Everything converted is rendered in this.
const bangla = Noto_Sans_Bengali({
  variable: "--font-bangla-face",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
});

// Bijoy source text is ASCII bytes standing in for Bangla glyphs, so it is set
// as data rather than as language.
const mono = IBM_Plex_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Bijoy to Unicode — spreadsheet converter",
  description:
    "Convert Bijoy (SutonnyMJ) Bangla spreadsheets to Unicode. Reads .xlsx and legacy .xls, keeps your formatting, and runs entirely in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bangla.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
