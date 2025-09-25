/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Interface untuk data retur
export interface ReturData {
  id_sparepart: string;
  jumlah_retur: number;
  keterangan?: string;
}

export interface ReturResponse {
  id_retur: string;
  id_sparepart: string;
  jumlah_retur: number;
  keterangan?: string;
  tanggal_retur: string;
  sparepart?: {
    nama_barang: string;
    kode_barang: string;
    id_merek: string;
    id_kategori_barang: string;
    harga_jual: number;
    merek?: {
      nama_merek: string;
    };
    kategori_barang?: {
      nama_kategori: string;
    };
  };
}

// Tambah retur baru
export const addRetur = async (token: string, returData: ReturData) => {
  try {
    const res = await axios.post(`${API_URL}/retur`, returData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

// Get semua retur dengan filter
export const getAllRetur = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/retur`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

// Get retur by ID
export const getReturById = async (token: string, id: string) => {
  try {
    const res = await axios.get(`${API_URL}/retur/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

// Update retur
export const updateRetur = async (token: string, id: string, returData: any) => {
  try {
    const res = await axios.put(`${API_URL}/retur/${id}`, returData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

// Delete retur
export const deleteRetur = async (token: string, id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/retur/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

// Get statistik retur
export const getReturStats = async (token: string) => {
  try {
    const res = await axios.get(`${API_URL}/retur/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};