/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllSparepart } from "@/lib/api/sparepartHelper";
import { getAllKategoriBarang } from "@/lib/api/kategoriBarangHelper";
import { getAllMerek } from "@/lib/api/merekHelper";
import { getLaporanStatistik } from "@/lib/api/laporanHelper";
import { apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function LaporanPage() {
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [filter, setFilter] = useState<any>({});
  const [statistik, setStatistik] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Ambil token dari localStorage
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!userStr) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setToken(user.access_token);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Fetch kategori, merek, barang
  useEffect(() => {
    if (!token) return;
    const fetchDropdowns = async () => {
      try {
        const kategori = await apiWithRefresh(getAllKategoriBarang, token, setToken, () => {}, router);
        setKategoriList(Array.isArray(kategori) ? kategori : []);
      } catch { setKategoriList([]); }
      try {
        const merek = await apiWithRefresh(getAllMerek, token, setToken, () => {}, router);
        setMerekList(Array.isArray(merek) ? merek : []);
      } catch { setMerekList([]); }
      try {
        const barang = await apiWithRefresh(getAllSparepart, token, setToken, () => {}, router);
        setSparepartList(Array.isArray(barang) ? barang : []);
      } catch { setSparepartList([]); }
    };
    fetchDropdowns();
  }, [token, router]);

  // Fetch statistik laporan
  const fetchStatistik = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        (tok) => getLaporanStatistik(filter),
        token,
        setToken,
        () => {},
        router
      );
      setStatistik(data);
    } catch {
      setStatistik(null);
    }
  }, [token, filter, router]);

  useEffect(() => {
    if (!token) return;
    fetchStatistik();
  }, [token, filter, fetchStatistik]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 space-y-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">Laporan & Analisis</h1>
      <Card className="shadow-md border rounded-xl bg-white mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-lg font-bold">Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filter.kategori || 'all'} onValueChange={val => setFilter(f => ({ ...f, kategori: val === 'all' ? undefined : val }))}>
              <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Kategori Barang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {kategoriList.map(kat => (
                  <SelectItem key={kat.id_kategori_barang} value={kat.id_kategori_barang}>{kat.nama_kategori}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter.merek || 'all'} onValueChange={val => setFilter(f => ({ ...f, merek: val === 'all' ? undefined : val }))}>
              <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Merek" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Merek</SelectItem>
                {merekList.map(mk => (
                  <SelectItem key={mk.id_merek} value={mk.id_merek}>{mk.nama_merek}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filter.barang || 'all'} onValueChange={val => setFilter(f => ({ ...f, barang: val === 'all' ? undefined : val }))}>
              <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Nama Barang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Barang</SelectItem>
                {sparepartList.map(sp => (
                  <SelectItem key={sp.id_sparepart} value={sp.id_sparepart}>{sp.nama_barang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Chart Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md border rounded-xl bg-white">
          <CardHeader><CardTitle>Transaksi per Kategori</CardTitle></CardHeader>
          <CardContent>
            {statistik?.kategori && (
              <Bar data={statistik.kategori} options={{ plugins: { legend: { display: false } } }} />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md border rounded-xl bg-white">
          <CardHeader><CardTitle>Transaksi per Merek</CardTitle></CardHeader>
          <CardContent>
            {statistik?.merek && (
              <Pie data={statistik.merek} />
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md border rounded-xl bg-white">
          <CardHeader><CardTitle>Transaksi per Barang</CardTitle></CardHeader>
          <CardContent>
            {statistik?.barang && (
              <Bar data={statistik.barang} options={{ plugins: { legend: { display: false } } }} />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Analisis Section */}
      <Card className="shadow-md border rounded-xl bg-white mt-4">
        <CardHeader><CardTitle>Analisis & Insight</CardTitle></CardHeader>
        <CardContent>
          {statistik?.analisis ? (
            <ul className="list-disc pl-5 space-y-2">
              {statistik.analisis.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Belum ada insight, silakan pilih filter untuk analisis.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
