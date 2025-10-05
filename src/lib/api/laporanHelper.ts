import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Type definitions
interface PenjualanHarianParams {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

interface PenjualanBulananParams {
  year?: number;
  months?: number;
}

interface TopProductsParams {
  start_date?: string;
  end_date?: string;
  limit?: number;
}

interface StatistikParams {
  kategori?: string;
  merek?: string;
  barang?: string;
}

// Dashboard Statistik Utama
export async function getDashboardStatistik(token: string) {
  const res = await axios.get(`${API_URL}/laporan/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// Laporan Penjualan Harian
export async function getLaporanPenjualanHarian(token: string, params: PenjualanHarianParams = {}) {
  const res = await axios.get(`${API_URL}/laporan/penjualan-harian`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// Laporan Penjualan Bulanan
export async function getLaporanPenjualanBulanan(token: string, params: PenjualanBulananParams = {}) {
  const res = await axios.get(`${API_URL}/laporan/penjualan-bulanan`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// Laporan Produk Terlaris
export async function getLaporanTopProducts(token: string, params: TopProductsParams = {}) {
  const res = await axios.get(`${API_URL}/laporan/top-products`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// Statistik Kategori/Merek/Barang (backward compatibility)
export async function getLaporanStatistik(token: string, params: StatistikParams = {}) {
  const res = await axios.get(`${API_URL}/laporan/statistik`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}
