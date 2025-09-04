import axios from 'axios';
const API_URL = "http://localhost:5000";
export async function getLaporanStatistik(params: any) {
  const res = await axios.get(`${API_URL}/laporan/statistik`, { params });
  return res.data;
}
