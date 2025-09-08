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
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <Toaster position="top-right" />
        {!hideNav && <Navbar />}
        <div className={hideNav ? "min-h-screen" : "flex min-h-screen"}>
          {!hideNav && <Sidebar />}
          <main className={hideNav ? "flex-1" : "flex-1 pt-14 md:pt-16 md:ml-64"}>{children}</main>
        </div>
        {!hideNav && <BottomNavbar />}
      </body>
    </html>
  );
}
