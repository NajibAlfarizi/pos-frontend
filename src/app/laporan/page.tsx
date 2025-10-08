/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getDashboardStatistik, 
  getLaporanPenjualanHarian, 
  getLaporanPenjualanBulanan, 
  getLaporanTopProducts,
  getLaporanStatistik 
} from "@/lib/api/laporanHelper";
import { apiWithRefresh, getProfile } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Tooltip, 
  Legend, 
  LineElement,
  PointElement,
  Title
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard, 
  Banknote, 
  ShoppingCart,
  Package,
  Trophy,
  Filter,
  Download,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useGlobalLoading } from "@/app/GlobalLoadingContext";
import { Modal } from "@/components/ui/Modal";
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineElement, PointElement, Title);

// Component untuk Skeleton Loading
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-gray-200 p-3 rounded-xl w-12 h-12"></div>
    </div>
    <div className="bg-gray-200 h-4 w-24 mb-2 rounded"></div>
    <div className="bg-gray-300 h-8 w-32 rounded"></div>
  </div>
);

export default function LaporanPage() {
  // State for showing/hiding Kredit Belum Lunas list (move out of renderDashboardStats)
  const [showKreditBelumLunas, setShowKreditBelumLunas] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [penjualanHarian, setPenjualanHarian] = useState<any>(null);
  const [penjualanBulanan, setPenjualanBulanan] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any>(null);
  const [statistik, setStatistik] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [topProductsLimit, setTopProductsLimit] = useState(10);
  const loadingContext = useGlobalLoading();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = getProfile();
        setProfile(user);
        setToken(user.access_token);
        
        // Check if user role is owner
        if (user.role !== 'owner') {
          router.replace("/dashboard");
          return;
        }
        
        setIsCheckingAuth(false);
      } catch {
        router.replace("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  // Function untuk set loading state
  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  // Fetch Dashboard Statistics
  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setLoadingState('dashboard', true);
    try {
      const data = await apiWithRefresh(
        (tok) => getDashboardStatistik(tok),
        token,
        setToken,
        () => {},
        router
      );
      console.log('Dashboard Stats Response:', data);
      console.log('Dashboard Stats Data:', data?.data);
      if (data?.data?.bulanan) {
        console.log('Bulanan data:', data.data.bulanan);
        console.log('Kredit belum lunas list:', data.data.bulanan.kredit_belum_lunas_list);
      }
      setDashboardStats(data?.data || null);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setDashboardStats(null);
    } finally {
      setLoadingState('dashboard', false);
    }
  }, [token, router]);

  // Fetch Penjualan Harian
  const fetchPenjualanHarian = useCallback(async () => {
    if (!token) return;
    setLoadingState('harian', true);
    try {
      console.log('Fetching penjualan harian dengan parameter:', dateRange);
      const data = await apiWithRefresh(
        (tok) => getLaporanPenjualanHarian(tok, dateRange),
        token,
        setToken,
        () => {},
        router
      );
      console.log('Data penjualan harian diterima:', data);
      setPenjualanHarian(data || null);
    } catch (error) {
      console.error('Error fetching penjualan harian:', error);
      setPenjualanHarian(null);
    } finally {
      setLoadingState('harian', false);
    }
  }, [token, router, dateRange]);

  // Fetch Penjualan Bulanan
  const fetchPenjualanBulanan = useCallback(async () => {
    if (!token) return;
    setLoadingState('bulanan', true);
    try {
      const data = await apiWithRefresh(
        (tok) => getLaporanPenjualanBulanan(tok, { months: 12 }),
        token,
        setToken,
        () => {},
        router
      );
      setPenjualanBulanan(data || null);
    } catch (error) {
      console.error('Error fetching penjualan bulanan:', error);
      setPenjualanBulanan(null);
    } finally {
      setLoadingState('bulanan', false);
    }
  }, [token, router]);

  // Fetch Top Products
  const fetchTopProducts = useCallback(async () => {
    if (!token) return;
    setLoadingState('products', true);
    try {
      const data = await apiWithRefresh(
        (tok) => getLaporanTopProducts(tok, { 
          limit: topProductsLimit 
        }),
        token,
        setToken,
        () => {},
        router
      );
      setTopProducts(data || null);
    } catch (error) {
      console.error('Error fetching top products:', error);
      setTopProducts(null);
    } finally {
      setLoadingState('products', false);
    }
  }, [token, router, topProductsLimit]);

  // Fetch Statistik (legacy)
  const fetchStatistik = useCallback(async () => {
    if (!token) return;
    setLoadingState('statistik', true);
    try {
      const data = await apiWithRefresh(
        (tok) => getLaporanStatistik(tok, {}),
        token,
        setToken,
        () => {},
        router
      );
      console.log('Raw statistik data:', data);
      console.log('Statistik kategori data:', data?.data?.kategori);
      if (data?.data?.kategori) {
        console.log('Kategori labels:', data.data.kategori.labels);
        console.log('Kategori datasets:', data.data.kategori.datasets);
      }
      setStatistik(data?.data || null);
    } catch (error) {
      console.error('Error fetching statistik:', error);
      setStatistik(null);
    } finally {
      setLoadingState('statistik', false);
    }
  }, [token, router]);

  // Initial data fetch
  useEffect(() => {
    if (!token) return;
    fetchDashboardStats();
    fetchPenjualanBulanan();
    fetchStatistik();
  }, [token, fetchDashboardStats, fetchPenjualanBulanan, fetchStatistik]);

  // Refresh data based on active tab
  useEffect(() => {
    if (!token) return;
    
    if (activeTab === 'harian') {
      fetchPenjualanHarian();
    } else if (activeTab === 'products') {
      fetchTopProducts();
    }
  }, [token, activeTab, fetchPenjualanHarian, fetchTopProducts]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Helper function untuk format rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Render Dashboard Stats Cards
  const renderDashboardStats = () => {
    if (loading.dashboard) {
      return (
        <div className="space-y-6">
          {/* Loading Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-6 animate-pulse">
            <div className="h-8 bg-blue-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-blue-150 rounded w-48"></div>
          </div>
          
          {/* Loading Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          
          {/* Loading Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse"></div>
            <div className="h-80 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      );
    }

    if (!dashboardStats) {
      return (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Tidak Tersedia</h3>
            <p className="text-gray-500">Statistik dashboard belum dapat ditampilkan. Silakan coba refresh data.</p>
          </div>
        </div>
      );
    }

    const { harian, bulanan, statistik_bulanan, ringkasan } = dashboardStats;
    const kreditBelumLunasList = bulanan?.kredit_belum_lunas_list || [];
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    return (
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dashboard Laporan</h2>
                <p className="text-blue-100 text-lg">
                  Periode: {statistik_bulanan?.bulan || 'Bulan ini'} • 
                  <span className="ml-2 font-semibold">
                    {(statistik_bulanan?.transaksi_lunas || 0) + (bulanan?.transaksi_kredit_belum_lunas || 0)} Total Transaksi
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100 mb-1">Total Omzet Bulan Ini</div>
                <div className="text-2xl font-bold">
                  {statistik_bulanan?.formatted?.total_keseluruhan || formatRupiah(statistik_bulanan?.total_keseluruhan || 0)}
                </div>
              </div>
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-100 text-sm font-medium">Transaksi Lunas</div>
                    <div className="text-2xl font-bold">{statistik_bulanan?.transaksi_lunas || 0}</div>
                  </div>
                  <div className="bg-green-400/20 p-2 rounded-lg">
                    <CreditCard className="h-6 w-6 text-green-300" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-100 text-sm font-medium">Kredit Belum Lunas</div>
                    <div className="text-2xl font-bold text-yellow-300">{bulanan?.transaksi_kredit_belum_lunas || 0}</div>
                  </div>
                  <div className="bg-yellow-400/20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-100 text-sm font-medium">Rata-rata Harian</div>
                    <div className="text-xl font-bold">
                      {bulanan?.formatted?.rata_rata_harian || formatRupiah(bulanan?.rata_rata_harian || 0)}
                    </div>
                  </div>
                  <div className="bg-purple-400/20 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Cash Lunas */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-emerald-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Banknote className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-emerald-600 text-sm font-medium">Pembayaran</div>
                  <div className="text-emerald-800 text-xs">Cash Lunas</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-emerald-800">
                  {bulanan?.formatted?.cash || formatRupiah(bulanan?.cash || 0)}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                    {((bulanan?.cash || 0) / ((bulanan?.cash || 0) + (bulanan?.kredit || 0)) * 100).toFixed(1)}% dari total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Kredit Lunas */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-blue-600 text-sm font-medium">Pembayaran</div>
                  <div className="text-blue-800 text-xs">Kredit Lunas</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-blue-800">
                  {bulanan?.formatted?.kredit || formatRupiah(bulanan?.kredit || 0)}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                    {((bulanan?.kredit || 0) / ((bulanan?.cash || 0) + (bulanan?.kredit || 0)) * 100).toFixed(1)}% dari total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Lunas (cash + kredit, status lunas) */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-violet-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-violet-600 text-sm font-medium">Total</div>
                  <div className="text-violet-800 text-xs">Semua Lunas</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-violet-800">
                  {statistik_bulanan?.formatted?.total_lunas || formatRupiah(statistik_bulanan?.total_lunas || 0)}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-full font-medium">
                    {statistik_bulanan?.transaksi_lunas || 0} transaksi
                  </div>
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kredit Belum Lunas - Clickable */}
          <Card 
            className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-rose-50 to-red-100 border-rose-200 relative overflow-hidden cursor-pointer hover:bg-gradient-to-br hover:from-rose-100 hover:to-red-200" 
            onClick={() => setShowKreditBelumLunas(true)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-rose-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-rose-600 text-sm font-medium">Perlu Ditagih</div>
                  <div className="text-rose-800 text-xs">Klik untuk detail</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-rose-800">
                  {bulanan?.formatted?.kredit_belum_lunas || formatRupiah(bulanan?.kredit_belum_lunas || 0)}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded-full font-medium">
                    {bulanan?.transaksi_kredit_belum_lunas || 0} transaksi
                  </div>
                  <div className="bg-rose-200 text-rose-800 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                    Klik disini
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performa Harian */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-amber-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-amber-600 text-sm font-medium">Performa</div>
                  <div className="text-amber-800 text-xs">Hari Ini</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-amber-800">
                  {harian?.formatted?.total || formatRupiah(harian?.total || 0)}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                    {harian?.transaksi || 0} transaksi hari ini
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perbandingan Cash vs Kredit */}
          <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/20 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-slate-500 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-slate-600 text-sm font-medium">Perbandingan</div>
                  <div className="text-slate-800 text-xs">Cash vs Kredit</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Cash Bulanan</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {ringkasan?.persentase_cash_bulanan || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${ringkasan?.persentase_cash_bulanan || 0}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Kredit Bulanan</span>
                  <span className="text-sm font-bold text-blue-600">
                    {ringkasan?.persentase_kredit_bulanan || 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${ringkasan?.persentase_kredit_bulanan || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insight Cards */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <TrendingUp className="h-5 w-5" />
                Insight Performa Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-indigo-700 font-medium">Total Transaksi</span>
                  <span className="text-2xl font-bold text-indigo-800">{bulanan?.transaksi || 0}</span>
                </div>
                <div className="text-sm text-indigo-600">
                  Rata-rata {Math.round((bulanan?.transaksi || 0) / 30)} transaksi per hari
                </div>
              </div>
              
              <div className="bg-white/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-indigo-700 font-medium">Periode Aktif</span>
                  <span className="text-lg font-bold text-indigo-800">{bulanan?.bulan || '-'}</span>
                </div>
                <div className="text-sm text-indigo-600">
                  Total omzet: {statistik_bulanan?.formatted?.total_keseluruhan || formatRupiah(statistik_bulanan?.total_keseluruhan || 0)}
                </div>
              </div>
              
              <div className="bg-white/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-indigo-700 font-medium">Efisiensi Pembayaran</span>
                  <span className="text-lg font-bold text-indigo-800">
                    {(((statistik_bulanan?.transaksi_lunas || 0) / ((statistik_bulanan?.transaksi_lunas || 0) + (bulanan?.transaksi_kredit_belum_lunas || 0)) * 100) || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-indigo-600">
                  Rasio transaksi yang sudah lunas
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Package className="h-5 w-5" />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowKreditBelumLunas(true)}
                className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Lihat Kredit Belum Lunas ({bulanan?.transaksi_kredit_belum_lunas || 0})
              </Button>
              
              <Button 
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                onClick={() => {
                  fetchDashboardStats();
                  loadingContext?.setLoading?.(true);
                  setTimeout(() => loadingContext?.setLoading?.(false), 1000);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data Dashboard
              </Button>
              
              <div className="bg-white/50 rounded-xl p-4 mt-4">
                <div className="text-sm text-purple-700 font-medium mb-2">Status Sistem</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-purple-600">Data terupdate secara real-time</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table/List for Kredit Belum Lunas (mobile friendly) */}
        <Modal open={showKreditBelumLunas} onClose={() => setShowKreditBelumLunas(false)} size="lg">
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-0 md:p-0 relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b">
              <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Daftar Kredit Belum Lunas
              </h2>
              <button onClick={() => setShowKreditBelumLunas(false)} className="ml-2 rounded-full p-2 hover:bg-rose-100 transition">
                <span className="sr-only">Tutup</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto px-4 md:px-6 py-4" style={{maxHeight: '60vh'}}>
              {kreditBelumLunasList.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Tidak ada transaksi kredit belum lunas</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-rose-50 text-rose-700">
                        <th className="px-3 py-3 text-left font-semibold">No</th>
                        <th className="px-3 py-3 text-left font-semibold">Tanggal</th>
                        <th className="px-3 py-3 text-left font-semibold">Nama Barang</th>
                        <th className="px-3 py-3 text-right font-semibold">Total</th>
                        <th className="px-3 py-3 text-left font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kreditBelumLunasList.map((trx: any, trxIdx: number) => (
                        <tr key={trx.id_transaksi} className="odd:bg-white even:bg-rose-50 hover:bg-rose-100 transition-colors">
                          <td className="px-3 py-3 font-medium text-center">
                            {trxIdx + 1}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatDate(trx.tanggal)}
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {trx.nama_barang || 'Nama barang tidak tersedia'}
                              </p>
                              {trx.id_transaksi && (
                                <p className="text-xs text-gray-500">
                                  ID Transaksi: {trx.id_transaksi.slice(-8)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-rose-600">
                            {trx.formatted?.harga_total || formatRupiah(trx.harga_total || 0)}
                          </td>
                          <td className="px-3 py-3">
                            {trx.keterangan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-3 border-t bg-rose-50 rounded-b-2xl">
              <button onClick={() => setShowKreditBelumLunas(false)} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition w-full md:w-auto">Tutup</button>
            </div>
          </div>
        </Modal>

      </div>
    );
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Laporan & Analisis
            </h1>
            <p className="text-gray-600 text-sm">
              Dashboard lengkap untuk analisis penjualan dan performa bisnis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadingContext?.setLoading?.(true);
                fetchDashboardStats();
                fetchPenjualanHarian();
                fetchPenjualanBulanan();
                fetchTopProducts();
                fetchStatistik();
                setTimeout(() => loadingContext?.setLoading?.(false), 1000);
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="harian">Harian</TabsTrigger>
            <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
            <TabsTrigger value="products">Top Produk</TabsTrigger>
            <TabsTrigger value="statistik">Statistik</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            {renderDashboardStats()}
          </TabsContent>

          {/* Penjualan Harian Tab */}
          <TabsContent value="harian" className="space-y-6">
            {/* Date Filter Section */}
            <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Calendar className="h-5 w-5" />
                    Laporan Penjualan Harian
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="start-date" className="text-sm font-medium">Dari:</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={dateRange.start_date}
                        onChange={(e) => {
                          console.log('Mengubah start_date dari', dateRange.start_date, 'ke', e.target.value);
                          setDateRange(prev => ({ ...prev, start_date: e.target.value }));
                        }}
                        className="w-fit border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="end-date" className="text-sm font-medium">Sampai:</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={dateRange.end_date}
                        onChange={(e) => {
                          console.log('Mengubah end_date dari', dateRange.end_date, 'ke', e.target.value);
                          setDateRange(prev => ({ ...prev, end_date: e.target.value }));
                        }}
                        className="w-fit border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <Button 
                      onClick={fetchPenjualanHarian} 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {loading.harian ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="h-80 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : penjualanHarian?.data?.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Trend Penjualan Harian
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Line
                        data={{
                          labels: penjualanHarian.data.map((item: any) => {
                            const date = new Date(item.tanggal);
                            return date.toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: 'short',
                              year: '2-digit'
                            });
                          }),
                          datasets: [
                            {
                              label: 'Total Penjualan',
                              data: penjualanHarian.data.map((item: any) => item.total),
                              borderColor: '#8b5cf6',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              borderWidth: 3,
                              tension: 0.4,
                              fill: true,
                              pointBackgroundColor: '#8b5cf6',
                              pointBorderColor: '#ffffff',
                              pointBorderWidth: 2,
                              pointRadius: 6,
                              pointHoverRadius: 8
                            },
                            {
                              label: 'Cash',
                              data: penjualanHarian.data.map((item: any) => item.cash),
                              borderColor: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              borderWidth: 2,
                              tension: 0.4,
                              pointBackgroundColor: '#3b82f6',
                              pointBorderColor: '#ffffff',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                              pointHoverRadius: 6
                            },
                            {
                              label: 'Kredit',
                              data: penjualanHarian.data.map((item: any) => item.kredit),
                              borderColor: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              borderWidth: 2,
                              tension: 0.4,
                              pointBackgroundColor: '#10b981',
                              pointBorderColor: '#ffffff',
                              pointBorderWidth: 2,
                              pointRadius: 4,
                              pointHoverRadius: 6
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                  size: 12,
                                  weight: 500
                                }
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              titleColor: '#ffffff',
                              bodyColor: '#ffffff',
                              borderColor: '#3b82f6',
                              borderWidth: 1,
                              cornerRadius: 8,
                              displayColors: true,
                              callbacks: {
                                label: function(context) {
                                  return `${context.dataset.label}: ${formatRupiah(context.parsed.y)}`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              grid: {
                                display: false
                              },
                              ticks: {
                                font: {
                                  size: 11
                                }
                              }
                            },
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                              },
                              ticks: {
                                callback: function(value) {
                                  return formatRupiah(value as number);
                                },
                                font: {
                                  size: 11
                                }
                              }
                            }
                          },
                          animation: {
                            duration: 2000,
                            easing: 'easeInOutQuart'
                          },
                          interaction: {
                            intersect: false,
                            mode: 'index'
                          }
                        }}
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  {/* Quick Stats */}
                  {penjualanHarian.summary && (
                    <>
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-600 text-xs font-medium">Total Periode</p>
                              <p className="text-2xl font-bold text-purple-800">
                                {formatRupiah((penjualanHarian.summary.total_cash || 0) + (penjualanHarian.summary.total_kredit || 0))}
                              </p>
                              <p className="text-xs text-purple-600 mt-1">
                                {penjualanHarian.summary.total_hari} hari • {penjualanHarian.summary.total_transaksi} transaksi
                              </p>
                            </div>
                            <div className="bg-purple-200 p-3 rounded-full">
                              <ShoppingCart className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-600 text-xs font-medium">Total Cash</p>
                              <p className="text-xl font-bold text-blue-800">
                                {formatRupiah(penjualanHarian.summary.total_cash || 0)}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                {((penjualanHarian.summary.total_cash || 0) / 
                                  ((penjualanHarian.summary.total_cash || 0) + (penjualanHarian.summary.total_kredit || 0)) * 100
                                ).toFixed(1)}% dari total
                              </p>
                            </div>
                            <div className="bg-blue-200 p-3 rounded-full">
                              <Banknote className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-600 text-xs font-medium">Total Kredit</p>
                              <p className="text-xl font-bold text-green-800">
                                {formatRupiah(penjualanHarian.summary.total_kredit || 0)}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                {((penjualanHarian.summary.total_kredit || 0) / 
                                  ((penjualanHarian.summary.total_cash || 0) + (penjualanHarian.summary.total_kredit || 0)) * 100
                                ).toFixed(1)}% dari total
                              </p>
                            </div>
                            <div className="bg-green-200 p-3 rounded-full">
                              <CreditCard className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-amber-600 text-xs font-medium">Rata-rata/Hari</p>
                              <p className="text-xl font-bold text-amber-800">
                                {formatRupiah(penjualanHarian.summary.rata_rata_per_hari || 0)}
                              </p>
                              <p className="text-xs text-amber-600 mt-1">
                                Per hari dalam periode
                              </p>
                            </div>
                            <div className="bg-amber-200 p-3 rounded-full">
                              <TrendingUp className="h-5 w-5 text-amber-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
                      <p className="text-gray-500">Tidak ada data penjualan untuk periode yang dipilih</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detail Data Table */}
            {penjualanHarian?.data?.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detail Penjualan Harian ({penjualanHarian.data.length} dari {((new Date(dateRange.end_date).getTime() - new Date(dateRange.start_date).getTime()) / (1000 * 60 * 60 * 24) + 1)} hari)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {penjualanHarian.data.map((item: any, index: number) => (
                      <div 
                        key={index} 
                        className="border rounded-xl p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md"
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h4>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.total_transaksi} transaksi
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-blue-600 text-xs font-medium block mb-1">Cash</span>
                            <p className="font-bold text-lg text-blue-800">
                              {item.formatted?.cash || formatRupiah(item.cash || 0)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <span className="text-green-600 text-xs font-medium block mb-1">Kredit</span>
                            <p className="font-bold text-lg text-green-800">
                              {item.formatted?.kredit || formatRupiah(item.kredit || 0)}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <span className="text-purple-600 text-xs font-medium block mb-1">Total</span>
                            <p className="font-bold text-lg text-purple-800">
                              {item.formatted?.total || formatRupiah(item.total || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Penjualan Bulanan Tab */}
          <TabsContent value="bulanan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Laporan Penjualan Bulanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading.bulanan ? (
                  <div className="h-64 bg-gray-100 rounded animate-pulse" />
                ) : penjualanBulanan?.data?.length > 0 ? (
                  <>
                    {/* Chart */}
                    <div className="mb-4">
                      <Line
                        data={{
                          labels: penjualanBulanan.data.map((item: any) => item.nama_bulan || item.bulan),
                          datasets: [
                            {
                              label: 'Total Penjualan',
                              data: penjualanBulanan.data.map((item: any) => item.total),
                              borderColor: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              tension: 0.4,
                              fill: true
                            },
                            {
                              label: 'Cash',
                              data: penjualanBulanan.data.map((item: any) => item.cash),
                              borderColor: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              tension: 0.4
                            },
                            {
                              label: 'Kredit',
                              data: penjualanBulanan.data.map((item: any) => item.kredit),
                              borderColor: '#f59e0b',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                              tension: 0.4
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            title: {
                              display: true,
                              text: 'Trend Penjualan Bulanan'
                            },
                            legend: {
                              display: true,
                              position: 'top'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return formatRupiah(value as number);
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Summary */}
                    {penjualanBulanan.summary && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-gray-600 text-xs">Total Bulan</p>
                          <p className="text-lg font-bold">{penjualanBulanan.summary.total_bulan}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 text-xs">Total Penjualan</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatRupiah(penjualanBulanan.summary.total_penjualan || 0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 text-sm">Rata-rata Bulanan</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatRupiah(penjualanBulanan.summary.rata_rata_bulanan || 0)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 text-sm">Pertumbuhan MoM</p>
                          <p className={`text-xl font-bold ${
                            parseFloat(penjualanBulanan.summary.pertumbuhan_mom || '0') >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {penjualanBulanan.summary.pertumbuhan_mom || 0}%
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada data penjualan bulanan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Produk Terlaris
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Select 
                      value={topProductsLimit.toString()} 
                      onValueChange={(value) => setTopProductsLimit(parseInt(value))}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Top 5</SelectItem>
                        <SelectItem value="10">Top 10</SelectItem>
                        <SelectItem value="20">Top 20</SelectItem>
                        <SelectItem value="50">Top 50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchTopProducts} size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading.products ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : topProducts?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.data.map((product: any, index: number) => (
                      <div 
                        key={product.id_sparepart || index} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-blue-500'
                        }`}>
                          {product.ranking || index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{product.nama_barang}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{product.kode_barang}</span>
                            <span>•</span>
                            <span>{product.merek}</span>
                            <span>•</span>
                            <span>{product.kategori}</span>
                            <span>•</span>
                            <span>{product.formatted?.harga_jual || formatRupiah(product.harga_jual || 0)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {product.formatted?.pendapatan || formatRupiah(product.total_pendapatan || 0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {product.total_terjual} unit • {product.total_transaksi} transaksi
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Period Info */}
                    {topProducts.period && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <p className="text-blue-700 text-sm font-medium">
                          📊 {topProducts.period.message || 'Data dari semua periode'}
                        </p>
                      </div>
                    )}

                    {/* Summary */}
                    {topProducts.summary && (
                      <div className="border-t pt-4 mt-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-gray-600 text-sm">Total Produk</p>
                            <p className="text-xl font-bold">{topProducts.summary.total_products}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Item Terjual</p>
                            <p className="text-xl font-bold text-blue-600">{topProducts.summary.total_items_sold}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Total Revenue</p>
                            <p className="text-xl font-bold text-green-600">
                              {topProducts.summary.formatted_revenue || formatRupiah(topProducts.summary.total_revenue || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada data produk</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistik Tab (Legacy) */}
          <TabsContent value="statistik" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Filter className="h-5 w-5" />
                  Statistik Penjualan
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Analisis penjualan berdasarkan kategori, merek, dan produk</p>
              </CardHeader>
              <CardContent>
                {loading.statistik ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-52 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : statistik ? (
                  <div className="space-y-6">
                    {/* Charts Grid - Compact Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Kategori Chart */}
                      {statistik.kategori && (
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-blue-100">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Per Kategori
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-40 w-full">
                              <Bar 
                                data={statistik.kategori} 
                                options={{ 
                                  responsive: true, 
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    x: {
                                      ticks: {
                                        font: { size: 10 },
                                        maxRotation: 45
                                      }
                                    },
                                    y: {
                                      ticks: {
                                        font: { size: 10 }
                                      }
                                    }
                                  }
                                }} 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Merek Chart */}
                      {statistik.merek && (
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-green-100">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Per Merek
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-40 w-full flex items-center justify-center">
                              <div className="w-32 h-32">
                                <Doughnut 
                                  data={statistik.merek} 
                                  options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          font: { size: 9 },
                                          padding: 6,
                                          usePointStyle: true
                                        }
                                      }
                                    }
                                  }} 
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Barang Chart */}
                      {statistik.barang && (
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border-purple-100">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              Per Barang
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="h-40 w-full">
                              <Bar 
                                data={statistik.barang} 
                                options={{ 
                                  responsive: true, 
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    }
                                  },
                                  scales: {
                                    x: {
                                      ticks: {
                                        font: { size: 10 },
                                        maxRotation: 45
                                      }
                                    },
                                    y: {
                                      ticks: {
                                        font: { size: 10 }
                                      }
                                    }
                                  }
                                }} 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Analisis - More Compact */}
                    {statistik.analisis && (
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Ringkasan Analisis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {statistik.analisis.map((item: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-blue-100">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-blue-800 leading-relaxed font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="shadow-sm">
                    <CardContent className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Filter className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Data statistik tidak tersedia</p>
                          <p className="text-gray-400 text-sm mt-1">Belum ada data transaksi untuk ditampilkan</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
