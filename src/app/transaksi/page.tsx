/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// improve transaksi page
'use client'
import { useEffect, useState } from "react";
import { useGlobalLoading } from "../GlobalLoadingContext";
import React from "react";
import {
  getTransaksi,
  updateTransaksi,
  deleteTransaksi,
  exportTransaksiCSV,
  exportTransaksiExcel,
  cetakStrukTransaksi,
  getStrukHTML,
} from "@/lib/api/transaksiHelper";
import { apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getAllSparepart } from "@/lib/api/sparepartHelper";
import { getAllKategoriBarang } from "@/lib/api/kategoriBarangHelper";
import { FileText, BarChart3, Calendar, Search, Printer, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaksi {
  id_transaksi: string;
  tanggal: string;
  jumlah: number;
  harga_total: number;
  tipe: string;
  keterangan: string;
  tipe_pembayaran?: string;
  status_pembayaran?: string;
  due?: string;
  id_sparepart?: string; // Untuk transaksi format lama
  detail_barang?: Array<{
    id_sparepart: string;
    nama_barang?: string;
    jumlah: number;
    harga_satuan: number;
    harga_total: number;
    eceran: boolean;
  }>;
  sparepart?: { nama_barang: string; kategori?: string; kode_barang?: string } | null;
  user?: string;
}

export default function TransaksiPage() {
  const { loading, setLoading } = useGlobalLoading();
  
  // Konfirmasi hapus
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  // Export
  const [showExport, setShowExport] = useState(false);

  // Data
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [filteredTransaksi, setFilteredTransaksi] = useState<Transaksi[]>([]);
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Kembali ke 10 agar pagination muncul
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // Filter
  const [filterTipe, setFilterTipe] = useState("all");
  const [filterPembayaran, setFilterPembayaran] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });

  // Modal edit
  const [openEditForm, setOpenEditForm] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<Transaksi | null>(null);
  const [editForm, setEditForm] = useState({
    tanggal: "",
    jumlah: 0,
    harga_total: 0,
    tipe: "",
    keterangan: "",
    tipe_pembayaran: "",
    status_pembayaran: "",
    due: "",
  });

  // Modal detail
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailTransaksi, setDetailTransaksi] = useState<Transaksi | null>(null);

  // State untuk expand barang per row
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const router = useRouter();

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.access_token;
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      const data = await getTransaksi(token, {
        page: 1,
        limit: 1000 // Ambil data dalam jumlah besar
      });
      console.log("Response dari API:", data);
      
      // API mengembalikan { data: [...], total: number }
      let transaksiArray = [];
      if (data && Array.isArray(data.data)) {
        transaksiArray = data.data;
        console.log("Data loaded successfully, length:", data.data.length);
        console.log("Total records:", data.total);
        
        // Debug: cek struktur beberapa transaksi
        console.log("Sample transaksi structures:");
        data.data.slice(0, 5).forEach((trx: any, idx: number) => {
          console.log(`Transaksi ${idx + 1}:`, {
            id: trx.id_transaksi,
            detail_barang: trx.detail_barang,
            id_sparepart: trx.id_sparepart,
            has_detail: !!(trx.detail_barang && trx.detail_barang.length > 0),
            has_id_sparepart: !!trx.id_sparepart
          });
        });
      } else if (Array.isArray(data)) {
        transaksiArray = data;
        console.log("Data is direct array, length:", data.length);
      } else {
        console.error("Data transaksi tidak valid:", data);
        transaksiArray = [];
      }
      
      setTransaksiList(transaksiArray);
      setFilteredTransaksi(transaksiArray);
      setTotalData(transaksiArray.length);
      setTotalPages(Math.ceil(transaksiArray.length / limit));
    } catch (error) {
      console.error("Gagal memuat data transaksi:", error);
      toast.error("Gagal memuat data transaksi");
      setTransaksiList([]);
      setFilteredTransaksi([]);
    } finally {
      setLoading(false);
    }
  };

  // Load sparepart dan kategori
  const loadSparepartData = async () => {
    try {
      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.access_token;
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      const [sparepartData, kategoriData] = await Promise.all([
        getAllSparepart(token),
        getAllKategoriBarang(token),
      ]);
      
      console.log("Sparepart data loaded:", sparepartData);
      setSparepartList(Array.isArray(sparepartData) ? sparepartData : []);
      setKategoriList(Array.isArray(kategoriData) ? kategoriData : []);
    } catch (error) {
      console.error("Gagal memuat data sparepart/kategori:", error);
    }
  };

  // Filter transaksi
  const applyFilters = () => {
    let filtered = [...transaksiList];

    // Filter berdasarkan pencarian
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(trx =>
        trx.keterangan?.toLowerCase().includes(searchLower) ||
        trx.id_transaksi.toLowerCase().includes(searchLower)
      );
    }

    // Filter berdasarkan tipe
    if (filterTipe && filterTipe !== "all") {
      filtered = filtered.filter(trx => trx.tipe === filterTipe);
    }

    // Filter berdasarkan pembayaran
    if (filterPembayaran && filterPembayaran !== "all") {
      filtered = filtered.filter(trx => trx.tipe_pembayaran === filterPembayaran);
    }

    // Filter berdasarkan status
    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter(trx => trx.status_pembayaran === filterStatus);
    }

    // Filter berdasarkan tanggal
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(trx => {
        const trxDate = new Date(trx.tanggal);
        return trxDate >= dateRange.startDate! && trxDate <= dateRange.endDate!;
      });
    }

    setFilteredTransaksi(filtered);
    setTotalData(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  };

  // Handle edit
  const handleEdit = (transaksi: Transaksi) => {
    setSelectedTransaksi(transaksi);
    setEditForm({
      tanggal: transaksi.tanggal.split('T')[0], // Format YYYY-MM-DD untuk input date
      jumlah: transaksi.jumlah || 0,
      harga_total: transaksi.harga_total || 0,
      tipe: transaksi.tipe || "",
      keterangan: transaksi.keterangan || "",
      tipe_pembayaran: transaksi.tipe_pembayaran || "",
      status_pembayaran: transaksi.status_pembayaran || "",
      due: transaksi.due ? transaksi.due.split('T')[0] : "",
    });
    setOpenEditForm(true);
  };

  // Handle detail
  const handleDetail = (transaksi: Transaksi) => {
    setDetailTransaksi(transaksi);
    setOpenDetailModal(true);
  };

  // Handle expand barang
  const toggleExpandRow = (transaksiId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transaksiId)) {
      newExpanded.delete(transaksiId);
    } else {
      newExpanded.add(transaksiId);
    }
    setExpandedRows(newExpanded);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!selectedTransaksi) return;

    try {
      setLoading(true);

      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const token = user.access_token;

      if (!token) {
        router.push("/login");
        return;
      }

      // Cari index transaksi yang diedit pada filteredTransaksi sebelum update
      const idx = filteredTransaksi.findIndex(trx => trx.id_transaksi === selectedTransaksi.id_transaksi);
      const pageOfEdited = idx !== -1 ? Math.floor(idx / limit) + 1 : 1;

      await updateTransaksi(token, selectedTransaksi.id_transaksi, editForm);
      toast.success("Transaksi berhasil diupdate");
      setOpenEditForm(false);

      // Setelah update, reload data lalu setPage ke halaman transaksi yang diedit
      await loadData();
      setPage(pageOfEdited);
    } catch (error) {
      console.error("Gagal update transaksi:", error);
      toast.error("Gagal update transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.access_token;
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      await deleteTransaksi(token, deleteId);
      toast.success("Transaksi berhasil dihapus");
      setShowDeleteConfirm(false);
      loadData();
    } catch (error) {
      console.error("Gagal hapus transaksi:", error);
      toast.error("Gagal hapus transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = async (type: string) => {
    try {
      setLoading(true);
      
      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.access_token;
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      if (type === "csv") {
        await exportTransaksiCSV(token);
        toast.success("Export CSV berhasil");
      } else if (type === "excel") {
        await exportTransaksiExcel(token);
        toast.success("Export Excel berhasil");
      }
    } catch (error) {
      console.error("Gagal export:", error);
      toast.error("Gagal export data");
    } finally {
      setLoading(false);
    }
  };

  // Handle cetak struk
  const handleCetakStruk = async (id: string) => {
    try {
      setLoading(true);
      
      // Ambil token dari localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        router.push("/login");
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.access_token;
      
      if (!token) {
        router.push("/login");
        return;
      }
      
      // Gunakan getStrukHTML untuk mendapatkan HTML struk
      const strukHTML = await getStrukHTML(token, id);
      
      // Buat window baru untuk cetak
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(strukHTML);
        printWindow.document.close();
        
        // Tunggu content load lalu trigger print
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
        
        toast.success("Struk berhasil dicetak");
      } else {
        toast.error("Gagal membuka window cetak");
      }
    } catch (error) {
      console.error("Gagal cetak struk:", error);
      toast.error("Gagal cetak struk");
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilterTipe("all");
    setFilterPembayaran("all");
    setFilterStatus("all");
    setSearch("");
    setDateRange({ startDate: null, endDate: null });
    setFilteredTransaksi(transaksiList);
    setTotalData(transaksiList.length);
    setTotalPages(Math.ceil(transaksiList.length / limit));
    setPage(1);
  };

  // Pagination data
  const currentData = filteredTransaksi.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    const initializeData = async () => {
      // Load sparepart data terlebih dahulu
      await loadSparepartData();
      // Kemudian load transaksi data
      await loadData();
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, filterTipe, filterPembayaran, filterStatus, dateRange, transaksiList]);

  return (
    <div className="space-y-4 p-3 md:p-6 pb-28 md:pb-6">
      {/* Header - Mobile Optimized */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-white flex-shrink-0" />
              <div>
                <CardTitle className="text-lg md:text-xl font-bold text-white">
                  Data Transaksi
                </CardTitle>
                <p className="text-blue-100 text-sm md:text-base">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {/* Export Button - Mobile Friendly */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="bg-white text-blue-800 font-semibold px-4 py-2 rounded shadow border border-gray-200 hover:bg-gray-100 flex gap-2 items-center w-full sm:w-auto" 
                  onClick={() => setShowExport(!showExport)}
                >
                  <FileText size={16} /> Export
                </Button>
                {showExport && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-30">
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm" 
                      onClick={() => { setShowExport(false); handleExport("csv"); }}
                    >
                      Export CSV
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm" 
                      onClick={() => { setShowExport(false); handleExport("excel"); }}
                    >
                      Export Excel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6">
          {/* Filter Section - Mobile Responsive */}
          <div className="mb-4 space-y-3">
            {/* Search - Full width on mobile */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari berdasarkan keterangan atau ID transaksi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters - Grid layout for mobile */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <Select value={filterTipe} onValueChange={setFilterTipe}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="masuk">Masuk</SelectItem>
                    <SelectItem value="keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bayar</label>
                <Select value={filterPembayaran} onValueChange={setFilterPembayaran}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset</label>
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Reset Filter
                </Button>
              </div>
            </div>
          </div>

          {/* Stats - Mobile Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <BarChart3 size={16} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 truncate">Transaksi Hari Ini</p>
                    <p className="text-lg md:text-xl font-bold text-blue-600">
                      {(() => {
                        const today = new Date().toDateString();
                        return filteredTransaksi.filter(t => 
                          new Date(t.tanggal).toDateString() === today
                        ).length;
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <FileText size={16} className="text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 truncate">Pemasukan Hari Ini</p>
                    <p className="text-lg md:text-xl font-bold text-green-600 truncate">
                      Rp {(() => {
                        const today = new Date().toDateString();
                        const total = filteredTransaksi
                          .filter(t => t.tipe === "keluar" && new Date(t.tanggal).toDateString() === today)
                          .reduce((sum, t) => sum + t.harga_total, 0);
                        return total.toLocaleString();
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <Calendar size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 truncate">Barang Masuk</p>
                    <p className="text-lg md:text-xl font-bold text-orange-600">
                      {(() => {
                        const today = new Date().toDateString();
                        return filteredTransaksi
                          .filter(t => t.tipe === "masuk" && new Date(t.tanggal).toDateString() === today)
                          .reduce((sum, t) => sum + t.jumlah, 0);
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <Calendar size={16} className="text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-600 truncate">Barang Keluar</p>
                    <p className="text-lg md:text-xl font-bold text-purple-600">
                      {(() => {
                        const today = new Date().toDateString();
                        return filteredTransaksi
                          .filter(t => t.tipe === "keluar" && new Date(t.tanggal).toDateString() === today)
                          .reduce((sum, t) => sum + t.jumlah, 0);
                      })()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {currentData.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">Tidak ada data transaksi</p>
                  <p className="text-sm">Belum ada transaksi untuk ditampilkan</p>
                </CardContent>
              </Card>
            ) : (
              currentData.map((trx, idx) => (
                <Card key={trx.id_transaksi} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          #{(page - 1) * limit + idx + 1}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trx.tipe === "masuk" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {trx.tipe?.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const d = new Date(trx.tanggal);
                            return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                          })()}
                        </p>
                        <p className="text-sm font-semibold">
                          {trx.tipe === "masuk" ? "Rp 0" : `Rp ${trx.harga_total.toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="mb-3">
                      {(() => {
                        if (trx.detail_barang && trx.detail_barang.length > 0) {
                          const firstItem = trx.detail_barang[0];
                          const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                          const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item 1`;
                          
                          return (
                            <div className="space-y-2">
                              <div className="bg-gray-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-sm">{namaBarang}</p>
                                    <p className="text-xs text-gray-500">
                                      {firstItem.jumlah}x @ Rp {firstItem.harga_satuan?.toLocaleString() || '0'}
                                      {firstItem.eceran && <span className="text-orange-600 ml-1">(E)</span>}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {trx.detail_barang.length > 1 && (
                                <p className="text-xs text-blue-600 font-medium">
                                  +{trx.detail_barang.length - 1} item lainnya
                                </p>
                              )}
                            </div>
                          );
                        } else if (trx.id_sparepart) {
                          const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === trx.id_sparepart);
                          const namaBarang = sparepartInfo?.nama_barang || 'Barang Tidak Ditemukan';
                          
                          return (
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="font-medium text-sm">{namaBarang}</p>
                              <p className="text-xs text-gray-500">
                                {trx.jumlah}x @ Rp {(trx.harga_total / trx.jumlah).toLocaleString()}
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="font-medium text-sm text-gray-400">
                                {trx.keterangan || 'Transaksi tanpa detail barang'}
                              </p>
                              <p className="text-xs text-gray-500">Data tidak tersedia</p>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Payment Info */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Pembayaran</p>
                        <p className="text-sm font-medium">
                          {trx.tipe_pembayaran ? 
                            trx.tipe_pembayaran.charAt(0).toUpperCase() + trx.tipe_pembayaran.slice(1) 
                            : '-'
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Status</p>
                        {trx.tipe_pembayaran === 'cash' ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            Lunas
                          </span>
                        ) : trx.tipe_pembayaran === 'kredit' ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            trx.status_pembayaran === 'lunas' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {trx.status_pembayaran ? 
                              trx.status_pembayaran.charAt(0).toUpperCase() + trx.status_pembayaran.slice(1) 
                              : '-'
                            }
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleDetail(trx)}
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleEdit(trx)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => {
                          setDeleteId(trx.id_transaksi);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-8">No</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Tanggal</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-36 max-w-[9rem]">Barang</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-10">Jml</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Total</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-12">Tipe</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Pembayaran</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-12">Status</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-32 max-w-[8rem]">Keterangan</TableHead>
                  <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Tidak ada data transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((trx, idx) => (
                    <TableRow
                      key={trx.id_transaksi}
                      className="hover:bg-gray-50 transition-colors text-xs"
                    >
                      <TableCell className="px-1 py-1 text-center w-8">{(page - 1) * limit + idx + 1}</TableCell>
                      <TableCell className="px-1 py-1 text-center w-16">{(() => {const d = new Date(trx.tanggal);return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`})()}</TableCell>
                      <TableCell className="px-1 py-1 text-left w-32">
                        {/* Tampilkan detail barang dengan expand/collapse */}
                        {(() => {
                          const isExpanded = expandedRows.has(trx.id_transaksi);
                          
                          if (trx.detail_barang && trx.detail_barang.length > 0) {
                            // Format baru: ada array detail_barang
                            const firstItem = trx.detail_barang[0];
                            const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === firstItem.id_sparepart);
                            const namaBarang = firstItem.nama_barang || sparepartInfo?.nama_barang || `Item 1`;
                            
                            return (
                              <div className="space-y-1">
                                {/* Item pertama selalu ditampilkan */}
                                <div className="text-xs">
                                  <div className="font-medium truncate" title={namaBarang}>
                                    {namaBarang.length > 20 ? namaBarang.substring(0, 20) + '...' : namaBarang}
                                  </div>
                                  <div className="text-gray-500">
                                    {firstItem.jumlah}x @ Rp {firstItem.harga_satuan?.toLocaleString() || '0'}
                                    {firstItem.eceran && <span className="text-orange-600 ml-1">(E)</span>}
                                  </div>
                                </div>
                                
                                {/* Items lainnya jika expanded */}
                                {isExpanded && trx.detail_barang.slice(1).map((item: any, index: number) => {
                                  const itemSparepartInfo = sparepartList.find(sp => sp.id_sparepart === item.id_sparepart);
                                  const itemNamaBarang = item.nama_barang || itemSparepartInfo?.nama_barang || `Item ${index + 2}`;
                                  
                                  return (
                                    <div key={index + 1} className="text-xs border-t pt-1">
                                      <div className="font-medium truncate" title={itemNamaBarang}>
                                        {itemNamaBarang.length > 20 ? itemNamaBarang.substring(0, 20) + '...' : itemNamaBarang}
                                      </div>
                                      <div className="text-gray-500">
                                        {item.jumlah}x @ Rp {item.harga_satuan?.toLocaleString() || '0'}
                                        {item.eceran && <span className="text-orange-600 ml-1">(E)</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {/* Tombol expand jika ada lebih dari 1 item */}
                                {trx.detail_barang.length > 1 && (
                                  <button
                                    onClick={() => toggleExpandRow(trx.id_transaksi)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                                  >
                                    {isExpanded ? '▲ Tutup' : `▼ +${trx.detail_barang.length - 1} lainnya`}
                                  </button>
                                )}
                              </div>
                            );
                          } else if (trx.id_sparepart) {
                            // Format lama: hanya ada id_sparepart
                            const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === trx.id_sparepart);
                            const namaBarang = sparepartInfo?.nama_barang || 'Barang Tidak Ditemukan';
                            
                            return (
                              <div className="text-xs">
                                <div className="font-medium truncate" title={namaBarang}>
                                  {namaBarang.length > 20 ? namaBarang.substring(0, 20) + '...' : namaBarang}
                                </div>
                                <div className="text-gray-500">
                                  {trx.jumlah}x @ Rp {(trx.harga_total / trx.jumlah).toLocaleString()}
                                </div>
                              </div>
                            );
                          } else {
                            // Tidak ada data barang sama sekali
                            const keterangan = trx.keterangan || 'Transaksi tanpa detail barang';
                            return (
                              <div className="text-xs">
                                <div className="font-medium text-gray-400 truncate" title={keterangan}>
                                  {keterangan.length > 20 ? keterangan.substring(0, 20) + '...' : keterangan}
                                </div>
                                <div className="text-gray-500">Data tidak tersedia</div>
                              </div>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell className="px-1 py-1 text-center w-10">{trx.jumlah}</TableCell>
                      <TableCell className="px-1 py-1 text-center w-16">
                        {trx.tipe === "masuk" ? "Rp 0" : `Rp ${trx.harga_total.toLocaleString()}`}
                      </TableCell>
                      <TableCell className="px-1 py-1 text-center w-12">
                        <span className={`px-1 py-0.5 rounded-full text-[10px] font-medium ${trx.tipe === "masuk" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{trx.tipe}</span>
                      </TableCell>
                      <TableCell className="px-1 py-1 text-center w-16">
                        {trx.tipe_pembayaran
                          ? trx.tipe_pembayaran.charAt(0).toUpperCase() + trx.tipe_pembayaran.slice(1)
                          : <span className="text-yellow-400">-</span>
                        }
                      </TableCell>
                      <TableCell className="px-1 py-1 text-center w-12">
                        {trx.tipe_pembayaran === 'cash' ? (
                          <span className="px-1 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Lunas</span>
                        ) : trx.tipe_pembayaran === 'kredit' ? (
                          <span className={`px-1 py-0.5 rounded-full text-[10px] font-bold ${trx.status_pembayaran === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{trx.status_pembayaran ? trx.status_pembayaran.charAt(0).toUpperCase() + trx.status_pembayaran.slice(1) : '-'}</span>
                        ) : (
                          <span className="text-yellow-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-1 py-1 text-left w-32 max-w-[8rem]">
                        <span className="truncate block" title={trx.keterangan || '-'}>
                          {trx.keterangan && trx.keterangan.length > 40 ? trx.keterangan.slice(0, 40) + '…' : (trx.keterangan || '-')}
                        </span>
                      </TableCell>
                      <TableCell className="px-1 py-1 text-center w-20">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] px-1 py-0.5 h-6"
                            onClick={() => handleDetail(trx)}
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] px-1 py-0.5 h-6"
                            onClick={() => handleEdit(trx)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-[10px] px-1 py-0.5 h-6"
                            onClick={() => {
                              setDeleteId(trx.id_transaksi);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalData > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3 md:gap-0">
              <p className="text-xs md:text-sm text-gray-600 order-2 md:order-1">
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, totalData)} dari {totalData} data
              </p>
              <div className="flex items-center gap-2 order-1 md:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs px-3 py-2"
                >
                  <ChevronLeft size={14} className="md:hidden" />
                  <span className="hidden md:inline">Sebelumnya</span>
                </Button>
                <span className="px-3 py-2 text-sm bg-gray-100 rounded border min-w-[80px] text-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs px-3 py-2"
                >
                  <ChevronRight size={14} className="md:hidden" />
                  <span className="hidden md:inline">Selanjutnya</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Edit Transaksi */}
      <Dialog open={openEditForm} onOpenChange={setOpenEditForm}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Edit Transaksi
            </DialogTitle>
          </DialogHeader>
          {selectedTransaksi && (
            <div className="space-y-4 py-4">
              {/* Info Read-only */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <span className="ml-2 text-gray-600">{selectedTransaksi.id_transaksi.slice(0, 8)}...</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">User:</span>
                    <span className="ml-2 text-gray-600">{selectedTransaksi.user || 'System'}</span>
                  </div>
                </div>
              </div>

              {/* Form Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tanggal</label>
                  <Input
                    type="date"
                    value={editForm.tanggal}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tipe</label>
                  <Select value={editForm.tipe} onValueChange={(val) => setEditForm(prev => ({ ...prev, tipe: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masuk">Masuk</SelectItem>
                      <SelectItem value="keluar">Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Jumlah</label>
                  <Input
                    type="number"
                    value={editForm.jumlah}
                    onChange={(e) => setEditForm(prev => ({ ...prev, jumlah: Number(e.target.value) }))}
                    placeholder="Jumlah barang"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Harga Total</label>
                  <Input
                    type="number"
                    value={editForm.harga_total}
                    onChange={(e) => setEditForm(prev => ({ ...prev, harga_total: Number(e.target.value) }))}
                    placeholder="Harga total"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Keterangan</label>
                <Input
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Keterangan transaksi"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Tipe Pembayaran</label>
                <Select value={editForm.tipe_pembayaran} onValueChange={(val) => setEditForm(prev => ({ ...prev, tipe_pembayaran: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editForm.tipe_pembayaran === 'kredit' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Status Pembayaran</label>
                    <Select value={editForm.status_pembayaran} onValueChange={(val) => setEditForm(prev => ({ ...prev, status_pembayaran: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lunas">Lunas</SelectItem>
                        <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Tanggal Jatuh Tempo</label>
                    <Input
                      type="date"
                      value={editForm.due}
                      onChange={(e) => setEditForm(prev => ({ ...prev, due: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpenEditForm(false)}>
                  Batal
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleUpdate}>
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Detail Transaksi */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          {detailTransaksi && (
            <div className="space-y-4 py-4">
              {/* Info Transaksi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">ID Transaksi</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{detailTransaksi.id_transaksi}</p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tanggal</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {new Date(detailTransaksi.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tipe</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      detailTransaksi.tipe === "masuk" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {detailTransaksi.tipe?.toUpperCase()}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Total Harga</label>
                  <p className="text-sm bg-gray-50 p-2 rounded font-semibold">
                    {detailTransaksi.tipe === "masuk" ? "Rp 0 (Retur/Pengembalian)" : `Rp ${detailTransaksi.harga_total.toLocaleString()}`}
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tipe Pembayaran</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {detailTransaksi.tipe_pembayaran ? 
                      detailTransaksi.tipe_pembayaran.charAt(0).toUpperCase() + detailTransaksi.tipe_pembayaran.slice(1) 
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Status Pembayaran</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {detailTransaksi.tipe_pembayaran === 'cash' ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Lunas</span>
                    ) : detailTransaksi.status_pembayaran ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        detailTransaksi.status_pembayaran === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {detailTransaksi.status_pembayaran.charAt(0).toUpperCase() + detailTransaksi.status_pembayaran.slice(1)}
                      </span>
                    ) : '-'}
                  </p>
                </div>
              </div>

              {/* Due Date untuk Kredit */}
              {detailTransaksi.tipe_pembayaran === 'kredit' && detailTransaksi.due && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Tanggal Jatuh Tempo</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {new Date(detailTransaksi.due).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}

              {/* Keterangan */}
              {detailTransaksi.keterangan && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Keterangan</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{detailTransaksi.keterangan}</p>
                </div>
              )}

              {/* Detail Barang */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Detail Barang</label>
                <div className="border rounded-lg overflow-hidden">
                  {detailTransaksi.detail_barang && detailTransaksi.detail_barang.length > 0 ? (
                    <div className="space-y-2 p-3">
                      {detailTransaksi.detail_barang.map((item: any, index: number) => {
                        const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === item.id_sparepart);
                        const namaBarang = item.nama_barang || sparepartInfo?.nama_barang || `Item ${index + 1}`;
                        
                        return (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <p className="font-medium text-sm">{namaBarang}</p>
                              <p className="text-xs text-gray-500">
                                {item.jumlah}x @ Rp {item.harga_satuan?.toLocaleString() || '0'}
                                {item.eceran && <span className="text-orange-600 ml-1">(Eceran)</span>}
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              Rp {item.harga_total?.toLocaleString() || '0'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : detailTransaksi.id_sparepart ? (
                    <div className="p-3">
                      {(() => {
                        const sparepartInfo = sparepartList.find(sp => sp.id_sparepart === detailTransaksi.id_sparepart);
                        return (
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <p className="font-medium text-sm">
                                {sparepartInfo?.nama_barang || 'Barang Tidak Ditemukan'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {detailTransaksi.jumlah}x @ {detailTransaksi.tipe === "masuk" ? "Rp 0" : `Rp ${(detailTransaksi.harga_total / detailTransaksi.jumlah).toLocaleString()}`}
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              {detailTransaksi.tipe === "masuk" ? "Rp 0" : `Rp ${detailTransaksi.harga_total.toLocaleString()}`}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      <p>Data barang tidak tersedia</p>
                      <p className="text-xs mt-1">{detailTransaksi.keterangan || 'Transaksi tanpa detail barang'}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Tombol Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="flex gap-2 order-1 sm:order-2">
                  {/* HTML Print Button (existing) */}
                  <button 
                    className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors duration-200" 
                    onClick={() => handleCetakStruk(detailTransaksi.id_transaksi)}
                  >
                    <Printer size={16} />
                    Cetak Struk
                  </button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none order-2 sm:order-1" 
                  onClick={() => setOpenDetailModal(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus transaksi ini?</p>
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
              Batal
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}