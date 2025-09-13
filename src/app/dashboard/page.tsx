/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRingkasanTransaksi } from "@/lib/api/transaksiHelper";
import { CreditCard, ShoppingCart, ArrowDownCircle, ArrowUpCircle, DollarSign } from "lucide-react";

const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const router = useRouter();
  const [clientDate, setClientDate] = useState<string>("");
  useEffect(() => {
    setClientDate(new Date().toLocaleDateString());
  }, []);
  // Import helper

  useEffect(() => {
    try {
      const user = getProfile();
      setProfile(user);
      setToken(user.access_token);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const fetchSummary = async () => {
      try {
        // Get ringkasan transaksi per hari
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const tanggal = `${yyyy}-${mm}-${dd}`;
        const data = await apiWithRefresh(
          (t) => getRingkasanTransaksi(t, { tanggal }),
          token,
          setToken,
          () => {},
          router
        );
        setSummary(data);
      } catch {
        setSummary(null);
      }
    };
    fetchSummary();
  }, [token, router]);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard POS Sparepart</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Penjualan Hari Ini (Rupiah) */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <DollarSign className="text-green-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Penjualan Hari Ini</div>
          <div className="text-2xl font-bold text-green-700">Rp{summary?.penjualan_hari_ini?.toLocaleString() ?? '-'}</div>
        </div>
        {/* Total Transaksi (Rupiah) */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <ShoppingCart className="text-blue-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Total Transaksi</div>
          <div className="text-2xl font-bold text-blue-700">Rp{summary?.total_transaksi_rupiah?.toLocaleString() ?? '-'}</div>
        </div>
        {/* Total Kredit (Rupiah) */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <CreditCard className="text-yellow-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Total Kredit</div>
          <div className="text-2xl font-bold text-yellow-700">Rp{summary?.total_kredit?.toLocaleString() ?? '-'}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Jumlah Barang Masuk */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <ArrowDownCircle className="text-blue-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Jumlah Barang Masuk</div>
          <div className="text-2xl font-bold text-blue-700">{summary?.jumlah_masuk ?? '-'}</div>
        </div>
        {/* Jumlah Barang Keluar */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <ArrowUpCircle className="text-red-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Jumlah Barang Keluar</div>
          <div className="text-2xl font-bold text-red-700">{summary?.jumlah_keluar ?? '-'}</div>
        </div>
        {/* Jumlah Barang Kredit */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 items-center">
          <CreditCard className="text-yellow-600 w-10 h-10 mb-2" />
          <div className="text-lg font-semibold text-gray-700 mb-1">Jumlah Barang Kredit</div>
          <div className="text-2xl font-bold text-yellow-700">{summary?.jumlah_kredit ?? '-'}</div>
        </div>
      </div>
      <div className="bg-white rounded shadow p-6">
  <div className="text-gray-600 text-sm">Data di atas adalah ringkasan transaksi hari ini ({clientDate}).</div>
      </div>
    </div>
  );
};

export default DashboardPage;
