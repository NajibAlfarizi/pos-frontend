/* eslint-disable prefer-const */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// improve transaksi page
'use client'
import { useEffect, useState } from "react";
import {
  getTransaksi,
  addTransaksi,
  updateTransaksi,
  deleteTransaksi,
  exportTransaksiCSV,
  exportTransaksiExcel,
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
import { FileText, PlusCircle, BarChart3, Calendar, Search } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

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
  sparepart?: { nama_barang: string; kategori?: string } | null;
  user?: string;
}

export default function TransaksiPage() {
  // Konfirmasi hapus
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string>("");
  // State untuk modal edit
  const [openEditForm, setOpenEditForm] = useState(false);
  const [editBarang, setEditBarang] = useState<string>("");
  const [editJumlah, setEditJumlah] = useState<number>(1);
  const [editKeterangan, setEditKeterangan] = useState<string>("");
  const [editTipe, setEditTipe] = useState<string>("masuk");
  const [editId, setEditId] = useState<string>("");
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [data, setData] = useState<Transaksi[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [filterDari, setFilterDari] = useState<string>("");
  const [filterSampai, setFilterSampai] = useState<string>("");
  const [filterKategori, setFilterKategori] = useState<string>("");
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [formBarang, setFormBarang] = useState<string>("");
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formKeterangan, setFormKeterangan] = useState<string>("");
  const [formTipe, setFormTipe] = useState<string>("masuk");
  const [formKategori, setFormKategori] = useState<string>("");
  const [formMerek, setFormMerek] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<Transaksi | null>(null);
  // Faktur preview
  const [openFakturPreview, setOpenFakturPreview] = useState(false);
  const [fakturData, setFakturData] = useState<Transaksi | null>(null);
  const [token, setToken] = useState<string>("");
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [showExport, setShowExport] = useState(false);
  // State untuk autocomplete barang filter
  const [filterBarangQuery, setFilterBarangQuery] = useState("");
  const filteredBarangFilter = filterBarangQuery.trim() === ""
    ? sparepartList
    : sparepartList.filter(sp =>
        sp.nama_barang.toLowerCase().includes(filterBarangQuery.toLowerCase())
      );
  // State untuk date range picker
  const [dateRange, setDateRange] = useState<{from: string, to: string}>({from: "", to: ""});
  const router = useRouter();
  // State untuk pembayaran
  const [formTipePembayaran, setFormTipePembayaran] = useState<string>("cash");
  const [formDue, setFormDue] = useState<string>("");
  const [editTipePembayaran, setEditTipePembayaran] = useState<string>("cash");
  const [editStatusPembayaran, setEditStatusPembayaran] = useState<string>("belum lunas");
  const [editDue, setEditDue] = useState<string>("");
  // Fetch sparepart & kategori list for filter dropdown
  useEffect(() => {
    if (!token) return;
    const fetchSparepartKategori = async () => {
      try {
        const res = await apiWithRefresh(getAllSparepart, token, setToken, () => {}, router);
        setSparepartList(Array.isArray(res) ? res : []);
      } catch {
        setSparepartList([]);
      }
      try {
        const kategori = await apiWithRefresh(getAllKategoriBarang, token, setToken, () => {}, router);
        setKategoriList(Array.isArray(kategori) ? kategori : []);
      } catch {
        setKategoriList([]);
      }
    };
    fetchSparepartKategori();
  }, [token, router]);

  useEffect(() => {
    // Ambil token dari localStorage (user.access_token)
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const sendFilters = { ...filters };
      if (sendFilters.tipe === "all") delete sendFilters.tipe;
      // Kirim filter tanggal ke backend
      if (filterDari) sendFilters.tanggal_mulai = filterDari;
      if (filterSampai) {
        // Pastikan tanggal_selesai mencakup seluruh hari (jam 23:59:59)
        const endDate = new Date(filterSampai);
        endDate.setHours(23, 59, 59, 999);
        // Format ke yyyy-MM-ddTHH:mm:ss agar backend tetap bisa filter
        const formattedEnd = `${endDate.getFullYear()}-${String(endDate.getMonth()+1).padStart(2,'0')}-${String(endDate.getDate()).padStart(2,'0')}T23:59:59`;
        sendFilters.tanggal_selesai = formattedEnd;
      }
      // Kirim filter kategori jika ada
      if (filterKategori) sendFilters.kategori = filterKategori;
      const res = await apiWithRefresh(
        (tok) => getTransaksi(tok, { ...sendFilters, page, limit }),
        token,
        setToken,
        () => {},
        router
      );
      setData(res.data);
      setTotal(res.total);
    } catch (e) {
      toast.error("Gagal memuat transaksi");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, page, filters]);

  const handleDelete = async (id: string) => {
    try {
      await apiWithRefresh(
        (tok) => deleteTransaksi(tok, id),
        token,
        setToken,
        () => {},
        router
      );
      toast.success("Transaksi dihapus");
      setShowDeleteConfirm(false);
      setDeleteId("");
      fetchData();
    } catch {
      toast.error("Gagal menghapus transaksi");
    }
  };

  // Handler untuk buka modal edit dan isi data
  const openEditModal = (trx: Transaksi) => {
    setEditId(trx.id_transaksi);
    setEditBarang(trx.sparepart?.nama_barang ? (sparepartList.find(sp => sp.nama_barang === trx.sparepart?.nama_barang)?.id_sparepart || "") : "");
    setEditJumlah(trx.jumlah);
    setEditKeterangan(trx.keterangan || "");
    setEditTipe(trx.tipe);
    setEditTipePembayaran(trx.tipe_pembayaran || "cash");
    setEditStatusPembayaran(trx.status_pembayaran || "belum lunas");
    setEditDue(trx.due || "");
    setOpenEditForm(true);
  };

  // Hitung harga total edit
  const getEditHargaTotal = () => {
    const sparepart = sparepartList.find(sp => sp.id_sparepart === editBarang);
    if (!sparepart || editJumlah <= 0) return 0;
    if (editTipe === "masuk") {
      return editJumlah * (sparepart.harga_modal ?? 0);
    } else {
      return editJumlah * (sparepart.harga_jual ?? 0);
    }
  };

  // Handler update transaksi
  const handleEditTransaksi = async () => {
    setShowEditConfirm(false);
    if (!editBarang || editJumlah <= 0 || !editTipe || !editTipePembayaran) {
      toast.error("Barang, jumlah, tipe, dan tipe pembayaran wajib diisi");
      return;
    }
    if (editTipePembayaran === "kredit" && !editDue) {
      toast.error("Due wajib diisi jika pembayaran kredit");
      return;
    }
    const harga_total = getEditHargaTotal();
    try {
      await apiWithRefresh(
        (tok) => updateTransaksi(tok, editId, {
          id_sparepart: editBarang,
          jumlah: editJumlah,
          tipe: editTipe,
          harga_total,
          keterangan: editKeterangan,
          tipe_pembayaran: editTipePembayaran,
          status_pembayaran: editStatusPembayaran,
          due: editTipePembayaran === "kredit" ? editDue : null,
        }),
        token,
        setToken,
        () => {},
        router
      );
      toast.success("Transaksi berhasil diupdate");
      setOpenEditForm(false);
      setEditBarang("");
      setEditJumlah(1);
      setEditKeterangan("");
      setEditTipe("masuk");
      setEditId("");
      setEditTipePembayaran("cash");
      setEditStatusPembayaran("belum lunas");
      setEditDue("");
      fetchData();
    } catch {
      toast.error("Gagal update transaksi");
    }
  };


  // Modal tambah transaksi
  // Hitung harga total otomatis sesuai logic backend
  const getHargaTotal = () => {
    const sparepart = sparepartList.find(sp => sp.id_sparepart === formBarang);
    if (!sparepart || formJumlah <= 0) return 0;
    if (formTipe === "masuk") {
      // Barang masuk, harga total = harga_modal x jumlah
      return formJumlah * (sparepart.harga_modal ?? 0);
    } else {
      // Barang keluar, harga total = harga jual x jumlah
      return formJumlah * (sparepart.harga_jual ?? 0);
    }
  };

  const handleTambahTransaksi = async () => {
    setShowConfirm(false);
    if (!formBarang || formJumlah <= 0 || !formTipe || !formTipePembayaran) {
      toast.error("Barang, jumlah, tipe, dan tipe pembayaran wajib diisi");
      return;
    }
    if (formTipePembayaran === "kredit" && !formDue) {
      toast.error("Due wajib diisi jika pembayaran kredit");
      return;
    }
    const harga_total = getHargaTotal();
    try {
      const trx = await apiWithRefresh(
        (tok) => addTransaksi(tok, {
          id_sparepart: formBarang,
          jumlah: formJumlah,
          tipe: formTipe,
          harga_total,
          keterangan: formKeterangan,
          tipe_pembayaran: formTipePembayaran,
          status_pembayaran: "belum lunas",
          due: formTipePembayaran === "kredit" ? formDue : null,
        }),
        token,
        setToken,
        () => {},
        router
      );
      toast.success("Transaksi berhasil ditambah");
      setOpenForm(false);
      setFormBarang("");
      setFormJumlah(1);
      setFormKeterangan("");
      setFormTipe("masuk");
      setFormTipePembayaran("cash");
      setFormDue("");
      fetchData();
      // Set faktur data dan buka preview
      setFakturData({
        ...trx,
        sparepart: sparepartList.find(sp => sp.id_sparepart === formBarang) || null
      });
      setOpenFakturPreview(true);
    } catch {
      toast.error("Gagal tambah transaksi");
    }
  };

  // Export handler (fix broken block)
  const handleExport = async (type: "csv" | "excel") => {
    try {
      const fn = type === "csv" ? exportTransaksiCSV : exportTransaksiExcel;
      const blob = await apiWithRefresh(
        (tok) => fn(tok, filters),
        token,
        setToken,
        () => {},
        router
      );
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `transaksi.${type === "csv" ? "csv" : "xlsx"}`;
      a.click();
    } catch {
      toast.error("Gagal export");
    }
  };

  // Integrasi dateRange ke filter
  useEffect(() => {
    setFilterDari(dateRange.from);
    setFilterSampai(dateRange.to);
  }, [dateRange]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 space-y-4 bg-white">
      {/* Header & Sticky Action Bar */}
      <div className="sticky top-0 z-20 bg-white pb-2 mb-2 shadow-sm border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold bg-white px-2 py-2 rounded-xl">Manajemen Transaksi</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2 items-center font-bold shadow" onClick={() => setOpenForm(true)}>
              <PlusCircle size={18} /> Tambah Transaksi
            </Button>
            {/* Export Dropdown */}
            <div className="relative">
              <Button variant="outline" className="bg-white text-black font-semibold px-4 py-2 rounded shadow border border-gray-200 hover:bg-gray-100 flex gap-2 items-center" onClick={() => setShowExport(!showExport)}>
                <FileText size={16} /> Export
              </Button>
              {showExport && (
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-30">
                  <button className="w-full text-left px-4 py-2 hover:bg-blue-50" onClick={() => { setShowExport(false); handleExport("csv"); }}>Export CSV</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-blue-50" onClick={() => { setShowExport(false); handleExport("excel"); }}>Export Excel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter - modern design dengan DatePicker */}
<Card className="shadow-md border rounded-xl bg-white">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg font-bold">Filter</CardTitle>
  </CardHeader>
  <CardContent>
    <form
      className="flex flex-wrap gap-3 items-center md:flex-row md:gap-3 sm:flex-col sm:gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        fetchData()
      }}
    >
      {/* Kategori */}
      <Select
        value={filterKategori || "all"}
        onValueChange={(val) => setFilterKategori(val === "all" ? "" : val)}
      >
        <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2">
          <SelectValue placeholder="Kategori Barang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kategori</SelectItem>
          {kategoriList.map((kat) => (
            <SelectItem key={kat.id_kategori_barang} value={kat.id_kategori_barang}>
              {kat.nama_kategori}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipe */}
      <Select
        value={filters.tipe || ""}
        onValueChange={(val) => setFilters({ ...filters, tipe: val })}
      >
        <SelectTrigger className="w-[120px] bg-gray-50 border rounded-lg px-3 py-2">
          <SelectValue placeholder="Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua</SelectItem>
          <SelectItem value="masuk">Masuk</SelectItem>
          <SelectItem value="keluar">Keluar</SelectItem>
        </SelectContent>
      </Select>

      {/* Autocomplete Barang */}
      <div className="relative w-[180px]">
        <Input
          type="text"
          value={filterBarangQuery}
          onChange={(e) => setFilterBarangQuery(e.target.value)}
          placeholder="Cari barang..."
          className="bg-gray-50 border rounded-lg px-3 py-2 pr-8"
        />
        <Search size={16} className="absolute right-2 top-2 text-gray-400" />
        {filterBarangQuery && (
          <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-auto mt-1">
            {filteredBarangFilter.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">Barang tidak ditemukan</div>
            ) : (
              filteredBarangFilter.map((sp) => (
                <div
                  key={sp.id_sparepart}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    setFilters({ ...filters, id_sparepart: sp.id_sparepart })
                    setFilterBarangQuery(sp.nama_barang)
                  }}
                >
                  {sp.nama_barang}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Date Range pakai DatePicker */}
      <div className="flex items-center gap-2 w-[280px]">
        <DatePicker
          value={dateRange.from ? new Date(dateRange.from) : null}
          onChange={(val: Date | null) =>
            setDateRange({ ...dateRange, from: val?.toISOString().split("T")[0] || "" })
          }
          placeholder="Dari"
        />
        <span className="text-gray-500">-</span>
        <DatePicker
          value={dateRange.to ? new Date(dateRange.to) : null}
          onChange={(val: Date | null) =>
            setDateRange({ ...dateRange, to: val?.toISOString().split("T")[0] || "" })
          }
          placeholder="Sampai"
        />
      </div>

      {/* Tombol Apply & Reset */}
      <div className="flex gap-2 ml-auto">
        <Button
          type="submit"
          size="sm"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
        >
          Apply
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="px-4 py-2 rounded-lg"
          onClick={() => {
            setFilters({})
            setFilterKategori("")
            setFilterBarangQuery("")
            setDateRange({ from: "", to: "" })
            setPage(1)
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  </CardContent>
</Card>

      {/* Tabel */}
      <Card className="bg-white rounded-xl shadow border mt-3">
        <CardContent>
    {loading ? (
      <div className="w-full flex items-center justify-center py-8">
        <span className="text-gray-500 text-sm">Loading data transaksi...</span>
      </div>
    ) : data.length === 0 ? (
      <div className="w-full flex items-center justify-center py-8">
        <span className="text-gray-500 text-sm">Belum ada data transaksi.</span>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table className="w-full text-sm border-collapse">
          <TableHeader>
              <TableRow className="bg-gray-100 border-b text-xs">
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-8">No</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Tanggal</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-20">Barang</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Kategori</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-10">Jml</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Total</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-12">Tipe</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Pembayaran</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-12">Status</TableHead>
                <TableHead className="px-2 py-1 text-center font-semibold text-gray-700 w-16">Aksi</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((trx, idx) => (
              <TableRow
                key={trx.id_transaksi}
                className="hover:bg-gray-50 transition-colors text-xs"
              >
                <TableCell className="px-1 py-1 text-center w-8">{(page - 1) * limit + idx + 1}</TableCell>
                <TableCell className="px-1 py-1 text-center w-16">{(() => {const d = new Date(trx.tanggal);return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`})()}</TableCell>
                <TableCell className="px-1 py-1 text-center w-20 truncate" title={trx.sparepart?.nama_barang}>{trx.sparepart?.nama_barang || "-"}</TableCell>
                <TableCell className="px-1 py-1 text-center w-16 truncate" title={trx.sparepart?.kategori}>{trx.sparepart?.kategori || "-"}</TableCell>
                <TableCell className="px-1 py-1 text-center w-10">{trx.jumlah}</TableCell>
                <TableCell className="px-1 py-1 text-center w-16">Rp {trx.harga_total.toLocaleString()}</TableCell>
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
                <TableCell className="px-1 py-1 text-center w-16">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 px-1 py-0 hover:bg-blue-50 text-[10px]"
                      onClick={() => {
                        setFakturData({ ...trx })
                        setOpenFakturPreview(true)
                      }}
                    >
                      Lihat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-600 px-1 py-0 hover:bg-gray-50 text-[10px]"
                      onClick={() => openEditModal(trx)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="px-1 py-0 hover:bg-red-600 text-[10px]"
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
            ))}
          </TableBody>
        </Table>
      </div>
    )}

    {/* Pagination */}
    <div className="flex justify-between items-center mt-4 px-2">
      <Button
        disabled={page === 1}
        variant="outline"
        size="sm"
        onClick={() => setPage(page - 1)}
      >
        Prev
      </Button>
      <span className="text-sm font-medium text-gray-700">
        Page {page}
      </span>
      <Button
        disabled={page * limit >= total}
        variant="outline"
        size="sm"
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
        </CardContent>
      </Card>
      {/* Modal Tambah Transaksi */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Tambah Transaksi
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Lengkapi detail transaksi dengan benar sebelum menyimpan.
            </p>
          </DialogHeader>
          <form
            className="space-y-5 py-2"
            onSubmit={e => {
              e.preventDefault();
              setShowConfirm(true);
            }}
          >
            {/* Pilih Kategori dan Merek sebelum cari barang */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Kategori Barang</label>
                <Select value={formKategori || "none"} onValueChange={val => setFormKategori(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih Kategori</SelectItem>
                    {kategoriList.map((kat, idx) => (
                      <SelectItem key={kat.id_kategori_barang ? String(kat.id_kategori_barang) : `kat-${idx}`} value={kat.id_kategori_barang}>{kat.nama_kategori}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Merek</label>
                <Select value={formMerek || "none"} onValueChange={val => setFormMerek(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Merek" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih Merek</SelectItem>
                    {/* Ambil merek dari sparepartList yang sesuai kategori, pastikan key unik dan tidak duplikat */}
                    {(() => {
                      // Filter sparepart sesuai kategori yang dipilih
                      const filtered = sparepartList.filter(sp => sp.id_kategori_barang === formKategori);
                      // Ambil semua merek unik
                      const merekSet = new Set<string>();
                      filtered.forEach(sp => {
                        let merekStr = "";
                        if (typeof sp.merek === "object" && sp.merek !== null) {
                          merekStr = sp.merek.nama_merek ?? JSON.stringify(sp.merek);
                        } else {
                          merekStr = String(sp.merek);
                        }
                        if (merekStr) merekSet.add(merekStr);
                      });
                      return Array.from(merekSet).map((merek, idx) => (
                        <SelectItem key={merek + '-' + idx} value={merek}>{merek}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Field cari barang muncul setelah kategori dan merek dipilih */}
            {formKategori && formMerek && (
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-gray-700">Barang</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Cari nama barang..."
                    value={
                      formBarang
                        ? sparepartList.find(sp => sp.id_sparepart === formBarang)?.nama_barang || formBarang
                        : ""
                    }
                    onChange={e => {
                      setFormBarang(e.target.value);
                    }}
                    autoComplete="off"
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                    </svg>
                  </div>
                  {formBarang !== undefined && (
                    <div className="absolute z-20 mt-1 bg-white border rounded-lg shadow-lg w-full max-h-40 overflow-auto">
                      {sparepartList
                        .filter(sp => sp.id_kategori_barang === formKategori &&
                          ((typeof sp.merek === 'object' && sp.merek !== null ? sp.merek.nama_merek : String(sp.merek)) === formMerek) &&
                          sp.nama_barang.toLowerCase().includes((formBarang || "").toLowerCase())
                        )
                        .sort((a, b) => a.nama_barang.localeCompare(b.nama_barang))
                        .map(sp => (
                          <div
                            key={sp.id_sparepart}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                            onClick={() => setFormBarang(sp.id_sparepart)}
                          >
                            {sp.nama_barang}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Transaksi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  value={formJumlah === 0 ? "" : formJumlah}
                  onChange={e => {
                    const val = e.target.value.replace(/^0+/, "");
                    setFormJumlah(val === "" ? 0 : Number(val));
                  }}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Tipe</label>
                <Select value={formTipe} onValueChange={setFormTipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masuk">Masuk</SelectItem>
                    <SelectItem value="keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Tipe Pembayaran</label>
                <Select value={formTipePembayaran} onValueChange={setFormTipePembayaran}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {formTipePembayaran === "kredit" && (
                  <>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Due Date</label>
                    <DatePicker
                      value={formDue ? new Date(formDue) : null}
                      onChange={val => setFormDue(val ? val.toISOString().split("T")[0] : "")}
                      placeholder="Pilih Due Date"
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Keterangan</label>
              <Input
                value={formKeterangan}
                onChange={e => setFormKeterangan(e.target.value)}
                placeholder="Keterangan (opsional)"
              />
            </div>

            {/* Total Harga */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <label className="block mb-1 text-sm font-medium text-gray-700">Total Harga</label>
              <div className="text-lg font-semibold text-gray-800">
                Rp {(() => {
                  const sparepart = sparepartList.find(sp => sp.id_sparepart === formBarang);
                  if (!sparepart || formJumlah <= 0) return "0";
                  if (formTipe === "masuk") {
                    return (formJumlah * (sparepart.harga_modal ?? 0)).toLocaleString();
                  } else {
                    return (formJumlah * (sparepart.harga_jual ?? 0)).toLocaleString();
                  }
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenForm(false)}
                className="px-4"
              >
                Batal
              </Button>
              <Button type="submit" className="px-5">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Transaksi */}
      <Dialog open={openEditForm} onOpenChange={setOpenEditForm}>
        <DialogContent className="sm:max-w-lg rounded-2xl shadow-xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Edit Transaksi
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Ubah detail transaksi dengan benar sebelum menyimpan.
            </p>
          </DialogHeader>
          <form
            className="space-y-5 py-2"
            onSubmit={e => {
              e.preventDefault();
              setShowEditConfirm(true);
            }}
          >
            {/* Detail Barang */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Barang</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari nama barang..."
                  value={
                    editBarang
                      ? sparepartList.find(sp => sp.id_sparepart === editBarang)?.nama_barang || editBarang
                      : ""
                  }
                  onChange={e => {
                    setEditBarang(e.target.value);
                  }}
                  autoComplete="off"
                  className="pr-10"
                />
                <div className="absolute inset-y-0 right-2 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                {editBarang && editBarang.length > 0 && (
                  <div className="absolute z-20 mt-1 bg-white border rounded-lg shadow-lg w-full max-h-40 overflow-auto">
                    {sparepartList
                      .filter(sp => sp.nama_barang.toLowerCase().includes(editBarang.toLowerCase()))
                      .map(sp => (
                        <div
                          key={sp.id_sparepart}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                          onClick={() => setEditBarang(sp.id_sparepart)}
                        >
                          {sp.nama_barang}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Transaksi */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  value={editJumlah === 0 ? "" : editJumlah}
                  onChange={e => {
                    const val = e.target.value.replace(/^0+/, "");
                    setEditJumlah(val === "" ? 0 : Number(val));
                  }}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Tipe</label>
                <Select value={editTipe} onValueChange={setEditTipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masuk">Masuk</SelectItem>
                    <SelectItem value="keluar">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Tipe Pembayaran</label>
                <Select value={editTipePembayaran} onValueChange={setEditTipePembayaran}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tipe Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="kredit">Kredit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Status Pembayaran</label>
                <Select value={editStatusPembayaran} onValueChange={setEditStatusPembayaran} disabled={editTipePembayaran === "cash"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum lunas">Belum Lunas</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {editTipePembayaran === "kredit" && (
                  <>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Due Date</label>
                    <DatePicker
                      value={editDue ? new Date(editDue) : null}
                      onChange={val => setEditDue(val ? val.toISOString().split("T")[0] : "")}
                      placeholder="Pilih Due Date"
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Keterangan</label>
              <Input
                value={editKeterangan}
                onChange={e => setEditKeterangan(e.target.value)}
                placeholder="Keterangan (opsional)"
              />
            </div>

            {/* Total Harga */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <label className="block mb-1 text-sm font-medium text-gray-700">Total Harga</label>
              <div className="text-lg font-semibold text-gray-800">
                Rp {(() => {
                  const sparepart = sparepartList.find(sp => sp.id_sparepart === editBarang);
                  if (!sparepart || editJumlah <= 0) return "0";
                  if (editTipe === "masuk") {
                    return (editJumlah * (sparepart.harga_modal ?? 0)).toLocaleString();
                  } else {
                    return (editJumlah * (sparepart.harga_jual ?? 0)).toLocaleString();
                  }
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenEditForm(false)}
                className="px-4"
              >
                Batal
              </Button>
              <Button type="submit" className="px-5">
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Edit Transaksi */}
      <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Edit Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p>Barang: <b>{sparepartList.find(sp => sp.id_sparepart === editBarang)?.nama_barang || ""}</b></p>
            <p>Jumlah: <b>{editJumlah}</b></p>
            <p>Tipe: <b>{editTipe}</b></p>
            <p>Total Harga: <b>Rp {getEditHargaTotal().toLocaleString()}</b></p>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setShowEditConfirm(false)}>Batal</Button>
            <Button onClick={() => {
              handleEditTransaksi();
              toast.success("Transaksi berhasil diupdate");
            }}>Konfirmasi</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Transaksi */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Hapus Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p>Apakah Anda yakin ingin menghapus transaksi ini?</p>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
            <Button variant="destructive" onClick={() => {
              handleDelete(deleteId);
              toast.success("Transaksi berhasil dihapus");
            }}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Transaksi */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Konfirmasi Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p>Barang: <b>{sparepartList.find(sp => sp.id_sparepart === formBarang)?.nama_barang || ""}</b></p>
            <p>Jumlah: <b>{formJumlah}</b></p>
            <p>Tipe: <b>{formTipe}</b></p>
            <p>Total Harga: <b>Rp {getHargaTotal().toLocaleString()}</b></p>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>Batal</Button>
            <Button onClick={handleTambahTransaksi}>Konfirmasi</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detail */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detail Transaksi</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2">
              <p><b>ID:</b> {selected.id_transaksi}</p>
              <p><b>Barang:</b> {selected.sparepart?.nama_barang}</p>
              <p><b>Kategori:</b> {selected.sparepart?.kategori || '-'}</p>
              <p><b>Jumlah:</b> {selected.jumlah}</p>
              <p><b>Total:</b> Rp {selected.harga_total.toLocaleString()}</p>
              <p><b>Tanggal:</b> {new Date(selected.tanggal).toLocaleString()}</p>
              <p><b>Tipe:</b> {selected.tipe}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Modal Faktur Preview & Cetak - Desain mirip gambar */}
      <Dialog open={openFakturPreview} onOpenChange={setOpenFakturPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Preview Faktur</DialogTitle></DialogHeader>
          {fakturData && (
            <div id="faktur-area" className="bg-white p-6 rounded shadow border mb-4 text-black text-[13px] font-sans">
              <style>{`
                @media print {
                  body { margin: 0; }
                  #faktur-area {
                    background: white !important;
                    color: black !important;
                    font-family: sans-serif !important;
                    font-size: 13px !important;
                    box-shadow: none !important;
                    border: 1px solid #ccc !important;
                    margin: 0 !important;
                    padding: 24px !important;
                    width: 100% !important;
                  }
                  #faktur-area table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                  }
                  #faktur-area th, #faktur-area td {
                    border: 1px solid #888 !important;
                    padding: 4px 8px !important;
                  }
                  #faktur-area .text-center { text-align: center !important; }
                  #faktur-area .text-right { text-align: right !important; }
                  #faktur-area .font-bold { font-weight: bold !important; }
                  #faktur-area .font-semibold { font-weight: 600 !important; }
                  #faktur-area .text-xs { font-size: 12px !important; }
                  #faktur-area .mb-2 { margin-bottom: 8px !important; }
                  #faktur-area .mt-8 { margin-top: 32px !important; }
                  #faktur-area hr { border: none; border-top: 1px solid #888 !important; margin: 8px 0 !important; }
                }
              `}</style>
              {/* Header toko */}
              <div className="text-center mb-2">
                <div className="font-bold text-lg">Chicha Mobile</div>
                <div className="text-xs">Jl.Bahder Johan, Kota Padang Panjang</div>
              </div>
              <hr className="my-2" />
              {/* Info faktur */}
              <div className="mb-2">
                <div><b>Nama Pembeli</b>: {fakturData.keterangan || '-'}</div>
                <div><b>Tanggal</b>: {(() => { const d = new Date(fakturData.tanggal); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth()+1).padStart(2, '0'); const year = d.getFullYear(); return `${day}/${month}/${year}`; })()}</div>
                <div><b>Jam</b>: {(() => { const d = new Date(fakturData.tanggal); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')} WIB`; })()}</div>
                <div><b>No. Faktur</b>: {fakturData.id_transaksi}</div>
              </div>
              {/* Tabel barang */}
              <table className="w-full border text-xs mb-2" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Barang</th>
                    <th className="border px-2 py-1">Qty</th>
                    <th className="border px-2 py-1">Harga</th>
                    <th className="border px-2 py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">{fakturData.sparepart?.nama_barang || '-'}</td>
                    <td className="border px-2 py-1 text-center">{fakturData.jumlah}</td>
                    <td className="border px-2 py-1 text-right">{(fakturData.harga_total / fakturData.jumlah).toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{fakturData.harga_total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              {/* Total harga */}
              <div className="mb-2 font-bold text-right">Total: Rp {fakturData.harga_total.toLocaleString()}</div>
              {/* Tipe pembayaran dan status hutang */}
              <div className="mb-2">
                <div><b>Tipe Pembayaran</b>: {fakturData.tipe_pembayaran || '-'}</div>
                {fakturData.tipe_pembayaran === 'kredit' && (
                  <>
                    <div><b>Status</b>: {fakturData.status_pembayaran || '-'}</div>
                    <div><b>Sisa Hutang</b>: Rp {fakturData.harga_total.toLocaleString()}</div>
                    <div><b>Tenggat Waktu</b>: {fakturData.due || '-'}</div>
                  </>
                )}
              </div>
              {/* Tertanda toko */}
              <div className="mt-8 text-right font-semibold">Tertanda Chicha Mobile</div>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" onClick={() => setOpenFakturPreview(false)}>Tutup</Button>
            <Button onClick={() => {
  if (!fakturData) return;
  const style = `
    <style>
      @media print {
        body { margin:0; font-family:sans-serif; font-size:13px; color:#222; }
        .faktur-termal { width:58mm; min-width:58mm; max-width:58mm; margin:0 auto; background:white; }
        .faktur-header { text-align:center; margin-bottom:4px; }
        .faktur-title { font-weight:bold; font-size:13px; }
        .faktur-alamat { font-size:9px; }
        hr { border:none; border-top:1px dashed #888; margin:4px 0; }
        .faktur-info { margin-bottom:4px; font-size:10px; }
        .faktur-info-right { text-align:left; }
        .faktur-table { width:100%; border-collapse:collapse; font-size:10px; margin-bottom:4px; }
        .faktur-table th, .faktur-table td { border:none; padding:2px 2px; }
        .faktur-table th { font-weight:bold; }
        .text-center { text-align:center; }
        .text-right { text-align:right; }
        .font-bold { font-weight:bold; }
        .font-semibold { font-weight:600; }
        .text-xs { font-size:9px; }
        .mb-2 { margin-bottom:4px; }
        .mt-8 { margin-top:16px; }
      }
    </style>
  `;
  const jamWIB = (() => { const d = new Date(fakturData.tanggal); let jam = d.getHours(); let menit = d.getMinutes(); let detik = d.getSeconds(); jam = jam + 7 > 23 ? (jam + 7 - 24) : (jam + 7); return `${String(jam).padStart(2,'0')}:${String(menit).padStart(2,'0')}:${String(detik).padStart(2,'0')} WIB`; })();
  const fakturHtml = `
    <div class="faktur-termal">
      <div class="faktur-header">
        <div class="faktur-title">Chicha Mobile</div>
        <div class="faktur-alamat">Jl.Bahder Johan, Kota Padang Panjang</div>
      </div>
      <hr />
      <div class="faktur-info faktur-info-right">
        <div><span class="font-bold">Nama Pembeli:</span> ${fakturData.keterangan || '-'}</div>
        <div><span class="font-bold">Tanggal:</span> ${(() => { const d = new Date(fakturData.tanggal); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth()+1).padStart(2, '0'); const year = d.getFullYear(); return `${day}/${month}/${year}`; })()}</div>
        <div><span class="font-bold">Jam:</span> ${jamWIB}</div>
        <div><span class="font-bold">No. Faktur:</span> ${fakturData.id_transaksi}</div>
      </div>
      <table class="faktur-table">
        <thead>
          <tr>
            <th>Barang</th>
            <th>Qty</th>
            <th>Harga</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${fakturData.sparepart?.nama_barang || '-'}</td>
            <td class="text-center">${fakturData.jumlah}</td>
            <td class="text-right">${(fakturData.harga_total / fakturData.jumlah).toLocaleString()}</td>
            <td class="text-right">${fakturData.harga_total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div class="mb-2 font-bold text-right">Total: Rp ${fakturData.harga_total.toLocaleString()}</div>
      <div class="mb-2">
        <div><span class="font-bold">Tipe Pembayaran:</span> ${fakturData.tipe_pembayaran || '-'}</div>
        ${fakturData.tipe_pembayaran === 'kredit' ? `
          <div><span class="font-bold">Status:</span> ${fakturData.status_pembayaran || '-'}</div>
          <div><span class="font-bold">Sisa Hutang:</span> Rp ${fakturData.harga_total.toLocaleString()}</div>
          <div><span class="font-bold">Tenggat Waktu:</span> ${fakturData.due || '-'}</div>
        ` : ''}
      </div>
      <div class="mt-8 text-right font-semibold">Tertanda Chicha Mobile</div>
    </div>
  `;
  const win = window.open('', '', 'height=600,width=400');
  if (win) {
    win.document.write('<html><head><title>Faktur</title>' + style + '</head><body>' + fakturHtml + '</body></html>');
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }
}}>Faktur</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
