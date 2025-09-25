/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRingkasanTransaksi } from "@/lib/api/transaksiHelper";
import { getStatistikTransaksi, getTransaksi } from "@/lib/api/transaksiHelper";
import { getAllSparepart } from "@/lib/api/sparepartHelper";
import { CreditCard, ShoppingCart, ArrowDownCircle, ArrowUpCircle, DollarSign, Package, TrendingUp, AlertTriangle, Calendar } from "lucide-react";

const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [statistik, setStatistik] = useState<any>(null);
  const [sparepartData, setSparepartData] = useState<any[]>([]);
  const [totalSparepart, setTotalSparepart] = useState<number>(0);
  const [transaksiTerbaru, setTransaksiTerbaru] = useState<any[]>([]);
  const [sparepartList, setSparepartList] = useState<any[]>([]); // Untuk lookup nama barang
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

  // Fetch data sparepart untuk total produk dan stok rendah
  useEffect(() => {
    if (!token) return;
    const fetchSparepart = async () => {
      try {
        const data = await apiWithRefresh(
          (t) => getAllSparepart(t),
          token,
          setToken,
          () => {},
          router
        );
        
        if (Array.isArray(data)) {
          setSparepartData(data);
          setTotalSparepart(data.length);
          setSparepartList(data); // Simpan untuk lookup nama barang
        }
      } catch (error) {
        console.error('Error fetching sparepart data:', error);
        setSparepartData([]);
        setTotalSparepart(0);
        setSparepartList([]);
      }
    };
    fetchSparepart();
  }, [token, router]);

  // Fetch transaksi terbaru
  useEffect(() => {
    if (!token) return;
    const fetchTransaksiTerbaru = async () => {
      try {
        const data = await apiWithRefresh(
          (t) => getTransaksi(t, { 
            limit: 5, 
            sort_by: 'tanggal', 
            sort_order: 'desc' 
          }),
          token,
          setToken,
          () => {},
          router
        );
        
        if (Array.isArray(data)) {
          // Ambil 5 transaksi terbaru (sudah diurutkan dari server)
          console.log('Transaksi data structure:', data[0]); // Debug log
          setTransaksiTerbaru(data.slice(0, 5));
        } else if (data?.data && Array.isArray(data.data)) {
          // Jika response dibungkus dalam objek dengan property data
          console.log('Transaksi data structure (wrapped):', data.data[0]); // Debug log
          setTransaksiTerbaru(data.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching transaksi terbaru:', error);
        setTransaksiTerbaru([]);
      }
    };
    fetchTransaksiTerbaru();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard POS Sparepart</h1>
            <p className="text-gray-600 mt-1">Kelola inventori dan penjualan spare part Anda</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">{new Date().toLocaleDateString('id-ID', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}</p>
            <input
              type="date"
              className="mt-1 border rounded-lg px-3 py-1 text-sm"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Statistik Kartu Utama */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Penjualan Hari Ini */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Penjualan Hari Ini</h3>
                <p className="text-2xl font-bold text-gray-800">
                  Rp {(statistik?.penjualan_hari_ini || 0).toLocaleString()}
                </p>
              </div>

              {/* Total Kredit */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Kredit</h3>
                <p className="text-2xl font-bold text-gray-800">
                  Rp {(statistik?.total_kredit || 0).toLocaleString()}
                </p>
              </div>

              {/* Total Produk */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-purple-600 text-sm font-medium">Items</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Produk</h3>
                <p className="text-2xl font-bold text-gray-800">{totalSparepart.toLocaleString()}</p>
              </div>
            </div>

            {/* Tabel Transaksi Terbaru */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-semibold">Transaksi Terbaru</h3>
                <button 
                  onClick={() => router.push('/transaksi')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Nama Barang</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tipe</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Total</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transaksiTerbaru.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          Tidak ada transaksi terbaru
                        </td>
                      </tr>
                    ) : (
                      transaksiTerbaru.map((transaksi, index) => (
                        <tr key={transaksi.id_transaksi || index} className="hover:bg-gray-50">
                          <td className="py-3 text-sm font-medium text-gray-900">
                            {(() => {
                              // Cek format baru dengan detail_barang
                              if (transaksi.detail_barang && transaksi.detail_barang.length > 0) {
                                const firstItem = transaksi.detail_barang[0];
                                // Cari nama barang dari sparepartList jika ada id_sparepart
                                const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                                const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item ${firstItem.id_sparepart || ''}`.trim();
                                return (
                                  <div>
                                    <span title={namaBarang} className="truncate max-w-[150px] inline-block">
                                      {namaBarang}
                                    </span>
                                    {transaksi.detail_barang.length > 1 && 
                                      <span className="text-xs text-gray-500 ml-1">+{transaksi.detail_barang.length - 1} lainnya</span>
                                    }
                                  </div>
                                );
                              }
                              // Fallback untuk format lama atau data kosong
                              else if (transaksi.items && transaksi.items.length > 0) {
                                const firstItem = transaksi.items[0];
                                const namaBarang = firstItem.nama_barang || firstItem.sparepart?.nama_barang || 'Barang tidak diketahui';
                                return (
                                  <div>
                                    <span title={namaBarang} className="truncate max-w-[150px] inline-block">
                                      {namaBarang}
                                    </span>
                                    {transaksi.items.length > 1 && 
                                      <span className="text-xs text-gray-500 ml-1">+{transaksi.items.length - 1} lainnya</span>
                                    }
                                  </div>
                                );
                              }
                              // Jika tidak ada item sama sekali
                              else {
                                return <span className="text-gray-400">Tidak ada item</span>;
                              }
                            })()}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaksi.tipe === 'masuk' 
                                ? 'bg-blue-100 text-blue-800'
                                : transaksi.tipe === 'keluar'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {transaksi.tipe === 'masuk' ? 'Masuk' : transaksi.tipe === 'keluar' ? 'Keluar' : 'Kredit'}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-900">
                            Rp {(transaksi.harga_total || 0).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaksi.tipe_pembayaran === 'kredit'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaksi.tipe_pembayaran === 'kredit' ? 'Kredit' : 'Lunas'}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {new Date(transaksi.tanggal).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Kanan */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ringkasan Inventori */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-gray-700 font-semibold mb-4">Ringkasan Inventori</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">Barang Masuk</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistik?.jumlah_barang_masuk || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">Barang Keluar</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistik?.jumlah_barang_keluar || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">Barang Kredit</span>
                  </div>
                  <span className="font-bold text-gray-800">{statistik?.jumlah_barang_kredit || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
