/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect, useCallback } from "react";
import {
  getAllMerek,
  addMerek,
  updateMerek,
  deleteMerek,
  getSparepartStatByMerek,
  getKategoriBarangByMerek,
  searchMerek
} from "@/lib/api/merekHelper";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";

const MerekPage: React.FC = () => {
  const [merekList, setMerekList] = useState<any[]>([]);
  const [totalMerek, setTotalMerek] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedMerek, setSelectedMerek] = useState<any>(null);
  const [namaMerek, setNamaMerek] = useState("");
  const [token, setToken] = useState<string>("");
  const [statistik, setStatistik] = useState<any[]>([]);
  const [kategoriBarang, setKategoriBarang] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  // ...profile dihapus, tidak dipakai...
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

  // Wrapper API agar support pagination
  const getAllMerekPaginated = async (token: string, page: number, pageSize: number) => {
    const res = await getAllMerek(token);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: res.slice(start, end),
      meta: { total: res.length }
    };
  };

  const searchMerekPaginated = async (token: string, search: string, page: number, pageSize: number) => {
    const res = await searchMerek(token, search);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: res.slice(start, end),
      meta: { total: res.length }
    };
  };

  const fetchMerek = useCallback(async () => {
    if (!token) return;
    try {
      let result;
      if (search.length > 0) {
        result = await apiWithRefresh(
          (tok) => searchMerekPaginated(tok, search, page, pageSize),
          token,
          setToken,
          () => {},
          router
        );
      } else {
        result = await apiWithRefresh(
          (tok) => getAllMerekPaginated(tok, page, pageSize),
          token,
          setToken,
          () => {},
          router
        );
      }
      setMerekList(result.data);
      setTotalMerek(result.meta.total);
    } catch {
      setMerekList([]);
      setTotalMerek(0);
    }
  }, [token, search, page, pageSize, router]);

  const fetchStatistik = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        getSparepartStatByMerek,
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

  useEffect(() => {
    if (!token) return;
    fetchMerek();
    fetchStatistik();
  }, [token, fetchMerek, fetchStatistik]);


  const fetchKategoriBarang = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const data = await apiWithRefresh(
        (tok) => getKategoriBarangByMerek(tok, id),
        token,
        setToken,
        () => {},
        router
      );
      setKategoriBarang(data);
    } catch {
      setKategoriBarang([]);
    }
  }, [token, router]);

  const handleAdd = () => {
    setModalType("add");
    setNamaMerek("");
    setShowModal(true);
  };

  const handleEdit = (merek: any) => {
    setModalType("edit");
    setSelectedMerek(merek);
    setNamaMerek(merek.nama_merek);
    setShowModal(true);
  };

  const handleDetail = async (merek: any) => {
    setSelectedDetail(merek);
    fetchKategoriBarang(merek.id_merek);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin hapus merek ini?")) {
      try {
        await apiWithRefresh(
          (tok) => deleteMerek(tok, id),
          token,
          setToken,
          () => {},
          router
        );
        fetchMerek();
        fetchStatistik();
      } catch {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMerek.trim()) {
      alert("Nama merek wajib diisi!");
      return;
    }
    try {
      if (modalType === "add") {
        await apiWithRefresh(
          (tok) => addMerek(tok, namaMerek),
          token,
          setToken,
          () => {},   
          router
        );
      } else if (modalType === "edit" && selectedMerek) {
        await apiWithRefresh(
          (tok) => updateMerek(tok, selectedMerek.id_merek, namaMerek),
          token,
          setToken,
          () => {},
          router
        );
      }
      setShowModal(false);
      fetchMerek();
      fetchStatistik();
    } catch {}
  };

  // Statistik per merek
  const getJumlahSparepart = useCallback((id_merek: string) => {
    const stat = statistik.find((s: any) => s.id_merek === id_merek);
    return stat ? stat.total_sparepart : 0;
  }, [statistik]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header & Aksi Utama */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold bg-white px-6 py-2 rounded-xl shadow-lg border border-gray-200">Brand Barang</h1>
        <button className="bg-white text-black font-semibold px-6 py-2 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-100 transition" onClick={handleAdd}>
          ➕ Tambah Brand
        </button>
      </div>
      <div className="mb-6 flex items-center gap-2">
        <input
          type="text"
          className="border border-gray-200 bg-white px-4 py-2 rounded-xl w-full text-black placeholder:text-gray-500 shadow-lg"
          placeholder="Cari Brand..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-gray-500">🔍</span>
      </div>
      {/* List Card Merek */}
      <div className="space-y-4">
        {merekList.map((merek) => (
          <div key={merek.id_merek} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xl text-black">{merek.nama_merek}</div>
              <div className="text-sm text-gray-600">{getJumlahSparepart(merek.id_merek)} sparepart terkait</div>
            </div>
            <div className="flex gap-3">
              <button className="text-blue-600 hover:text-blue-800 text-xl" onClick={() => handleEdit(merek)} title="Edit">✏️</button>
              <button className="text-red-600 hover:text-red-800 text-xl" onClick={() => handleDelete(merek.id_merek)} title="Hapus">🗑️</button>
              <button className="text-gray-600 hover:text-gray-800 text-xl" onClick={() => handleDetail(merek)} title="Detail">🔎</button>
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex justify-center mt-8">
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
            {Array.from({ length: Math.ceil(totalMerek / pageSize) }, (_, i) => (
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
                  if (page < Math.ceil(totalMerek / pageSize)) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      {/* Modal Tambah/Edit Merek */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form className="bg-white rounded-xl p-8 w-full max-w-sm shadow-lg border border-gray-200" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-6 text-black">{modalType === "add" ? "Tambah Merek" : "Edit Merek"}</h2>
            <input
              type="text"
              className="border border-gray-200 bg-white px-4 py-2 rounded-xl w-full mb-6 text-black placeholder:text-gray-500 shadow-lg"
              placeholder="Nama merek"
              value={namaMerek}
              onChange={e => setNamaMerek(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded-xl bg-gray-100 text-black border border-gray-200" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-xl shadow-lg border border-gray-800">Simpan</button>
            </div>
          </form>
        </div>
      )}
      {/* Drawer/Modal Detail Merek */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-black">Detail Merek: {selectedDetail.nama_merek}</h2>
            <div className="mb-4">
              <div className="text-lg text-black font-semibold mb-2">Kategori Barang Terkait:</div>
              <ul className="list-disc pl-6 text-gray-700">
                {kategoriBarang.length > 0 ? kategoriBarang.map((kat: any) => (
                  <li key={kat.id_kategori_barang}>{kat.nama_kategori_barang}</li>
                )) : <li className="italic">Tidak ada kategori barang</li>}
              </ul>
            </div>
            <div className="mb-4">
              <div className="text-lg text-black font-semibold mb-2">Statistik Sparepart:</div>
              <div className="text-gray-700">Total Sparepart: <span className="font-bold">{getJumlahSparepart(selectedDetail.id_merek)}</span></div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerekPage;