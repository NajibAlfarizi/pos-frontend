/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";
import BottomNavbar from "@/components/BottomNavbar";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";

  // Register service worker (client side)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="icon" href="/logo-chicha.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white relative`}>
        <Toaster position="top-right" />
        {!hideNav && <Navbar />}
        <div className={hideNav ? "min-h-screen" : "flex min-h-screen"}>
          {!hideNav && <Sidebar />}
          <main className={hideNav ? "flex-1" : "flex-1 pt-14 md:pt-16 md:ml-64"} style={{ position: 'relative', zIndex: 1 }}>
            {/* Background image removed */}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
          </main>
        </div>
        {!hideNav && <BottomNavbar />}
      </body>
    </html>
  );
}
