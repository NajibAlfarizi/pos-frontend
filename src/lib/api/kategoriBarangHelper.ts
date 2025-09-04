/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getAllKategoriBarang = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/kategori-barang`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const addKategoriBarang = async (token: string, nama_kategori: string): Promise<any> => {
  const res = await axios.post(`${API_URL}/kategori-barang`, { nama_kategori }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateKategoriBarang = async (token: string, id: string, nama_kategori: string): Promise<any> => {
  const res = await axios.put(`${API_URL}/kategori-barang/${id}`, { nama_kategori }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteKategoriBarang = async (token: string, id: string): Promise<any> => {
  const res = await axios.delete(`${API_URL}/kategori-barang/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getSparepartStatByKategori = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/kategori-barang/statistik`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getPenjualanStatByKategori = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/kategori-barang/statistik-penjualan`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getMerekByKategori = async (token: string, id: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/kategori-barang/${id}/merek`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const searchKategori = async (token: string, q: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/kategori-barang/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};