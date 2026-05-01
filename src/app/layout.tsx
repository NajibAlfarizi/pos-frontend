import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error - CSS module import
import "./globals.css";
import { Toaster } from "sonner";
import { GlobalLoadingProvider } from "./GlobalLoadingContext";
import RootLayoutClient from "./RootLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POS iBii",
  description: "Point of Sale System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/logo-ibii.png" type="image/png" />
        <link rel="shortcut icon" href="/logo-ibii.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-ibii.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white relative`}>
        <GlobalLoadingProvider>
          <Toaster position="top-right" />
          <RootLayoutClient>{children}</RootLayoutClient>
        </GlobalLoadingProvider>
      </body> 
    </html>
  );
}
