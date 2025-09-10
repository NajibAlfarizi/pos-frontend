/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const DashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const user = getProfile();
      setProfile(user);
      setToken(user.access_token);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Handler akses token dan refresh token
  useEffect(() => {
    if (!token) return;
    const checkToken = async () => {
      // Contoh: panggil API yang butuh token, misal getRingkasanTransaksi
      await apiWithRefresh(
        async (t) => {
          // await getRingkasanTransaksi(t);
          return true;
        },
        token,
        setToken,
        setProfile,
        router
      );
    };
    checkToken();
  }, [token, router]);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Selamat Datang di Dashboard POS Sparepart</h1>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Petunjuk Penggunaan Aplikasi</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Login menggunakan akun yang telah diberikan oleh admin.</li>
          <li>Kelola data <b>sparepart</b>, <b>merek</b>, dan <b>kategori barang</b> melalui menu di sidebar.</li>
          <li>Tambah, edit, dan hapus data sparepart sesuai kebutuhan.</li>
          <li>Catat transaksi masuk dan keluar untuk setiap sparepart agar stok dan penjualan otomatis terupdate.</li>
          <li>Gunakan fitur <b>statistik</b> untuk melihat ringkasan penjualan dan stok sparepart.</li>
          <li>Manfaatkan fitur <b>search/filter</b> untuk mencari data dengan cepat.</li>
          <li>Export data transaksi dan sparepart ke format Excel/CSV untuk laporan.</li>
          <li>Perhatikan notifikasi stok rendah agar tidak kehabisan barang penting.</li>
          <li>Hanya admin/owner yang dapat mengelola data master dan melakukan penghapusan data.</li>
        </ul>
        <div className="mt-6 text-gray-600 text-sm">
          Untuk bantuan lebih lanjut, hubungi admin atau lihat dokumentasi aplikasi.
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
