"use client";

import { LogOut, Menu, User, MapPin, Calendar, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiWithRefresh } from "@/lib/api/authHelper";
import { getStatistikTransaksi } from "@/lib/api/transaksiHelper";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string; role?: string; access_token?: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [penjualanHariIni, setPenjualanHariIni] = useState(0);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Set mounted state setelah component di-mount di client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update waktu setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format tanggal dan hari dalam bahasa Indonesia
  const formatDateTime = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    return {
      dayDate: `${day}, ${dateNum} ${month} ${year}`,
      time: time
    };
  };

  // Fetch penjualan hari ini
  const fetchPenjualanHariIni = useCallback(async (token: string) => {
    try {
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const data = await apiWithRefresh(
        (t) => getStatistikTransaksi(t, { tanggal: todayString }),
        token,
        (newToken) => {
          // Update token jika diperlukan
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userData = JSON.parse(userStr);
            userData.access_token = newToken;
            localStorage.setItem("user", JSON.stringify(userData));
            setProfile(userData);
          }
        },
        () => {
          // Jika token tidak valid, redirect ke login
        },
        router
      );
      
      setPenjualanHariIni(data?.penjualan_hari_ini || 0);
    } catch (error) {
      console.error('Error fetching penjualan hari ini:', error);
      setPenjualanHariIni(0);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setProfile(userData);
          
          // Fetch penjualan hari ini setelah profile dimuat
          if (userData.access_token) {
            fetchPenjualanHariIni(userData.access_token);
          }
        } catch {
          setProfile(null);
        }
      }
    }
  }, [fetchPenjualanHariIni]);

  // Update penjualan setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile?.access_token) {
        fetchPenjualanHariIni(profile.access_token);
      }
    }, 30000); // Update setiap 30 detik

    return () => clearInterval(interval);
  }, [profile?.access_token, fetchPenjualanHariIni]);

  const dateTime = formatDateTime(currentTime);

  return (
    <header
      className="h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 backdrop-blur-xl border-b border-white/20 flex flex-col justify-center px-3 md:px-6 shadow-lg"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
      }}
    >
      {/* Baris Pertama: Logo Besar & Profile */}
      <div className="flex items-center justify-between">
        {/* Kiri: Logo Besar */}
        <div className="flex items-center gap-3">
          <button className="sm:hidden p-2 rounded-lg hover:bg-white/20 transition-all" onClick={() => setOpen(!open)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              ChiCha Mobile
            </h1>
          </div>
        </div>

        {/* Kanan: Profile & Stats */}
        <div className="flex items-center gap-4">
          {/* Live Stats */}
          <div className="hidden md:flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl px-4 py-2">
            <div className="flex items-center gap-2 text-white/90">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-sm font-medium">Rp {penjualanHariIni.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/30"></div>
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="w-4 h-4 text-blue-300" />
              <div className="flex flex-col text-xs leading-tight">
                <span className="font-medium">{mounted ? dateTime.dayDate : '--'}</span>
                <span className="text-white/70">{mounted ? dateTime.time : '--:--:--'}</span>
              </div>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 shadow-lg font-semibold text-white transition-all border border-white/20"
              title={profile?.name || "Profile"}
            >
              <User className="w-5 h-5" />
              <span className="truncate max-w-[120px] hidden sm:block">{profile?.name || "Profile"}</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 shadow-2xl rounded-xl py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Akun: <span className="font-semibold text-gray-700 dark:text-white">{profile?.email || '-'}</span>
                </div>
                <button
                  className="w-full px-4 py-2 text-left text-base flex items-center gap-2 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 font-semibold transition-colors"
                  onClick={() => {
                    localStorage.removeItem("user");
                    toast.success("Berhasil logout. Silakan login kembali.");
                    router.replace("/login");
                  }}
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baris Kedua: Animasi Text Berjalan */}
      <div className="mt-1 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          <div className="flex items-center gap-6 text-white/90 text-sm font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-yellow-300 flex-shrink-0" />
              <span>📍 Jl. Abdul Muis No 19, Pasar Baru, Padang Panjang</span>
            </div>
            <div className="w-px h-4 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-300 flex-shrink-0" />
              <span>🗓️ {mounted ? `${dateTime.dayDate} • ${dateTime.time}` : 'Loading...'}</span>
            </div>
            <div className="w-px h-4 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-300 flex-shrink-0" />
              <span>� Penjualan Hari Ini: Rp {penjualanHariIni.toLocaleString()}</span>
            </div>
            {/* Duplikat untuk continuous scroll */}
            <div className="ml-12 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                <span>📍 Jl. Abdul Muis No 19, Pasar Baru, Padang Panjang</span>
              </div>
              <div className="w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-300 flex-shrink-0" />
                <span>🗓️ {mounted ? `${dateTime.dayDate} • ${dateTime.time}` : 'Loading...'}</span>
              </div>
              <div className="w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-300 flex-shrink-0" />
                <span>� Penjualan Hari Ini: Rp {penjualanHariIni.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS untuk animasi marquee */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </header>
  );
}
