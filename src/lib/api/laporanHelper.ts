/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export async function getLaporanStatistik(params: any) {
  const res = await axios.get(`${API_URL}/laporan/statistik`, { params });
  return res.data;
}
