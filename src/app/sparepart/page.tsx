/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllSparepart,
  addSparepart,
  updateSparepart,
  deleteSparepart,
  getRiwayatTransaksiSparepart,
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
  let str = '';
  if (typeof num === 'number') {
    str = num.toString();
  } else if (typeof num === 'string') {
    str = num ? num.replace(/[^\d]/g, '') : '';
  }
  if (!str) return '';
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseRupiah(str: string) {
  if (typeof str !== 'string') return '';
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
        const val = e.target.value;
        const raw = typeof val === 'string' ? val.replace(/[^\d]/g, '') : '';
        setValue(formatRupiah(raw));
      }}
      autoComplete="off"
    />
  );
};

const SparepartPage: React.FC = () => {
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedSparepart, setSelectedSparepart] = useState<any>(null);
  const [detailSparepart, setDetailSparepart] = useState<any>(null);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);
  const [token, setToken] = useState<string>('');
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedMerek, setSelectedMerek] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'empty' | 'normal'>('all');
  
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
      const result = await apiWithRefresh(
        getAllSparepart,
        token,
        setToken,
        () => {},
        router
      );
      setSparepartList(result);
    } catch {
      setSparepartList([]);
    }
  }, [token, router]);

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

  // Computed filtered sparepart
  const filteredSparepart = useMemo(() => {
    return sparepartList.filter(sp => {
      // Search filter
      const matchSearch = searchTerm === '' || 
        sp.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.kode_barang.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchCategory = selectedKategori === '' || sp.id_kategori_barang === selectedKategori;
      
      // Brand filter
      const matchBrand = selectedMerek === '' || sp.id_merek === selectedMerek;
      
      // Status filter
      let matchStatus = true;
      if (filterStatus === 'low') matchStatus = sp.sisa === 1;
      else if (filterStatus === 'empty') matchStatus = sp.sisa === 0;
      else if (filterStatus === 'normal') matchStatus = sp.sisa > 1;
      
      return matchSearch && matchCategory && matchBrand && matchStatus;
    });
  }, [sparepartList, searchTerm, selectedKategori, selectedMerek, filterStatus]);

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
      // Refresh data sparepart untuk mendapat data terbaru
      await fetchSparepart();
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
        fetchSparepart(); // Refresh data setelah add
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
        fetchSparepart(); // Refresh data setelah update
      } else if (confirmModal.type === 'delete') {
        await apiWithRefresh(
          (tok) => deleteSparepart(tok, confirmModal.payload.id),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Sparepart berhasil dihapus!');
        fetchSparepart(); // Refresh data setelah delete
      }
      setConfirmModal(null);
    } catch {
      toast.error('Gagal menyimpan data sparepart!');
      setConfirmModal(null);
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
  <div className="max-w-full mx-auto py-6 px-4">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Sparepart</h1>
            <p className="text-gray-600 text-sm mt-1">Kelola inventory sparepart Anda dengan mudah</p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition"
              onClick={handleExportExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Export
            </button>
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition"
              onClick={handleAdd}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Sparepart
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Sparepart</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{sparepartList.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Stok Normal</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {sparepartList.filter(sp => sp.sisa > 1).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Stok Rendah</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {sparepartList.filter(sp => sp.sisa === 1).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.86-.833-2.632 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Stok Habis</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {sparepartList.filter(sp => sp.sisa === 0).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6 px-4" aria-label="Tabs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                filterStatus === 'all' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Semua Sparepart
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                filterStatus === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {filteredSparepart.length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('normal')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                filterStatus === 'normal' 
                  ? 'border-green-500 text-green-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stok Normal
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                filterStatus === 'normal' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {sparepartList.filter(sp => sp.sisa > 1).length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                filterStatus === 'low' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stok Rendah
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                filterStatus === 'low' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {sparepartList.filter(sp => sp.sisa === 1).length}
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('empty')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                filterStatus === 'empty' 
                  ? 'border-red-500 text-red-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stok Habis
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${
                filterStatus === 'empty' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {sparepartList.filter(sp => sp.sisa === 0).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan nama sparepart atau kode..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px] text-sm"
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id_kategori_barang} value={k.id_kategori_barang}>{k.nama_kategori}</option>
                ))}
              </select>
              <select
                value={selectedMerek}
                onChange={(e) => setSelectedMerek(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px] text-sm"
              >
                <option value="">Semua Merek</option>
                {merekList.map((m) => (
                  <option key={m.id_merek} value={m.id_merek}>{m.nama_merek}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white">
          <div className="w-full">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-8">
                    No
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    Kode
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                    Nama Barang
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    Kategori
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    Merek
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    Harga Jual
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    Stok
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    Terjual
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    Status
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSparepart.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm font-medium text-gray-900">Tidak ada sparepart</p>
                        <p className="text-xs text-gray-500">Data sparepart tidak ditemukan sesuai dengan filter yang dipilih.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSparepart.map((sp, index) => {
                    return (
                      <tr key={sp.id_sparepart} className="hover:bg-gray-50 transition">
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900 truncate max-w-[48px]" title={sp.kode_barang}>
                            {sp.kode_barang}
                          </div>
                        </td>
                        <td className="px-2 py-2 max-w-[128px]">
                          <div className="text-xs font-medium text-gray-900 truncate" title={sp.nama_barang}>
                            {sp.nama_barang}
                          </div>
                          <div className="text-xs text-gray-400 truncate" title={`Sumber: ${sp.sumber}`}>
                            {sp.sumber}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 truncate max-w-[60px]" title={kategoriList.find(k => k.id_kategori_barang === sp.id_kategori_barang)?.nama_kategori || '-'}>
                            {(kategoriList.find(k => k.id_kategori_barang === sp.id_kategori_barang)?.nama_kategori || '-').length > 8 
                              ? (kategoriList.find(k => k.id_kategori_barang === sp.id_kategori_barang)?.nama_kategori || '-').substring(0, 8) + '...'
                              : kategoriList.find(k => k.id_kategori_barang === sp.id_kategori_barang)?.nama_kategori || '-'
                            }
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900 truncate max-w-[60px]" title={merekList.find(m => m.id_merek === sp.id_merek)?.nama_merek || '-'}>
                            {(merekList.find(m => m.id_merek === sp.id_merek)?.nama_merek || '-').length > 8 
                              ? (merekList.find(m => m.id_merek === sp.id_merek)?.nama_merek || '-').substring(0, 8) + '...'
                              : merekList.find(m => m.id_merek === sp.id_merek)?.nama_merek || '-'
                            }
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900">
                            {sp.harga_jual > 0 ? `${formatRupiah(sp.harga_jual)}` : '-'}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {sp.jumlah}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {sp.terjual}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            sp.sisa === 0 ? 'bg-red-100 text-red-800' : 
                            sp.sisa === 1 ? 'bg-orange-100 text-orange-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {sp.sisa === 0 ? 'Habis' : sp.sisa === 1 ? 'Rendah' : 'Normal'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDetail(sp)}
                              className="inline-flex items-center px-1.5 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                              title="Detail"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(sp)}
                              className="inline-flex items-center px-1.5 py-1 border border-blue-300 rounded text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(sp.id_sparepart)}
                              className="inline-flex items-center px-1.5 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition"
                              title="Hapus"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
                    <span className={`font-bold ${detailSparepart.sisa <= 1 ? "text-red-600" : "text-gray-800"}`}>
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
            {detailSparepart.sisa <= 1 && (
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
