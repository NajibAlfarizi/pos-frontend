/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect, useCallback } from "react";
import {
  getAllKategoriBarang,
  addKategoriBarang,
  updateKategoriBarang,
  deleteKategoriBarang,
  getSparepartStatByKategori,
  getPenjualanStatByKategori,
  getMerekByKategori,
  searchKategori
} from "@/lib/api/kategoriBarangHelper";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "list", label: "🔎 Daftar Kategori" },
  { key: "sparepart", label: "📦 Statistik Sparepart" },
  { key: "penjualan", label: "🛒 Statistik Penjualan" }
];

const KategoriBarangPage: React.FC = () => {
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [totalKategori, setTotalKategori] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedKategori, setSelectedKategori] = useState<any>(null);
  const [namaKategori, setNamaKategori] = useState("");
  const [token, setToken] = useState<string>("");
  const [tab, setTab] = useState<string>("list");
  const [statistik, setStatistik] = useState<any[]>([]);
  const [penjualanStat, setPenjualanStat] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [merekList, setMerekList] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
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

  // Wrapper API agar support pagination
  const getAllKategoriPaginated = async (token: string, page: number, pageSize: number) => {
    const res = await getAllKategoriBarang(token);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: res.slice(start, end),
      meta: { total: res.length }
    };
  };

  const searchKategoriPaginated = async (token: string, search: string, page: number, pageSize: number) => {
    const res = await searchKategori(token, search);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: res.slice(start, end),
      meta: { total: res.length }
    };
  };

  const fetchKategori = useCallback(async () => {
    if (!token) return;
    try {
      let result;
      if (search.length > 0) {
        result = await apiWithRefresh(
          (tok) => searchKategoriPaginated(tok, search, page, pageSize),
          token,
          setToken,
          () => {},
          router
        );
      } else {
        result = await apiWithRefresh(
          (tok) => getAllKategoriPaginated(tok, page, pageSize),
          token,
          setToken,
          () => {},
          router
        );
      }
      setKategoriList(result.data);
      setTotalKategori(result.meta.total);
    } catch {
      setKategoriList([]);
      setTotalKategori(0);
    }
  }, [token, search, page, pageSize, router]);

  const fetchStatistik = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        getSparepartStatByKategori,
        token,
        setToken,
        () => {},
        router
      );
      setStatistik(data);
    } catch {
      setStatistik([]);
    }
  }, [token, router]);

  const fetchPenjualanStat = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        getPenjualanStatByKategori,
        token,
        setToken,
        () => {},
        router
      );
      setPenjualanStat(data);
    } catch {
      setPenjualanStat([]);
    }
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    if (tab === "list") fetchKategori();
    if (tab === "sparepart") fetchStatistik();
    if (tab === "penjualan") fetchPenjualanStat();
  }, [token, tab, fetchKategori, fetchStatistik, fetchPenjualanStat]);

  const fetchMerekKategori = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        (tok) => getMerekByKategori(tok, id),
        token,
        setToken,
        () => {},
        router
      );
      setMerekList(data);
    } catch {
      setMerekList([]);
    }
  }, [token, router]);

  const handleAdd = () => {
    setModalType("add");
    setNamaKategori("");
    setShowModal(true);
  };

  const handleEdit = (kategori: any) => {
    setModalType("edit");
    setSelectedKategori(kategori);
    setNamaKategori(kategori.nama_kategori);
    setShowModal(true);
  };

  const handleDetail = async (kategori: any) => {
    setSelectedDetail(kategori);
    fetchMerekKategori(kategori.id_kategori_barang);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin hapus kategori ini?")) {
      try {
        await apiWithRefresh(
          (tok) => deleteKategoriBarang(tok, id),
          token,
          setToken,
          () => {},
          router
        );
        fetchKategori();
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori.trim()) {
      alert("Nama kategori wajib diisi!");
      return;
    }
    try {
      if (modalType === "add") {
        await apiWithRefresh(
          (tok) => addKategoriBarang(tok, namaKategori),
          token,
          setToken,
          () => {},
          router
        );
      } else if (modalType === "edit" && selectedKategori) {
        await apiWithRefresh(
          (tok) => updateKategoriBarang(tok, selectedKategori.id_kategori_barang, namaKategori),
          token,
          setToken,
          () => {},
          router
        );
      }
      setShowModal(false);
      fetchKategori();
    } catch {}
  };

  // Statistik per kategori
  const getJumlahSparepart = useCallback((id_kategori: string) => {
    const stat = statistik.find((s: any) => s.id_kategori_barang === id_kategori);
    return stat ? stat.total_sparepart : 0;
  }, [statistik]);

  // Statistik penjualan per kategori
  const getPenjualanStat = useCallback((id_kategori: string) => {
    const stat = penjualanStat.find((s: any) => s.id_kategori_barang === id_kategori);
    return stat || { total_stok: 0, total_terjual: 0, total_sisa: 0 };
  }, [penjualanStat]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-2">
      {/* Header & Tab Navigasi */}
      <div className="sticky top-0 z-10 bg-white pb-2 mb-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Kategori Barang</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleAdd}>
            ➕ Tambah Kategori
          </button>
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
        <div className="mb-2">
          <input
            type="text"
            className="border px-3 py-2 rounded w-full"
            placeholder="Cari kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {/* Tab: Daftar Kategori (CRUD) */}
      {tab === "list" && (
        <>
          <div className="space-y-3">
            {kategoriList.length === 0 ? (
              <div className="bg-white rounded shadow p-4 text-center text-gray-400">Belum ada kategori.</div>
            ) : (
              kategoriList.map((kategori) => (
                <div key={kategori.id_kategori_barang} className="bg-white rounded shadow p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{kategori.nama_kategori || 'Tanpa Nama'}</div>
                    <div className="text-sm text-gray-500">{getJumlahSparepart(kategori.id_kategori_barang)} sparepart terkait</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-blue-600" onClick={() => handleEdit(kategori)}>⋮</button>
                    <button className="text-red-600" onClick={() => handleDelete(kategori.id_kategori_barang)}>🗑️</button>
                    <button className="text-gray-600" onClick={() => handleDetail(kategori)}>🔎</button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Pagination */}
          {totalKategori > 0 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(totalKategori / pageSize) }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href="#"
                        isActive={page === i + 1}
                        onClick={e => {
                          e.preventDefault();
                          setPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        if (page < Math.ceil(totalKategori / pageSize)) setPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      {/* Tab: Statistik Sparepart */}
      {tab === "sparepart" && (
        <div className="space-y-3">
          {statistik.map((stat: any) => (
            <div key={stat.id_kategori_barang} className="bg-white rounded shadow p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{stat.nama_kategori || 'Tanpa Nama'}</div>
                <div className="text-sm text-gray-500">{stat.total_sparepart} sparepart terkait</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Tab: Statistik Penjualan */}
      {tab === "penjualan" && (
        <div className="space-y-3">
          {penjualanStat.map((stat: any) => (
            <div key={stat.id_kategori_barang} className="bg-white rounded shadow p-4">
              <div className="font-semibold text-lg">{stat.nama_kategori || 'Tanpa Nama'}</div>
              <div className="text-sm text-gray-500">Stok: {stat.total_stok} | Terjual: {stat.total_terjual} | Sisa: {stat.total_sisa}</div>
              {/* Progress bar visualisasi */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stat.total_stok ? (stat.total_terjual / stat.total_stok) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal Tambah/Edit Kategori */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded p-6 w-full max-w-sm" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">{modalType === "add" ? "Tambah Kategori" : "Edit Kategori"}</h2>
            <input
              type="text"
              className="border px-3 py-2 rounded w-full mb-4"
              placeholder="Nama kategori"
              value={namaKategori}
              onChange={e => setNamaKategori(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
            </div>
          </form>
        </div>
      )}
      {/* Drawer/Modal Detail Kategori */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Detail Kategori: {selectedDetail.nama_kategori || 'Tanpa Nama'}</h2>
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Daftar Merek:</div>
              <div className="flex flex-wrap gap-2">
                {merekList.length > 0 ? merekList.map((merek: any) => (
                  <span key={merek.id_merek} className="px-3 py-1 bg-gray-200 rounded-full text-sm">{merek.nama_merek}</span>
                )) : <span className="italic">Tidak ada merek</span>}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Statistik Sparepart:</div>
              <div>Total Sparepart: <span className="font-bold">{getJumlahSparepart(selectedDetail.id_kategori_barang)}</span></div>
            </div>
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Statistik Penjualan:</div>
              {(() => {
                const stat = getPenjualanStat(selectedDetail.id_kategori_barang);
                return (
                  <>
                    <div>Stok: <span className="font-bold">{stat.total_stok}</span></div>
                    <div>Terjual: <span className="font-bold">{stat.total_terjual}</span></div>
                    <div>Sisa: <span className="font-bold">{stat.total_sisa}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${stat.total_stok ? (stat.total_terjual / stat.total_stok) * 100 : 0}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KategoriBarangPage;
