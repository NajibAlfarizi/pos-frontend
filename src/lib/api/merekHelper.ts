/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = "http://localhost:5000";

export const getAllMerek = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/merek`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const addMerek = async (token: string, nama_merek: string): Promise<any> => {
  const res = await axios.post(`${API_URL}/merek`, { nama_merek }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateMerek = async (token: string, id: string, nama_merek: string): Promise<any> => {
  const res = await axios.put(`${API_URL}/merek/${id}`, { nama_merek }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteMerek = async (token: string, id: string): Promise<any> => {
  const res = await axios.delete(`${API_URL}/merek/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getSparepartStatByMerek = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/merek/statistik`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getKategoriBarangByMerek = async (token: string, id: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/merek/${id}/kategori-barang`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getPenjualanStatByMerek = async (token: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/merek/statistik-penjualan`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const searchMerek = async (token: string, q: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/merek/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};