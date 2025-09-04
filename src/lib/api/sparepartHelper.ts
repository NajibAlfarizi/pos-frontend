/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Sparepart {
  id_sparepart: string;
  kode_barang: string;
  nama_barang: string;
  id_merek: string;
  id_kategori_barang: string;
  sumber: string;
  jumlah: number;
  terjual: number;
  sisa: number;
  harga_modal: number;
  harga_jual: number;
  created_at?: string;
  updated_at?: string;
}

export const getAllSparepart = async (token: string): Promise<Sparepart[]> => {
  const res = await axios.get(`${API_URL}/sparepart`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const addSparepart = async (token: string, data: Sparepart): Promise<Sparepart> => {
  const res = await axios.post(`${API_URL}/sparepart`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateSparepart = async (token: string, id: string, data: Partial<Sparepart>): Promise<Sparepart> => {
  const res = await axios.put(`${API_URL}/sparepart/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteSparepart = async (token: string, id: string): Promise<{ message: string }> => {
  const res = await axios.delete(`${API_URL}/sparepart/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateSparepartByTransaksi = async (
  token: string,
  payload: { id_sparepart: string; tipe: string; jumlah: number }
): Promise<any> => {
  const res = await axios.post(`${API_URL}/sparepart/update-by-transaksi`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getSparepartStatistik = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/sparepart/statistik`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getRiwayatTransaksiSparepart = async (token: string, id_sparepart: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/sparepart/${id_sparepart}/riwayat-transaksi`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const searchSparepart = async (
  token: string,
  params: { nama?: string; kategori?: string; merek?: string }
): Promise<any> => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await axios.get(`${API_URL}/sparepart/search?${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getSparepartStokRendah = async (token: string, threshold?: number): Promise<any> => {
  const url = threshold
    ? `${API_URL}/sparepart/stok-rendah?threshold=${threshold}`
    : `${API_URL}/sparepart/stok-rendah`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Export sparepart ke Excel multi-sheet
export const exportSparepartToExcel = async (token: string): Promise<Blob> => {
  const res = await axios.get(`${API_URL}/sparepart/export-excel`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
  return res.data;
};