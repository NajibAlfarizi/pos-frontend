"use client";

import { LogOut, Menu, User } from "lucide-react";
import { useState, useEffect } from "react";
import { getProfile } from "@/lib/api/authHelper";


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          setProfile(JSON.parse(userStr));
        } catch {
          setProfile(null);
        }
      }
    }
  }, []);

  return (
  <header
    className="h-14 md:h-16 bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20 flex items-center justify-between px-3 md:px-6"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 50,
    }}
  >
      {/* Kiri: Logo / Judul */}
      <div className="flex items-center gap-2">
        <button className="sm:hidden p-2 rounded-lg hover:bg-white/40 dark:hover:bg-black/40 transition-all" onClick={() => setOpen(!open)}>
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-700 hidden sm:block tracking-tight drop-shadow-sm">
          ChiCha Mobile
        </h1>
        <span className="sm:hidden text-base font-bold text-gray-700">ChiCha</span>
      </div>

      {/* Kanan: Action */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg font-semibold text-black transition-all"
            title={profile?.name || "Profile"}
          >
            <User className="w-5 h-5" />
            <span className="truncate max-w-[120px]">{profile?.name || "Profile"}</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 shadow-lg rounded-xl py-2 ">
              <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 rounded-lg bg-white">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
