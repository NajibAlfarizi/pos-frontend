/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import {
  getAllSparepart,
  addSparepart,
  updateSparepart,
  deleteSparepart,
  getSparepartStatistik,
  getRiwayatTransaksiSparepart,
  searchSparepart,
  getSparepartStokRendah,
  exportSparepartToExcel
} from '@/lib/api/sparepartHelper';
import { getAllKategoriBarang } from '@/lib/api/kategoriBarangHelper';
import { getAllMerek } from '@/lib/api/merekHelper';
import { apiWithRefresh } from '@/lib/api/authHelper';
import { useRouter } from 'next/navigation';

const TABS = [
  { key: 'list', label: '📋 Daftar Sparepart' },
  { key: 'statistik', label: '📊 Statistik' },
  { key: 'stok-rendah', label: '🔔 Notifikasi Stok Rendah' }
];

const SparepartPage: React.FC = () => {
  // ...existing state and hooks...

  // Export Excel handler
  const handleExportExcel = async () => {
    if (!token) return;
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
    } catch {
      alert('Gagal export Excel');
    }
  };
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [statistik, setStatistik] = useState<any>(null);
  const [stokRendahList, setStokRendahList] = useState<any[]>([]);
  const [tab, setTab] = useState<string>('list');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterMerek, setFilterMerek] = useState('');
  const [filterStokRendah, setFilterStokRendah] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedSparepart, setSelectedSparepart] = useState<any>(null);
  const [detailSparepart, setDetailSparepart] = useState<any>(null);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);
  const [token, setToken] = useState<string>('');
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);
  const router = useRouter();

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
      if (filterStokRendah) {
        result = result.filter((sp: any) => sp.sisa <= 5); // threshold default 5
      }
      setSparepartList(result);
    } catch {
      setSparepartList([]);
    }
  }, [token, search, filterKategori, filterMerek, filterStokRendah, router]);

  // Fetch statistik
  const fetchStatistik = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        getSparepartStatistik,
        token,
        setToken,
        () => {},
        router
      );
      setStatistik(data);
    } catch {
      setStatistik(null);
    }
  }, [token, router]);

  // Fetch stok rendah
  const fetchStokRendah = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        (tok) => getSparepartStokRendah(tok, 5),
        token,
        setToken,
        () => {},
        router
      );
      setStokRendahList(data);
    } catch {
      setStokRendahList([]);
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
    if (tab === 'list') fetchSparepart();
    if (tab === 'statistik') fetchStatistik();
    if (tab === 'stok-rendah') fetchStokRendah();
  }, [token, tab, fetchSparepart, fetchStatistik, fetchStokRendah]);

  // Fetch kategori & merek for dropdowns
  useEffect(() => {
    if (!token) return;
    const fetchKategoriMerek = async () => {
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
    };
    fetchKategoriMerek();
  }, [token, router]);

  // Detail drawer/modal
  const handleDetail = async (sparepart: any) => {
    setDetailSparepart(sparepart);
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
    if (confirm('Yakin hapus sparepart ini?')) {
      try {
        await apiWithRefresh(
          (tok) => deleteSparepart(tok, id),
          token,
          setToken,
          () => {},
          router
        );
        fetchSparepart();
      } catch {}
    }
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
  const terjual = modalType === 'edit' ? Number((form.terjual as any)?.value) || 0 : 0;
  const sisa = jumlah - terjual;
  const harga_modal = Number((form.harga_modal as any)?.value) || 0;
  const harga_jual = Number((form.harga_jual as any)?.value) || 0;

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

  try {
    if (modalType === 'add') {
      await apiWithRefresh(
        (tok) => addSparepart(tok, payload),
        token,
        setToken,
        () => {},
        router
      );
    } else if (modalType === 'edit' && selectedSparepart) {
      await apiWithRefresh(
        (tok) => updateSparepart(tok, selectedSparepart.id_sparepart, payload),
        token,
        setToken,
        () => {},
        router
      );
    }
    setShowModal(false);
    fetchSparepart();
  } catch {}
  };

  // UI
  return (
    <div className="max-w-5xl mx-auto py-8 px-2">
      {/* Header & Tab Navigasi */}
      <div className="sticky top-0 z-10 bg-white pb-2 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Manajemen Sparepart</h1>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAdd}>
              ➕ Tambah Sparepart
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleExportExcel}>
              📤 Export Excel
            </button>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          {TABS.map(tabItem => (
            <button
              key={tabItem.key}
              className={`px-3 py-1 rounded-full font-semibold border ${tab === tabItem.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setTab(tabItem.key)}
            >
              {tabItem.label}
            </button>
          ))}
        </div>
        {/* Search & Filter */}
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="text"
            className="border px-3 py-2 rounded w-full sm:w-64"
            placeholder="Cari nama sparepart..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="border px-3 py-2 rounded" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
            <option value="">🔎 Kategori</option>
            {kategoriList.map((kat: any) => (
              <option key={kat.id_kategori_barang} value={kat.id_kategori_barang}>🏷️ {kat.nama_kategori}</option>
            ))}
          </select>
          <select className="border px-3 py-2 rounded" value={filterMerek} onChange={e => setFilterMerek(e.target.value)}>
            <option value="">🏢 Merek</option>
            {merekList.map((mrk: any) => (
              <option key={mrk.id_merek} value={mrk.id_merek}>🏢 {mrk.nama_merek}</option>
            ))}
          </select>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={filterStokRendah} onChange={e => setFilterStokRendah(e.target.checked)} />
            Stok Rendah
          </label>
        </div>
      </div>
      {/* Tab: Daftar Sparepart (CRUD) */}
      {tab === 'list' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow border">
            <thead>
              <tr className="bg-gray-200 border-b-2 border-gray-300">
                <th className="px-3 py-2 text-left font-bold">No</th>
                <th className="px-3 py-2 text-left font-bold">Kode</th>
                <th className="px-3 py-2 text-left font-bold">Nama Barang</th>
                <th className="px-3 py-2 text-left font-bold">Kategori</th>
                <th className="px-3 py-2 text-left font-bold">Merek</th>
                <th className="px-3 py-2 text-left font-bold">Harga Jual</th>
                <th className="px-3 py-2 text-left font-bold">Stok</th>
                <th className="px-3 py-2 text-left font-bold">Terjual</th>
                <th className="px-3 py-2 text-left font-bold">Sisa</th>
                <th className="px-3 py-2 text-left font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sparepartList.map((sparepart, idx) => (
                <tr key={sparepart.id_sparepart} className={sparepart.sisa <= 5 ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{sparepart.kode_barang}</td>
                  <td className="px-3 py-2 font-semibold">{sparepart.nama_barang}</td>
                  <td className="px-3 py-2">
                    {sparepart.kategori_nama || kategoriList.find(k => k.id_kategori_barang === sparepart.id_kategori_barang)?.nama_kategori || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {sparepart.merek_nama || merekList.find(m => m.id_merek === sparepart.id_merek)?.nama_merek || '-'}
                  </td>
                  <td className="px-3 py-2">Rp{sparepart.harga_jual}</td>
                  <td className="px-3 py-2">{sparepart.jumlah}</td>
                  <td className="px-3 py-2">{sparepart.terjual}</td>
                  <td className={`px-3 py-2 font-bold ${sparepart.sisa <= 5 ? 'text-red-600' : 'text-gray-800'}`}>{sparepart.sisa}</td>
                  <td className="px-3 py-2">
                    <button className="text-blue-600 mr-2 px-2 py-1 rounded hover:bg-blue-100" title="Edit" onClick={() => handleEdit(sparepart)}>✏️</button>
                    <button className="text-red-600 mr-2 px-2 py-1 rounded hover:bg-red-100" title="Hapus" onClick={() => handleDelete(sparepart.id_sparepart)}>🗑️</button>
                    <button className="text-gray-600 px-2 py-1 rounded hover:bg-gray-100" title="Detail" onClick={() => handleDetail(sparepart)}>🔎</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Tab: Statistik */}
      {tab === 'statistik' && statistik && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Sparepart</div>
              <div className="text-2xl font-bold">{statistik.total_sparepart}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Stok</div>
              <div className="text-2xl font-bold">{statistik.total_stok}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Terjual</div>
              <div className="text-2xl font-bold">{statistik.total_terjual}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Sisa</div>
              <div className="text-2xl font-bold">{statistik.total_sisa}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Modal</div>
              <div className="text-2xl font-bold">Rp{statistik.total_modal}</div>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <div className="text-sm text-gray-500">Total Penjualan</div>
              <div className="text-2xl font-bold">Rp{statistik.total_penjualan}</div>
            </div>
          </div>
          {/* TODO: Pie chart & bar chart visualisasi */}
        </div>
      )}
      {/* Tab: Notifikasi Stok Rendah */}
      {tab === 'stok-rendah' && (
        <div className="space-y-3">
          <div className="bg-orange-100 text-orange-800 rounded p-4 font-bold">
            ⚠️ Ada {stokRendahList.length} sparepart dengan stok rendah
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Array.isArray(stokRendahList) ? stokRendahList : []).map(sparepart => (
              <div key={sparepart.id_sparepart} className="bg-white rounded shadow p-4 flex flex-col gap-2 border border-orange-400">
                <div className="font-bold text-lg">{sparepart.nama_barang}</div>
                <div className="text-sm">Sisa Stok: <span className="font-bold text-red-600">{sparepart.sisa}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal Tambah/Edit Sparepart */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-lg p-8" onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">{modalType === 'add' ? '➕' : '✏️'}</span>
              <h2 className="text-2xl font-bold">{modalType === 'add' ? 'Tambah Sparepart' : 'Edit Sparepart'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input name="kode_barang" type="text" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Kode Barang" defaultValue={selectedSparepart?.kode_barang || ''} required />
              <input name="nama_barang" type="text" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Nama Barang" defaultValue={selectedSparepart?.nama_barang || ''} required />
              <select name="id_kategori_barang" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" defaultValue={selectedSparepart?.id_kategori_barang || ''} required>
                <option value="">🏷️ Pilih Kategori</option>
                {kategoriList.map((kat: any) => (
                  <option key={kat.id_kategori_barang} value={kat.id_kategori_barang}>{kat.nama_kategori}</option>
                ))}
              </select>
              <select name="id_merek" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" defaultValue={selectedSparepart?.id_merek || ''} required>
                <option value="">🏢 Pilih Merek</option>
                {merekList.map((mrk: any) => (
                  <option key={mrk.id_merek} value={mrk.id_merek}>{mrk.nama_merek}</option>
                ))}
              </select>
              <input name="sumber" type="text" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Sumber" defaultValue={selectedSparepart?.sumber || ''} />
              <input name="jumlah" type="number" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Jumlah stok awal" defaultValue={selectedSparepart?.jumlah || ''} required />
              <input name="harga_modal" type="number" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Harga modal per unit" defaultValue={selectedSparepart?.harga_modal || ''} />
              <input name="harga_jual" type="number" className="border-2 border-gray-300 px-3 py-2 rounded-lg w-full" placeholder="Harga jual per unit" defaultValue={selectedSparepart?.harga_jual || ''} />
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <button type="button" className="px-6 py-2 rounded-lg border font-semibold hover:bg-gray-100" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700">Simpan</button>
            </div>
          </form>
        </div>
      )}
      {/* Drawer/Modal Detail Sparepart */}
      {detailSparepart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🔎</span>
              <h2 className="text-2xl font-bold">Detail Sparepart: {detailSparepart.nama_barang}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="font-semibold mb-1">Informasi Umum</div>
                <div className="mb-1">Kode Barang: <span className="font-bold">{detailSparepart.kode_barang}</span></div>
                <div className="mb-1">Nama Barang: <span className="font-bold">{detailSparepart.nama_barang}</span></div>
                <div className="mb-1">Kategori: <span className="font-bold">{detailSparepart.kategori_nama || kategoriList.find(k => k.id_kategori_barang === detailSparepart.id_kategori_barang)?.nama_kategori || '-'}</span></div>
                <div className="mb-1">Merek: <span className="font-bold">{detailSparepart.merek_nama || merekList.find(m => m.id_merek === detailSparepart.id_merek)?.nama_merek || '-'}</span></div>
                <div className="mb-1">Sumber: <span className="font-bold">{detailSparepart.sumber}</span></div>
              </div>
              <div>
                <div className="font-semibold mb-1">Stok & Harga</div>
                <div className="mb-1">Jumlah: <span className="font-bold">{detailSparepart.jumlah}</span></div>
                <div className="mb-1">Terjual: <span className="font-bold">{detailSparepart.terjual}</span></div>
                <div className="mb-1">Sisa: <span className={`font-bold ${detailSparepart.sisa <= 5 ? 'text-red-600' : 'text-gray-800'}`}>{detailSparepart.sisa}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${detailSparepart.jumlah ? (detailSparepart.terjual / detailSparepart.jumlah) * 100 : 0}%` }}
                  />
                </div>
                <div className="mb-1">Harga Modal: <span className="font-bold">Rp{detailSparepart.harga_modal}</span></div>
                <div className="mb-1">Harga Jual: <span className="font-bold">Rp{detailSparepart.harga_jual}</span></div>
              </div>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2">Riwayat Transaksi</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {riwayatTransaksi.length > 0 ? riwayatTransaksi.map((trx: any, idx: number) => (
                  <div key={idx} className="border rounded p-2 text-sm bg-gray-50">
                    <div>Tipe: <span className="font-bold">{trx.tipe}</span></div>
                    <div>Jumlah: <span className="font-bold">{trx.jumlah}</span></div>
                    <div>Tanggal: <span className="font-bold">{trx.tanggal}</span></div>
                    <div>Keterangan: <span className="font-bold">{trx.keterangan}</span></div>
                  </div>
                )) : <div className="italic text-gray-400">Belum ada transaksi</div>}
              </div>
            </div>
            {detailSparepart.sisa <= 5 && (
              <div className="bg-red-100 text-red-700 rounded p-3 font-bold mb-2 flex items-center gap-2"><span>⚠️</span> Stok sparepart ini rendah!</div>
            )}
            <div className="flex justify-end mt-6">
              <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700" onClick={() => setDetailSparepart(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SparepartPage;
