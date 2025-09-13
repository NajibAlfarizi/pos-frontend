/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllSparepart,
  addSparepart,
  updateSparepart,
  deleteSparepart,
  getRiwayatTransaksiSparepart,
  searchSparepart,
  exportSparepartToExcel
} from '@/lib/api/sparepartHelper';
import { getAllKategoriBarang } from '@/lib/api/kategoriBarangHelper';
import { getAllMerek } from '@/lib/api/merekHelper';
import { apiWithRefresh } from '@/lib/api/authHelper';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useGlobalLoading } from '../GlobalLoadingContext';

// Helper for formatting and parsing rupiah
function formatRupiah(num: string | number) {
  let str = typeof num === 'number' ? num.toString() : num.replace(/[^\d]/g, '');
  if (!str) return '';
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(str: string) {
  return str.replace(/\./g, '');
}

// Custom input for rupiah
const RupiahInput: React.FC<{ name: string; label: string; defaultValue?: number }> = ({ name, label, defaultValue }) => {
  const [value, setValue] = React.useState(defaultValue ? formatRupiah(defaultValue) : '');

  React.useEffect(() => {
    setValue(defaultValue ? formatRupiah(defaultValue) : '');
  }, [defaultValue]);

  return (
    <input
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9.]*"
      className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
      placeholder={label}
      value={value}
      onChange={e => {
        // Only allow numbers
        const raw = e.target.value.replace(/[^\d]/g, '');
        setValue(formatRupiah(raw));
      }}
      autoComplete="off"
    />
  );
};

const SparepartPage: React.FC = () => {
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'low'>('all');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterMerek, setFilterMerek] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedSparepart, setSelectedSparepart] = useState<any>(null);
  const [detailSparepart, setDetailSparepart] = useState<any>(null);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);
  const [token, setToken] = useState<string>('');
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);
  // Snackbar diganti dengan sonner/toast
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'add' | 'edit' | 'delete'; payload: any } | null>(null);
  const router = useRouter();
  const { setLoading } = useGlobalLoading();

  // Export Excel handler
  const handleExportExcel = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const blob = await apiWithRefresh(
        (tok) => exportSparepartToExcel(tok),
        token,
        setToken,
        () => {},
        router
      );
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sparepart_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export berhasil!');
    } catch {
      toast.error('Export gagal!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sparepart list
  const fetchSparepart = useCallback(async () => {
    if (!token) return;
    try {
      let params: any = {};
      if (search) params.nama = search;
      if (filterKategori) params.kategori = filterKategori;
      if (filterMerek) params.merek = filterMerek;
      let result;
      if (search || filterKategori || filterMerek) {
        result = await apiWithRefresh(
          (tok) => searchSparepart(tok, params),
          token,
          setToken,
          () => {},
          router
        );
      } else {
        result = await apiWithRefresh(
          getAllSparepart,
          token,
          setToken,
          () => {},
          router
        );
      }
      setSparepartList(result);
    } catch {
      setSparepartList([]);
    }
  }, [token, search, filterKategori, filterMerek, router]);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userStr) {
      router.replace('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setToken(user.access_token);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetchSparepart();
  }, [token, fetchSparepart]);

  // Fetch kategori & merek for dropdowns
  useEffect(() => {
    if (!token) return;
    const fetchKategoriMerek = async () => {
      setLoading(true);
      try {
        const kategori = await apiWithRefresh(
          getAllKategoriBarang,
          token,
          setToken,
          () => {},
          router
        );
        setKategoriList(Array.isArray(kategori) ? kategori : []);
      } catch { setKategoriList([]); }
      try {
        const merek = await apiWithRefresh(
          getAllMerek,
          token,
          setToken,
          () => {},
          router
        );
        setMerekList(Array.isArray(merek) ? merek : []);
      } catch { setMerekList([]); }
      setLoading(false);
    };
    fetchKategoriMerek();
  }, [token, router, setLoading]);

  // Detail drawer/modal
  const handleDetail = async (sparepart: any) => {
    setDetailSparepart(sparepart);
    setLoading(true);
    try {
      const data = await apiWithRefresh(
        (tok) => getRiwayatTransaksiSparepart(tok, sparepart.id_sparepart),
        token,
        setToken,
        () => {},
        router
      );
      setRiwayatTransaksi(data);
    } catch {
      setRiwayatTransaksi([]);
    } finally {
      setLoading(false);
    }
  };

  // Modal add/edit
  const handleAdd = () => {
    setModalType('add');
    setSelectedSparepart(null);
    setShowModal(true);
  };
  const handleEdit = (sparepart: any) => {
    setModalType('edit');
    setSelectedSparepart(sparepart);
    setShowModal(true);
  };
  const handleDelete = async (id: string) => {
  setConfirmModal({ open: true, type: 'delete', payload: { id } });
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const kode_barang = (form.kode_barang as any)?.value || '';
    const nama_barang = (form.nama_barang as any)?.value || '';
    const id_kategori_barang = (form.id_kategori_barang as any)?.value || '';
    const id_merek = (form.id_merek as any)?.value || '';
    const sumber = (form.sumber as any)?.value || '';
    const jumlah = Number((form.jumlah as any)?.value) || 0;
    // Fix: saat edit, ambil terjual dari selectedSparepart
    const terjual = modalType === 'edit' ? Number(selectedSparepart?.terjual) || 0 : 0;
    const sisa = jumlah - terjual;
    // Parse formatted input back to number
    const harga_modal = Number(parseRupiah((form.harga_modal as any)?.value)) || 0;
    const harga_jual = Number(parseRupiah((form.harga_jual as any)?.value)) || 0;

    const payload = {
      id_sparepart: modalType === 'add' ? undefined : selectedSparepart?.id_sparepart,
      kode_barang,
      nama_barang,
      id_kategori_barang,
      id_merek,
      sumber,
      jumlah,
      terjual,
      sisa,
      harga_modal,
      harga_jual
    };

    setConfirmModal({ open: true, type: modalType, payload });
  };

  // Konfirmasi simpan pada modal
  const handleConfirmSave = async () => {
    if (!confirmModal) return;
    setLoading(true);
    try {
      if (confirmModal.type === 'add') {
        await apiWithRefresh(
          (tok) => addSparepart(tok, confirmModal.payload),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Sparepart berhasil ditambahkan!');
        setShowModal(false);
      } else if (confirmModal.type === 'edit' && selectedSparepart) {
        await apiWithRefresh(
          (tok) => updateSparepart(tok, selectedSparepart.id_sparepart, confirmModal.payload),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Sparepart berhasil diubah!');
        setShowModal(false);
      } else if (confirmModal.type === 'delete') {
        await apiWithRefresh(
          (tok) => deleteSparepart(tok, confirmModal.payload.id),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Sparepart berhasil dihapus!');
      }
      setConfirmModal(null);
      fetchSparepart();
    } catch {
      toast.error('Gagal menyimpan data sparepart!');
      setConfirmModal(null);
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
  <div className="max-w-5xl mx-auto py-8 px-2">
      <Toaster position="top-right" richColors />
      {/* Konfirmasi dialog simpan, edit, hapus */}
      <Dialog open={!!confirmModal?.open} onOpenChange={open => { if (!open) setConfirmModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmModal?.type === 'add' && 'Konfirmasi Tambah Sparepart'}
              {confirmModal?.type === 'edit' && 'Konfirmasi Edit Sparepart'}
              {confirmModal?.type === 'delete' && 'Konfirmasi Hapus Sparepart'}
            </DialogTitle>
          </DialogHeader>
          <div className="my-4">
            {confirmModal?.type === 'add' && 'Yakin ingin menambah sparepart baru?'}
            {confirmModal?.type === 'edit' && 'Yakin ingin menyimpan perubahan sparepart?'}
            {confirmModal?.type === 'delete' && 'Yakin ingin menghapus sparepart ini?'}
          </div>
          <DialogFooter>
            <button className="px-5 py-2 rounded-lg border text-gray-600 font-medium hover:bg-gray-100" onClick={() => setConfirmModal(null)}>Batal</button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700" onClick={handleConfirmSave}>
              {confirmModal?.type === 'delete' ? 'Ya, Hapus' : 'Ya, Simpan'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header & Actions + Tabs */}
      <div className="sticky top-0 z-10 bg-white pb-4 mb-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Sparepart</h1>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm text-sm font-medium transition"
              onClick={handleAdd}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Sparepart
            </button>
            <button
              className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-50 px-5 py-2.5 rounded-lg shadow-sm text-sm font-medium transition"
              onClick={handleExportExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Export
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-2">
          <button
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition ${activeTab === 'all' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-gray-600 bg-gray-100'}`}
            onClick={() => setActiveTab('all')}
          >
            Semua Sparepart
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition ${activeTab === 'low' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-600 bg-gray-100'}`}
            onClick={() => setActiveTab('low')}
          >
            Stok Rendah
          </button>
        </div>
        {/* Search & Filter (shared) */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                className="border px-4 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Cari nama sparepart..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
              />
              {search && search.length > 0 && (
                <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg max-w-xs w-full sm:w-72 max-h-40 overflow-auto z-20">
                  {sparepartList
                    .filter(sp => sp.nama_barang.toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 10)
                    .map(sp => (
                      <div
                        key={sp.id_sparepart}
                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                        onClick={() => setSearch(sp.nama_barang)}
                      >
                        {sp.nama_barang}
                      </div>
                    ))}
                  {sparepartList.filter(sp => sp.nama_barang.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-gray-400">Sparepart tidak ditemukan</div>
                  )}
                </div>
              )}
            </div>
            <select
              className="border px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {kategoriList.map((kat: any) => (
                <option key={kat.id_kategori_barang} value={kat.id_kategori_barang}>
                  {kat.nama_kategori}
                </option>
              ))}
            </select>
            <select
              className="border px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={filterMerek}
              onChange={e => setFilterMerek(e.target.value)}
            >
              <option value="">Semua Merek</option>
              {merekList.map((mrk: any) => (
                <option key={mrk.id_merek} value={mrk.id_merek}>
                  {mrk.nama_merek}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Daftar Sparepart (CRUD) - tabbed */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase">No</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase">Kode</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase w-48">Nama Barang</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase">Kategori</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase">Merek</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-left uppercase">Harga Jual</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-center uppercase">Stok</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-center uppercase">Terjual</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-center uppercase">Sisa</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-600 text-center uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(() => {
              const filtered = (activeTab === 'all'
                ? sparepartList
                : sparepartList.filter(sp => sp.sisa <= 2)
              ).filter(sp => {
                // Filter by kategori & merek
                const kategoriMatch = !filterKategori || sp.id_kategori_barang === filterKategori;
                const merekMatch = !filterMerek || sp.id_merek === filterMerek;
                // Search by nama_barang
                const searchMatch = !search || sp.nama_barang.toLowerCase().includes(search.toLowerCase());
                return kategoriMatch && merekMatch && searchMatch;
              });
              if (filtered.length === 0) {
                return (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400 text-lg font-semibold">Tidak ada data sparepart</td>
                  </tr>
                );
              }
              return filtered.map((sparepart, idx) => (
                <tr
                  key={sparepart.id_sparepart}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-3 py-2 text-sm text-gray-700 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 text-sm font-mono text-gray-600">{sparepart.kode_barang}</td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 truncate max-w-[180px]">{sparepart.nama_barang}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">
                    {sparepart.kategori_nama || kategoriList.find(k => k.id_kategori_barang === sparepart.id_kategori_barang)?.nama_kategori || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700">
                    {sparepart.merek_nama || merekList.find(m => m.id_merek === sparepart.id_merek)?.nama_merek || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{`Rp${formatRupiah(sparepart.harga_jual)}`}</td>
                  <td className="px-3 py-2 text-sm text-center">{sparepart.jumlah}</td>
                  <td className="px-3 py-2 text-sm text-center">{sparepart.terjual}</td>
                  <td className="px-3 py-2 text-sm text-center">
                    {sparepart.sisa <= 2 ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                        {sparepart.sisa}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {sparepart.sisa}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        className="px-2 py-1 text-xs rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(sparepart)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded-md border border-gray-400 text-gray-600 hover:bg-gray-50"
                        onClick={() => handleDetail(sparepart)}
                      >
                        Detail
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(sparepart.id_sparepart)}
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
      {/* Modal Tambah/Edit Sparepart */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-2xl border w-full max-w-xl p-8 animate-fadeIn"
            onSubmit={handleSubmit}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                {modalType === 'add' ? (
                  <>
                    Tambah Sparepart
                  </>
                ) : (
                  <>
                    Edit Sparepart
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="kode_barang"
                type="text"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="Kode Barang"
                defaultValue={selectedSparepart?.kode_barang || ''}
                required
              />
              <input
                name="nama_barang"
                type="text"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="Nama Barang"
                defaultValue={selectedSparepart?.nama_barang || ''}
                required
              />

              <select
                name="id_kategori_barang"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                defaultValue={selectedSparepart?.id_kategori_barang || ''}
                required
              >
                <option value="">Pilih Kategori</option>
                {kategoriList.map((kat: any) => (
                  <option key={kat.id_kategori_barang} value={kat.id_kategori_barang}>
                    {kat.nama_kategori}
                  </option>
                ))}
              </select>

              <select
                name="id_merek"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                defaultValue={selectedSparepart?.id_merek || ''}
                required
              >
                <option value="">Pilih Merek</option>
                {merekList.map((mrk: any) => (
                  <option key={mrk.id_merek} value={mrk.id_merek}>
                    {mrk.nama_merek}
                  </option>
                ))}
              </select>

              <input
                name="sumber"
                type="text"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="Sumber"
                defaultValue={selectedSparepart?.sumber || ''}
              />
              <input
                name="jumlah"
                type="number"
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="Jumlah stok awal"
                defaultValue={selectedSparepart?.jumlah || ''}
                required
              />
              {/* Harga Modal & Harga Jual with Rupiah formatting */}
              <RupiahInput
                name="harga_modal"
                label="Harga modal per unit"
                defaultValue={selectedSparepart?.harga_modal}
              />
              <RupiahInput
                name="harga_jual"
                label="Harga jual per unit"
                defaultValue={selectedSparepart?.harga_jual}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end mt-8">
              <button
                type="button"
                className="px-5 py-2 rounded-lg border text-gray-600 font-medium hover:bg-gray-100 transition"
                onClick={() => setShowModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drawer/Modal Detail Sparepart */}
      {detailSparepart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative animate-fadeIn">

            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-lg">🔍</span>
                Detail Sparepart: <span className="text-blue-700">{detailSparepart.nama_barang}</span>
              </h2>
              <button
                onClick={() => setDetailSparepart(null)}
                className="text-gray-400 hover:text-red-500 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Informasi Umum */}
              <div>
                <h3 className="text-gray-600 font-semibold mb-3">Informasi Umum</h3>
                <ul className="space-y-2 text-sm">
                  <li>Kode Barang: <span className="font-bold">{detailSparepart.kode_barang}</span></li>
                  <li>Nama Barang: <span className="font-bold">{detailSparepart.nama_barang}</span></li>
                  <li>Kategori: <span className="font-bold">{detailSparepart.kategori_nama || kategoriList.find(k => k.id_kategori_barang === detailSparepart.id_kategori_barang)?.nama_kategori || '-'}</span></li>
                  <li>Merek: <span className="font-bold">{detailSparepart.merek_nama || merekList.find(m => m.id_merek === detailSparepart.id_merek)?.nama_merek || '-'}</span></li>
                  <li>Sumber: <span className="font-bold">{detailSparepart.sumber}</span></li>
                </ul>
              </div>

              {/* Stok & Harga */}
              <div>
                <h3 className="text-gray-600 font-semibold mb-3">Stok & Harga</h3>
                <ul className="space-y-2 text-sm">
                  <li>Jumlah: <span className="font-bold">{detailSparepart.jumlah}</span></li>
                  <li>Terjual: <span className="font-bold">{detailSparepart.terjual}</span></li>
                  <li>
                    Sisa:{" "}
                    <span className={`font-bold ${detailSparepart.sisa <= 5 ? "text-red-600" : "text-gray-800"}`}>
                      {detailSparepart.sisa}
                    </span>
                  </li>
                </ul>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${detailSparepart.jumlah ? (detailSparepart.terjual / detailSparepart.jumlah) * 100 : 0}%` }}
                  />
                </div>

                <ul className="space-y-2 text-sm">
                  <li>Harga Modal: <span className="font-bold text-gray-700">Rp{detailSparepart.harga_modal}</span></li>
                  <li>Harga Jual: <span className="font-bold text-green-600">Rp{detailSparepart.harga_jual}</span></li>
                </ul>
              </div>
            </div>

            {/* Riwayat Transaksi */}
            <div className="mt-8">
              <h3 className="text-gray-600 font-semibold mb-3">Riwayat Transaksi</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {riwayatTransaksi.length > 0 ? (
                  riwayatTransaksi.map((trx: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3 text-sm bg-gray-50">
                      <div>Tipe: <span className="font-bold">{trx.tipe}</span></div>
                      <div>Jumlah: <span className="font-bold">{trx.jumlah}</span></div>
                      <div>Tanggal: <span className="font-bold">{trx.tanggal}</span></div>
                      <div>Keterangan: <span className="font-bold">{trx.keterangan}</span></div>
                    </div>
                  ))
                ) : (
                  <div className="italic text-gray-400">Belum ada transaksi</div>
                )}
              </div>
            </div>

            {/* Peringatan stok rendah */}
            {detailSparepart.sisa < 2 && (
              <div className="bg-red-100 text-red-700 rounded-lg p-3 font-medium mt-6 flex items-center gap-2">
                ⚠️ Stok sparepart ini rendah!
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end mt-8">
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                onClick={() => setDetailSparepart(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SparepartPage;
