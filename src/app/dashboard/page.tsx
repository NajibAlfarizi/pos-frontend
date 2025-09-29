/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState, useRef, useContext } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRingkasanTransaksi } from "@/lib/api/transaksiHelper";
import { getStatistikTransaksi, getTransaksi } from "@/lib/api/transaksiHelper";
import { getAllSparepart } from "@/lib/api/sparepartHelper";
import { CreditCard, ShoppingCart, ArrowDownCircle, ArrowUpCircle, DollarSign, Package, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { useGlobalLoading } from "../GlobalLoadingContext";

// Komponen Animasi Angka
const AnimatedNumber: React.FC<{ value: number; duration?: number; prefix?: string }> = ({ 
  value, 
  duration = 2000, 
  prefix = "" 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const animationRef = useRef<number | null>(null);
  const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (value === displayValue) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function untuk animasi yang lebih smooth
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + (difference * easeOutCubic));
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  // Setup periodic rolling animation every 5 seconds
  useEffect(() => {
    rollIntervalRef.current = setInterval(() => {
      setIsRolling(true);
      setTimeout(() => {
        setIsRolling(false);
      }, 800); // Rolling animation duration
    }, 5000); // Every 5 seconds

    return () => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  return (
    <span className={`relative transition-all duration-500 text-red-600 ${
      (isAnimating || isRolling) 
        ? 'drop-shadow-sm scale-105' 
        : ''
    }`}>
      <span className={`inline-block transition-transform duration-300 ${
        isRolling ? 'animate-bounce' : ''
      }`}>
        {prefix}{displayValue.toLocaleString()}
      </span>
      {(isAnimating || isRolling) && (
        <span className="absolute inset-0 animate-ping text-red-400 opacity-30">
          {prefix}{displayValue.toLocaleString()}
        </span>
      )}
    </span>
  );
};

// Komponen Digit Berputar
const DigitRoll: React.FC<{ digit: string; isAnimating: boolean }> = ({ digit, isAnimating }) => {
  return (
    <div className="relative inline-block overflow-hidden h-8 w-4 align-bottom">
      <div className={`absolute transition-transform duration-500 ease-out ${
        isAnimating ? 'transform -translate-y-1 opacity-80' : 'transform translate-y-0'
      }`}>
        <div className="h-8 flex items-center justify-center font-bold text-2xl">
          {digit}
        </div>
      </div>
    </div>
  );
};

// Komponen Animasi Number dengan Roll Effect
const RollingNumber: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
        prevValue.current = value;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [value]);

  const formattedNumber = displayValue.toLocaleString();
  
  return (
    <div className="inline-flex items-baseline">
      <span className="text-2xl font-bold text-gray-800 mr-1">{prefix}</span>
      <div className="inline-flex">
        {formattedNumber.split('').map((char, index) => (
          <DigitRoll key={`${char}-${index}`} digit={char} isAnimating={isAnimating} />
        ))}
      </div>
    </div>
  );
};

// Komponen Skeleton Loading untuk Card
const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-gray-200 p-3 rounded-xl w-12 h-12"></div>
    </div>
    <div className="bg-gray-200 h-4 w-24 mb-2 rounded"></div>
    <div className="bg-gray-300 h-8 w-32 rounded"></div>
  </div>
);

const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);
  const [statistik, setStatistik] = useState<any>(null);
  const [sparepartData, setSparepartData] = useState<any[]>([]);
  const [totalSparepart, setTotalSparepart] = useState<number>(0);
  const [transaksiTerbaru, setTransaksiTerbaru] = useState<any[]>([]);
  const [sparepartList, setSparepartList] = useState<any[]>([]); // Untuk lookup nama barang
  const [showTransaksiHariIni, setShowTransaksiHariIni] = useState(false);
  const [transaksiHariIni, setTransaksiHariIni] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSparepart, setIsLoadingSparepart] = useState(true);
  const loadingContext = useGlobalLoading();
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
      setIsLoadingStats(true);
      try {
        // Tambahkan delay kecil untuk melihat animasi loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchStatistik();
  }, [token, router, selectedDate]);

  // Fetch data sparepart untuk total produk dan stok rendah
  useEffect(() => {
    if (!token) return;
    
    const fetchSparepart = async () => {
      setIsLoadingSparepart(true);
      try {
        // Tambahkan delay kecil untuk melihat animasi loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
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
      } finally {
        setIsLoadingSparepart(false);
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

  // Fetch transaksi hari ini untuk modal
  const fetchTransaksiHariIni = async () => {
    if (!token || !selectedDate) return;
    
    loadingContext?.setLoading?.(true);
    try {
      // Format tanggal untuk filter yang lebih spesifik
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const data = await apiWithRefresh(
        (t) => getTransaksi(t, { 
          tanggal_mulai: selectedDate,
          tanggal_akhir: selectedDate,
          limit: 100,
          sort_by: 'tanggal', 
          sort_order: 'desc' 
        }),
        token,
        setToken,
        () => {},
        router
      );
      
      let transaksiData = [];
      if (Array.isArray(data)) {
        transaksiData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        transaksiData = data.data;
      }
      
      // Filter tambahan untuk memastikan hanya transaksi hari yang dipilih
      const filteredTransaksi = transaksiData.filter((transaksi: any) => {
        const transaksiDate = new Date(transaksi.tanggal);
        const transaksiDateString = transaksiDate.toISOString().split('T')[0];
        return transaksiDateString === selectedDate;
      });
      
      setTransaksiHariIni(filteredTransaksi);
    } catch (error) {
      console.error('Error fetching transaksi hari ini:', error);
      setTransaksiHariIni([]);
      toast.error('Gagal memuat data transaksi hari ini');
    } finally {
      loadingContext?.setLoading?.(false);
    }
  };

  const handleShowTransaksiHariIni = () => {
    setShowTransaksiHariIni(true);
    fetchTransaksiHariIni();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Dashboard POS</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Kelola inventori dan penjualan spare part</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:text-right">
            <p className="text-lg sm:text-2xl font-bold text-gray-800">{new Date().toLocaleDateString('id-ID', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}</p>
            <input
              type="date"
              className="ml-3 sm:ml-0 sm:mt-1 border rounded-lg px-2 py-1 text-xs sm:text-sm touch-manipulation"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Statistik Kartu Utama - Mobile First */}
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Penjualan Hari Ini */}
              {isLoadingStats ? (
                <SkeletonCard />
              ) : (
                <div 
                  onClick={handleShowTransaksiHariIni}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300 cursor-pointer group touch-manipulation"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="bg-green-100 p-2 sm:p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Penjualan Hari Ini</h3>
                  <div className="text-lg sm:text-2xl font-bold text-gray-800">
                    <AnimatedNumber 
                      value={statistik?.penjualan_hari_ini || 0} 
                      prefix="Rp " 
                      duration={1500}
                    />
                  </div>
                </div>
              )}

              {/* Total Kredit */}
              {isLoadingStats ? (
                <SkeletonCard />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="bg-orange-100 p-2 sm:p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Kredit</h3>
                  <div className="text-lg sm:text-2xl font-bold text-gray-800">
                    <AnimatedNumber 
                      value={statistik?.total_kredit || 0} 
                      prefix="Rp " 
                      duration={1800}
                    />
                  </div>
                </div>
              )}

              {/* Total Produk */}
              {isLoadingSparepart ? (
                <SkeletonCard />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-300 group sm:col-span-2 md:col-span-1">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="bg-purple-100 p-2 sm:p-3 rounded-xl group-hover:bg-purple-200 transition-colors">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <span className="text-purple-600 text-xs sm:text-sm font-medium group-hover:text-purple-700">Items</span>
                  </div>
                  <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Produk</h3>
                  <div className="text-lg sm:text-2xl font-bold text-gray-800">
                    <AnimatedNumber 
                      value={totalSparepart} 
                      duration={1200}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tabel Transaksi Terbaru - Mobile Optimized */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-semibold text-sm sm:text-base">Transaksi Terbaru</h3>
                <button 
                  onClick={() => router.push('/transaksi')}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium touch-manipulation"
                >
                  Lihat Semua
                </button>
              </div>
              {/* Mobile Card Layout for small screens */}
              <div className="block sm:hidden space-y-3">
                {transaksiTerbaru.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Tidak ada transaksi terbaru</p>
                  </div>
                ) : (
                  transaksiTerbaru.map((transaksi, index) => (
                    <div key={transaksi.id_transaksi || index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {(() => {
                              if (transaksi.detail_barang && transaksi.detail_barang.length > 0) {
                                const firstItem = transaksi.detail_barang[0];
                                const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                                const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item ${firstItem.id_sparepart || ''}`.trim();
                                return namaBarang + (transaksi.detail_barang.length > 1 ? ` +${transaksi.detail_barang.length - 1}` : '');
                              }
                              else if (transaksi.items && transaksi.items.length > 0) {
                                const firstItem = transaksi.items[0];
                                const namaBarang = firstItem.nama_barang || firstItem.sparepart?.nama_barang || 'Barang tidak diketahui';
                                return namaBarang + (transaksi.items.length > 1 ? ` +${transaksi.items.length - 1}` : '');
                              }
                              return 'Tidak ada item';
                            })()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              transaksi.tipe === 'masuk' 
                                ? 'bg-blue-100 text-blue-800'
                                : transaksi.tipe === 'keluar'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {transaksi.tipe === 'masuk' ? 'Masuk' : transaksi.tipe === 'keluar' ? 'Keluar' : 'Kredit'}
                            </span>
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              transaksi.tipe_pembayaran === 'kredit'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaksi.tipe_pembayaran === 'kredit' ? 'Kredit' : 'Lunas'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold text-gray-900">
                            Rp {(transaksi.harga_total || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaksi.tanggal).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Desktop Table Layout for larger screens */}
              <div className="hidden sm:block overflow-x-auto">
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

          {/* Sidebar Kanan - Mobile Optimized */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6">
            {/* Ringkasan Inventori */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="text-gray-700 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Ringkasan Inventori</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 text-xs sm:text-sm">Barang Masuk</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm sm:text-base">{statistik?.jumlah_barang_masuk || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600 text-xs sm:text-sm">Barang Keluar</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm sm:text-base">{statistik?.jumlah_barang_keluar || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600 text-xs sm:text-sm">Barang Kredit</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm sm:text-base">{statistik?.jumlah_barang_kredit || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Transaksi Hari Ini - Mobile Optimized */}
        {showTransaksiHariIni && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Transaksi Hari Ini</h2>
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      {new Date(selectedDate).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTransaksiHariIni(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[60vh] sm:max-h-[60vh]">
                  {transaksiHariIni.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="bg-gray-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-base sm:text-lg font-medium">Tidak ada transaksi hari ini</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">Belum ada penjualan pada tanggal yang dipilih</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card Layout */}
                      <div className="block sm:hidden space-y-3">
                        {transaksiHariIni.map((transaksi, index) => (
                          <div key={transaksi.id_transaksi || index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    {new Date(transaksi.tanggal).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                    transaksi.tipe === 'masuk' 
                                      ? 'bg-blue-100 text-blue-800'
                                      : transaksi.tipe === 'keluar'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {transaksi.tipe === 'masuk' ? 'Masuk' : transaksi.tipe === 'keluar' ? 'Keluar' : 'Kredit'}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {(() => {
                                    if (transaksi.detail_barang && transaksi.detail_barang.length > 0) {
                                      const firstItem = transaksi.detail_barang[0];
                                      const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                                      const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item ${firstItem.id_sparepart || ''}`.trim();
                                      return namaBarang + (transaksi.detail_barang.length > 1 ? ` +${transaksi.detail_barang.length - 1}` : '');
                                    }
                                    else if (transaksi.items && transaksi.items.length > 0) {
                                      const firstItem = transaksi.items[0];
                                      const namaBarang = firstItem.nama_barang || firstItem.sparepart?.nama_barang || 'Barang tidak diketahui';
                                      return namaBarang + (transaksi.items.length > 1 ? ` +${transaksi.items.length - 1}` : '');
                                    }
                                    return 'Tidak ada item';
                                  })()}
                                </p>
                              </div>
                              <div className="text-right ml-2">
                                <p className="text-sm font-bold text-gray-900">
                                  Rp {(transaksi.harga_total || 0).toLocaleString()}
                                </p>
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${
                                  transaksi.tipe_pembayaran === 'kredit'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {transaksi.tipe_pembayaran === 'kredit' ? 'Kredit' : 'Lunas'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 text-sm font-medium text-gray-600">Waktu</th>
                              <th className="text-left py-3 text-sm font-medium text-gray-600">Item</th>
                              <th className="text-left py-3 text-sm font-medium text-gray-600">Tipe</th>
                              <th className="text-right py-3 text-sm font-medium text-gray-600">Total</th>
                              <th className="text-center py-3 text-sm font-medium text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transaksiHariIni.map((transaksi, index) => (
                              <tr key={transaksi.id_transaksi || index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm text-gray-600">
                                  {new Date(transaksi.tanggal).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-3 text-sm text-gray-900 max-w-xs truncate">
                                  {(() => {
                                    if (transaksi.detail_barang && transaksi.detail_barang.length > 0) {
                                      const firstItem = transaksi.detail_barang[0];
                                      const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                                      const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item ${firstItem.id_sparepart || ''}`.trim();
                                      return namaBarang + (transaksi.detail_barang.length > 1 ? ` +${transaksi.detail_barang.length - 1}` : '');
                                    }
                                    else if (transaksi.items && transaksi.items.length > 0) {
                                      const firstItem = transaksi.items[0];
                                      const namaBarang = firstItem.nama_barang || firstItem.sparepart?.nama_barang || 'Barang tidak diketahui';
                                      return namaBarang + (transaksi.items.length > 1 ? ` +${transaksi.items.length - 1}` : '');
                                    }
                                    return 'Tidak ada item';
                                  })()}
                                </td>
                                <td className="py-3">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    transaksi.tipe === 'masuk' 
                                      ? 'bg-blue-100 text-blue-800'
                                      : transaksi.tipe === 'keluar'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {transaksi.tipe === 'masuk' ? 'Masuk' : transaksi.tipe === 'keluar' ? 'Keluar' : 'Kredit'}
                                  </span>
                                </td>
                                <td className="py-3 text-sm font-medium text-gray-900 text-right">
                                  Rp {(transaksi.harga_total || 0).toLocaleString()}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    transaksi.tipe_pembayaran === 'kredit'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {transaksi.tipe_pembayaran === 'kredit' ? 'Kredit' : 'Lunas'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-4 sm:mt-6">
                  <button
                    onClick={() => setShowTransaksiHariIni(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 sm:px-6 rounded-lg font-medium transition-colors touch-manipulation min-h-[44px]"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
