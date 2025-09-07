/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from "react";
import {
  getTransaksi,
  addTransaksi,
  updateTransaksi,
  deleteTransaksi,
  exportTransaksiCSV,
  exportTransaksiExcel,
  getRingkasanTransaksi,
  getDetailTransaksi,
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

interface Transaksi {
  id_transaksi: string;
  tanggal: string;
  jumlah: number;
  harga_total: number;
  tipe: string;
  keterangan: string;
  sparepart?: { nama_barang: string; kategori?: string } | null;
  user?: string;
}

export default function TransaksiPage() {
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openRingkasan, setOpenRingkasan] = useState(false);
  const [selected, setSelected] = useState<Transaksi | null>(null);
  const [ringkasan, setRingkasan] = useState<any>(null);
  // Faktur preview
  const [openFakturPreview, setOpenFakturPreview] = useState(false);
  const [fakturData, setFakturData] = useState<Transaksi | null>(null);
  const [token, setToken] = useState<string>("");
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const router = useRouter();
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

  const fetchRingkasan = async () => {
    try {
      const res = await apiWithRefresh(
        (tok) => getRingkasanTransaksi(tok, filters),
        token,
        setToken,
        () => {},
        router
      );
      setRingkasan(res);
    } catch (e) {
      toast.error("Gagal memuat ringkasan");
    }
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
      fetchData();
    } catch {
      toast.error("Gagal menghapus transaksi");
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
    if (!formBarang || formJumlah <= 0 || !formTipe) {
      toast.error("Barang, jumlah, dan tipe wajib diisi");
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

  return (
  <div className="max-w-5xl mx-auto py-8 px-2 space-y-4 bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold bg-white px-6 py-2 rounded-xl shadow-lg border border-gray-200">Manajemen Transaksi</h1>
        <div className="flex gap-2">
          <Button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setOpenForm(true)}>
            Tambah Transaksi
          </Button>
          <Button variant="outline" className="bg-white text-black font-semibold px-4 py-2 rounded shadow border border-gray-200 hover:bg-gray-100" onClick={() => handleExport("csv")}>Export CSV</Button>
          <Button variant="outline" className="bg-white text-black font-semibold px-4 py-2 rounded shadow border border-gray-200 hover:bg-gray-100" onClick={() => handleExport("excel")}>Export Excel</Button>
          <Button variant="secondary" className="bg-white text-black font-semibold px-4 py-2 rounded shadow border border-gray-200 hover:bg-gray-100" onClick={() => { setOpenRingkasan(true); fetchRingkasan(); }}>Ringkasan</Button>
        </div>
      </div>

      {/* Filter - desain modern & logic tanggal fix */}
  <Card className="shadow-md border rounded-xl bg-white">
  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold">Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-3 flex-1 min-w-0">
              <Select value={filterKategori || 'all'} onValueChange={val => setFilterKategori(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Kategori Barang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {kategoriList.map(kat => (
                    <SelectItem key={kat.id_kategori_barang} value={kat.id_kategori_barang}>{kat.nama_kategori}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.tipe || ""} onValueChange={val => setFilters({ ...filters, tipe: val })}>
                <SelectTrigger className="w-[120px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="masuk">Masuk</SelectItem>
                  <SelectItem value="keluar">Keluar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.id_sparepart || ""} onValueChange={val => setFilters({ ...filters, id_sparepart: val === 'all' ? undefined : val })}>
                <SelectTrigger className="w-[160px] bg-gray-50 border rounded-lg px-3 py-2"><SelectValue placeholder="Nama Barang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Barang</SelectItem>
                  {sparepartList.map(sp => (
                    <SelectItem key={sp.id_sparepart} value={sp.id_sparepart}>{sp.nama_barang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                className="w-[140px] bg-gray-50 border rounded-lg px-3 py-2"
                value={filterDari}
                onChange={e => setFilterDari(e.target.value)}
                placeholder="Dari Tanggal"
              />
              <Input
                type="date"
                className="w-[140px] bg-gray-50 border rounded-lg px-3 py-2"
                value={filterSampai}
                onChange={e => setFilterSampai(e.target.value)}
                placeholder="Sampai Tanggal"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Button className="px-5 py-2 font-bold rounded-lg" onClick={() => fetchData()}>Terapkan</Button>
              <Button variant="ghost" className="px-5 py-2 rounded-lg" onClick={() => { setFilters({}); setFilterDari(""); setFilterSampai(""); setPage(1); }}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel */}
      <Card className="bg-white rounded shadow border mt-2">
        <CardContent>
          <div className="w-full min-h-[120px] flex items-center justify-center">
            {loading ? (
              <div className="w-full flex items-center justify-center py-8">
                <span className="text-gray-500 text-sm">Loading data transaksi...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="w-full flex items-center justify-center py-8">
                <span className="text-gray-500 text-sm">Belum ada data transaksi.</span>
              </div>
            ) : (
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="bg-gray-200 border-b-2 border-gray-300">
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-6">No</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-16">Tanggal</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-20">Barang</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-14">Kategori</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-8">Jml</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-16">Total</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-10">Tipe</TableHead>
                    <TableHead className="px-0.5 py-0.5 text-center font-bold w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((trx, idx) => (
                    <TableRow key={trx.id_transaksi} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="px-0.5 py-0.5 text-center">{(page - 1) * limit + idx + 1}</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center">{
                        (() => {
                          const d = new Date(trx.tanggal);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()
                      }</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center truncate max-w-[70px]">{trx.sparepart?.nama_barang || "-"}</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center truncate max-w-[50px]">{trx.sparepart?.kategori || "-"}</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center">{trx.jumlah}</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center">Rp {trx.harga_total.toLocaleString()}</TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center">
                        <span className={`px-1 py-0.5 rounded text-white text-[10px] ${trx.tipe === "masuk" ? "bg-green-500" : "bg-red-500"}`}>
                          {trx.tipe}
                        </span>
                      </TableCell>
                      <TableCell className="px-0.5 py-0.5 text-center flex gap-0.5 flex-wrap justify-center">
                        <Button size="sm" variant="outline" className="text-blue-600 px-1 py-0.5 rounded hover:bg-blue-100 min-w-[32px]" onClick={() => { setSelected(trx); setOpenDetail(true); }}>Lihat</Button>
                        <Button size="sm" variant="outline" className="text-gray-600 px-1 py-0.5 rounded hover:bg-gray-100 min-w-[32px]" onClick={() => { setSelected(trx); setOpenForm(true); }}>Edit</Button>
                        <Button size="sm" variant="destructive" className="text-white px-1 py-0.5 rounded hover:bg-red-100 min-w-[32px]" onClick={() => handleDelete(trx.id_transaksi)}>Hapus</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {/* Pagination */}
          <div className="flex flex-wrap justify-between items-center mt-2 gap-2">
            <Button disabled={page === 1} className="bg-gray-100 text-gray-700 px-4 py-2 rounded" onClick={() => setPage(page - 1)}>Prev</Button>
            <span className="font-semibold">Page {page}</span>
            <Button disabled={page * limit >= total} className="bg-gray-100 text-gray-700 px-4 py-2 rounded" onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Tambah Transaksi */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Transaksi</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              setShowConfirm(true);
            }}
          >
            <div>
              <label className="block mb-1 font-semibold">Barang</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari nama barang..."
                  value={formBarang ? (sparepartList.find(sp => sp.id_sparepart === formBarang)?.nama_barang || formBarang) : ''}
                  onChange={e => {
                    setFormBarang(e.target.value);
                  }}
                  autoComplete="off"
                />
                {/* Suggestion dropdown */}
                {formBarang && formBarang.length > 0 && (
                  <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-auto">
                    {sparepartList
                      .filter(sp => sp.nama_barang.toLowerCase().includes(formBarang.toLowerCase()))
                      .map(sp => (
                        <div
                          key={sp.id_sparepart}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                          onClick={() => setFormBarang(sp.id_sparepart)}
                        >
                          {sp.nama_barang}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Jumlah</label>
              <Input
                type="number"
                min={1}
                value={formJumlah === 0 ? '' : formJumlah}
                onChange={e => {
                  // Hilangkan leading zero
                  const val = e.target.value.replace(/^0+/, '');
                  setFormJumlah(val === '' ? 0 : Number(val));
                }}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Tipe</label>
              <Select value={formTipe} onValueChange={setFormTipe}>
                <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masuk">Masuk</SelectItem>
                  <SelectItem value="keluar">Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-semibold">Keterangan</label>
              <Input value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} placeholder="Keterangan (opsional)" />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Total Harga</label>
              <Input value={getHargaTotal().toLocaleString()} readOnly disabled />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
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
              {/* Header toko */}
                <div className="text-center mb-2">
                  <div className="font-bold text-lg">Chicha Mobile</div>
                  <div className="text-xs">Jl.Bahder Johan, Kota Padang Panjang</div>
                </div>
              <hr className="my-2" />
                {/* Info faktur */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div></div>
                  <div>
                    <div><b>Tanggal</b>: {(() => { const d = new Date(fakturData.tanggal); const day = String(d.getDate()).padStart(2, '0'); const month = String(d.getMonth()+1).padStart(2, '0'); const year = d.getFullYear(); return `${day}/${month}/${year}`; })()}</div>
                    <div><b>No. Faktur</b>: {fakturData.id_transaksi}</div>
                  </div>
                </div>
              {/* Tabel barang */}
              <table className="w-full border text-xs mb-2" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">No.</th>
                    <th className="border px-2 py-1">Nama Barang</th>
                    <th className="border px-2 py-1">Qty</th>
                    <th className="border px-2 py-1">Kode Barang</th>
                    <th className="border px-2 py-1">Harga</th>
                    <th className="border px-2 py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1 text-center">1</td>
                    <td className="border px-2 py-1">{fakturData.sparepart?.nama_barang || '-'}</td>
                    <td className="border px-2 py-1 text-center">{fakturData.jumlah}</td>
                    <td className="border px-2 py-1 text-center">-</td>
                    <td className="border px-2 py-1 text-right">{(fakturData.harga_total / fakturData.jumlah).toLocaleString()}</td>
                    <td className="border px-2 py-1 text-right">{fakturData.harga_total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
                {/* Total harga */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div></div>
                  <div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="font-bold"><td className="pr-2">TOTAL</td><td className="text-right">{fakturData.harga_total.toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              {/* Catatan */}
              <div className="text-xs mb-2"><b>Catatan:</b> {fakturData.keterangan || '-'}</div>
                {/* Tertanda toko */}
                <div className="mt-8 text-right font-semibold">Tertanda Chicha Mobile</div>
            </div>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" onClick={() => setOpenFakturPreview(false)}>Tutup</Button>
            <Button onClick={() => {
              // Print hanya area faktur
              const printContents = document.getElementById('faktur-area')?.innerHTML;
              const win = window.open('', '', 'height=600,width=800');
              if (win && printContents) {
                win.document.write('<html><head><title>Faktur</title></head><body>' + printContents + '</body></html>');
                win.document.close();
                win.focus();
                win.print();
                win.close();
              }
            }}>Cetak</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ringkasan */}
      <Dialog open={openRingkasan} onOpenChange={setOpenRingkasan}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ringkasan Transaksi</DialogTitle></DialogHeader>
          {ringkasan && (
            <div className="grid gap-2">
              <Card><CardContent>Total: Rp {ringkasan.total_transaksi.toLocaleString()}</CardContent></Card>
              <Card><CardContent>Cashflow: Rp {ringkasan.cashflow.toLocaleString()}</CardContent></Card>
              <Card><CardContent>Total Masuk: Rp {ringkasan.total_masuk.toLocaleString()}</CardContent></Card>
              <Card><CardContent>Total Keluar: Rp {ringkasan.total_keluar.toLocaleString()}</CardContent></Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
