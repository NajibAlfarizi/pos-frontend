/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRingkasanTransaksi } from "@/lib/api/transaksiHelper";
import { getStatistikTransaksi } from "@/lib/api/transaksiHelper";
import { CreditCard, ShoppingCart, ArrowDownCircle, ArrowUpCircle, DollarSign } from "lucide-react";

const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [statistik, setStatistik] = useState<any>(null);
  const router = useRouter();
  const [clientDate, setClientDate] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  useEffect(() => {
  const today = new Date();
  setClientDate(today.toLocaleDateString());
  setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
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
    if (!token || !selectedDate) return;
    const fetchStatistik = async () => {
      try {
        const data = await apiWithRefresh(
          (t) => getStatistikTransaksi(t, { tanggal: selectedDate }),
          token,
          setToken,
          () => {},
          router
        );
        setStatistik(data);
      } catch {
        setStatistik(null);
      }
    };
    fetchStatistik();
  }, [token, router, selectedDate]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Dashboard POS Sparepart</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="statistik-date" className="font-semibold text-gray-700">Tanggal:</label>
          <input
            id="statistik-date"
            type="date"
            className="border rounded-lg px-3 py-2 text-base shadow focus:outline-blue-500"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="stat-card bg-green-50">
          <div className="stat-icon bg-green-200">
            <DollarSign className="text-green-600 w-10 h-10" />
          </div>
          <div className="stat-label">Penjualan Hari Ini</div>
          <div className="stat-value text-green-700">Rp{statistik?.penjualan_hari_ini?.toLocaleString() ?? '-'}</div>
        </div>
        <div className="stat-card bg-yellow-50">
          <div className="stat-icon bg-yellow-200">
            <CreditCard className="text-yellow-600 w-10 h-10" />
          </div>
          <div className="stat-label">Total Kredit</div>
          <div className="stat-value text-yellow-700">Rp{statistik?.total_kredit?.toLocaleString() ?? '-'}</div>
        </div>
      </div>

      {/* Detail Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="stat-card bg-blue-50">
          <div className="stat-icon bg-blue-200">
            <ArrowDownCircle className="text-blue-600 w-10 h-10" />
          </div>
          <div className="stat-label">Jumlah Barang Masuk</div>
          <div className="stat-value text-blue-700">{statistik?.jumlah_barang_masuk ?? '-'}</div>
        </div>
        <div className="stat-card bg-red-50">
          <div className="stat-icon bg-red-200">
            <ArrowUpCircle className="text-red-600 w-10 h-10" />
          </div>
          <div className="stat-label">Jumlah Barang Keluar</div>
          <div className="stat-value text-red-700">{statistik?.jumlah_barang_keluar ?? '-'}</div>
        </div>
        <div className="stat-card bg-yellow-50">
          <div className="stat-icon bg-yellow-200">
            <CreditCard className="text-yellow-600 w-10 h-10" />
          </div>
          <div className="stat-label">Jumlah Barang Kredit</div>
          <div className="stat-value text-yellow-700">{statistik?.jumlah_barang_kredit ?? '-'}</div>
        </div>
      </div>

      {/* Insight Section */}
      <div className="bg-white rounded-xl shadow p-6 text-center mb-6">
        <div className="text-gray-600 text-base font-medium mb-2">Data di atas adalah statistik transaksi pada tanggal <span className="font-bold text-blue-700">{selectedDate.split('-').reverse().join('/')}</span>.</div>
        <div className="text-sm text-gray-500">Tips: Gunakan filter tanggal untuk melihat performa penjualan dan stok barang pada hari tertentu.</div>
      </div>

      {/* Trend/Insight (dummy, can be replaced with chart) */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow p-6 text-center">
        <div className="text-lg font-bold text-blue-700 mb-2">Insight Otomatis</div>
        <div className="text-base text-gray-700">{statistik?.penjualan_hari_ini > 0
          ? `Penjualan hari ini cukup baik, total transaksi keluar Rp${statistik?.penjualan_hari_ini?.toLocaleString()}.`
          : 'Belum ada penjualan pada tanggal ini.'}
        </div>
      </div>

      <style jsx>{`
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 24px 0 rgba(0,0,0,0.07);
          transition: box-shadow 0.2s, transform 0.2s;
          background: var(--tw-bg-opacity);
        }
        .stat-card:hover {
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.12);
          transform: translateY(-2px) scale(1.03);
        }
        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          border-radius: 1rem;
          margin-bottom: 1rem;
        }
        .stat-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
