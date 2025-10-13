/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { getAllSparepart, searchSparepart } from "@/lib/api/sparepartHelper";
import { getAllKategoriBarang } from "@/lib/api/kategoriBarangHelper";
import { getAllMerek } from "@/lib/api/merekHelper";
import { addTransaksi, getStrukHTML, cetakStrukTransaksi } from "@/lib/api/transaksiHelper";
import { withAuthRetry } from "@/lib/api/withAuthRetry";
import { AutoPrintWrapper, useAutoPrint } from "@/components/printer";

export default function KasirPage() {
  // State
  type KeranjangItem = {
    id_sparepart: string;
    nama_barang: string;
    harga_jual: number;
    stok: number;
    kode_barang: string;
    kategori: string;
    merek: string;
    qty: number;
    eceran: boolean;
    harga_total: number;
  };
  const [produkList, setProdukList] = useState<any[]>([]); // dari backend
  const [produkListOriginal, setProdukListOriginal] = useState<any[]>([]); // data asli tanpa filter
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [merekList, setMerekList] = useState<any[]>([]);
  const [filterKategori, setFilterKategori] = useState("");
  const [filterMerek, setFilterMerek] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // untuk pencarian
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(""); // debounced search
  const [tipeTransaksi, setTipeTransaksi] = useState("keluar"); // keluar = penjualan, masuk = retur
  const [keranjang, setKeranjang] = useState<KeranjangItem[]>([]);
  const [tipePembayaran, setTipePembayaran] = useState("cash"); // cash atau kredit
  const [keteranganTransaksi, setKeteranganTransaksi] = useState(""); // keterangan transaksi
  const [dueDate, setDueDate] = useState(""); // tanggal jatuh tempo untuk kredit
  const [showModalTransaksi, setShowModalTransaksi] = useState(false);
  const [detailTransaksi, setDetailTransaksi] = useState<any>(null);
  const [loadingTransaksi, setLoadingTransaksi] = useState(false);
  const [hargaEceranInput, setHargaEceranInput] = useState<{[key: string]: string}>({});

  // Auto Print Hook
  const { autoPrintStruk, isPrinterConnected } = useAutoPrint();

  // Debouncing untuk search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch kategori & merek
  useEffect(() => {
    if (typeof window === "undefined") return; // Pastikan sudah di client side
    
    (async () => {
      console.log('Mulai fetch kategori dan merek...');
      try {
        console.log('Calling getAllKategoriBarang with withAuthRetry');
        const kategori = await withAuthRetry((token) => getAllKategoriBarang(token));
        console.log('Response kategori:', kategori);
        setKategoriList(Array.isArray(kategori) ? kategori : []);
      } catch (e) {
        console.error('Gagal fetch kategori', e);
        setKategoriList([]);
      }
      
      try {
        console.log('Calling getAllMerek with withAuthRetry');
        const merek = await withAuthRetry((token) => getAllMerek(token));
        console.log('Response merek:', merek);
        setMerekList(Array.isArray(merek) ? merek : []);
      } catch (e) {
        console.error('Gagal fetch merek', e);
        setMerekList([]);
      }
    })();
  }, []); // Hapus dependency token karena withAuthRetry akan handle token

  // Fungsi untuk refresh data produk
  const refreshProdukData = async () => {
    setLoadingProduk(true);
    try {
      console.log('Refreshing produk data...');
      if (!filterKategori && !filterMerek) {
        const data = await withAuthRetry((token) => getAllSparepart(token));
        console.log('Response refresh sparepart:', data);
        const dataArray = Array.isArray(data) ? data : [];
        setProdukListOriginal(dataArray);
        setProdukList(dataArray);
      } else {
        const params: { kategori?: string; merek?: string } = {};
        if (filterKategori) params.kategori = filterKategori;
        if (filterMerek) params.merek = filterMerek;
        console.log('Calling refresh searchSparepart dengan params:', params);
        const data = await withAuthRetry((token) => searchSparepart(token, params));
        console.log('Response refresh search sparepart:', data);
        const dataArray = Array.isArray(data) ? data : [];
        setProdukListOriginal(dataArray);
        setProdukList(dataArray);
      }
    } catch (e) {
      console.error('Gagal refresh produk', e);
    } finally {
      setLoadingProduk(false);
    }
  };

  // Fetch produk/sparepart (dengan filter)
  const [loadingProduk, setLoadingProduk] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return; // Pastikan sudah di client side
    
    setLoadingProduk(true);
    (async () => {
      try {
        console.log('Mulai fetch produk...');
        if (!filterKategori && !filterMerek) {
          const data = await withAuthRetry((token) => getAllSparepart(token));
          console.log('Response sparepart:', data);
          console.log('Sample produk:', data?.[0]); // Debug struktur data
          const dataArray = Array.isArray(data) ? data : [];
          setProdukListOriginal(dataArray);
          setProdukList(dataArray);
        } else {
          const params: { kategori?: string; merek?: string } = {};
          if (filterKategori) params.kategori = filterKategori;
          if (filterMerek) params.merek = filterMerek;
          console.log('Calling searchSparepart dengan params:', params);
          const data = await withAuthRetry((token) => searchSparepart(token, params));
          console.log('Response search sparepart:', data);
          const dataArray = Array.isArray(data) ? data : [];
          setProdukListOriginal(dataArray);
          setProdukList(dataArray);
        }
      } catch (e) {
        console.error('Gagal fetch produk', e);
        setProdukListOriginal([]);
        setProdukList([]);
      } finally {
        setLoadingProduk(false);
      }
    })();
  }, [filterKategori, filterMerek]); // Hapus dependency token

  // Fungsi untuk highlight text yang cocok dengan pencarian
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    );
  };

  // Fungsi pencarian produk
  const filterProdukBySearch = (products: any[], query: string) => {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter((produk) => {
      return (
        produk.nama_barang?.toLowerCase().includes(searchTerm) ||
        produk.kode_barang?.toLowerCase().includes(searchTerm) ||
        produk.deskripsi?.toLowerCase().includes(searchTerm) ||
        produk.harga_jual?.toString().includes(searchTerm)
      );
    });
  };

  // Effect untuk filter berdasarkan pencarian
  useEffect(() => {
    const filteredProducts = filterProdukBySearch(produkListOriginal, debouncedSearchQuery);
    setProdukList(filteredProducts);
  }, [debouncedSearchQuery, produkListOriginal]);

  // Effect untuk mengupdate keranjang ketika tipe transaksi berubah
  useEffect(() => {
    setKeranjang((prev) => prev.map((item) => ({
      ...item,
      harga_total: tipeTransaksi === 'masuk' ? 0 : (item.eceran ? item.harga_total : item.qty * item.harga_jual)
    })));
  }, [tipeTransaksi]);

  // Tambah produk ke keranjang
  const tambahKeKeranjang = (produk: any) => {
    // Validasi stok hanya untuk transaksi keluar (penjualan)
    if (tipeTransaksi === 'keluar' && produk.sisa <= 0) {
      alert(`Stok barang "${produk.nama_barang}" kosong! Tidak bisa menambahkan ke keranjang.`);
      return;
    }

    console.log("Data yang masuk ke tambahKeKeranjang:", produk);
    console.log("ID Sparepart yang akan disimpan:", produk.id_sparepart);
    
    setKeranjang((prev) => {
      const exist = prev.find((item) => item.id_sparepart === produk.id_sparepart);
      if (exist) {
        // Validasi stok saat menambah qty hanya untuk transaksi keluar
        if (tipeTransaksi === 'keluar' && exist.qty >= produk.sisa) {
          alert(`Stok tidak mencukupi! Stok tersedia: ${produk.sisa}`);
          return prev;
        }
        // Jika sudah ada, tambah qty
        return prev.map((item) =>
          item.id_sparepart === produk.id_sparepart
            ? { 
                ...item, 
                qty: item.qty + 1, 
                harga_total: tipeTransaksi === 'masuk' ? 0 : (item.eceran ? item.harga_total : (item.qty + 1) * item.harga_jual)
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...produk,
          qty: 1,
          eceran: false,
          harga_total: tipeTransaksi === 'masuk' ? 0 : produk.harga_jual,
        },
      ];
    });
  };

  // Hapus item dari keranjang
  const hapusItem = (id_sparepart: string) => setKeranjang((prev) => prev.filter((item) => item.id_sparepart !== id_sparepart));

  // Ubah qty
  const ubahQty = (id_sparepart: string, qty: number) => {
    setKeranjang((prev) => prev.map((item) => {
      if (item.id_sparepart === id_sparepart) {
        // Validasi stok hanya untuk transaksi keluar (penjualan)
        if (tipeTransaksi === 'keluar' && qty > item.stok) {
          alert(`Stok tidak mencukupi! Stok tersedia: ${item.stok}`);
          return item;
        }
        return { 
          ...item, 
          qty, 
          harga_total: tipeTransaksi === 'masuk' ? 0 : (item.eceran ? item.harga_total : qty * item.harga_jual)
        };
      }
      return item;
    }));
  };

  // Toggle eceran per item
  const toggleEceran = (id_sparepart: string, checked: boolean) => {
    setKeranjang((prev) => prev.map((item) =>
      item.id_sparepart === id_sparepart
        ? {
            ...item,
            eceran: checked,
            harga_total: tipeTransaksi === 'masuk' ? 0 : (checked ? 0 : item.qty * item.harga_jual),
          }
        : item
    ));
  };

  // Ubah harga_total manual jika eceran
  const ubahHargaTotal = (id_sparepart: string, harga: number) => {
    setKeranjang((prev) => prev.map((item) =>
      item.id_sparepart === id_sparepart ? { 
        ...item, 
        harga_total: tipeTransaksi === 'masuk' ? 0 : harga 
      } : item
    ));
  };

  // Format input rupiah untuk eceran
  const formatRupiahInput = (value: string | number): string => {
    if (!value) return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseRupiahInput = (value: string): number => {
    return parseInt(value.replace(/[^\d]/g, '')) || 0;
  };

  // Fungsi selesaikan transaksi
  const selesaikanTransaksi = async () => {
    if (keranjang.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    setLoadingTransaksi(true);
    try {
      // Debug keranjang sebelum format
      console.log("Data keranjang:", keranjang);
      
      // Validasi keranjang
      const invalidItems = keranjang.filter(item => 
        !item.id_sparepart || !item.qty || item.qty <= 0
      );
      
      if (invalidItems.length > 0) {
        console.error("Item tidak valid:", invalidItems);
        alert("Ada item di keranjang yang tidak valid. Silakan hapus dan tambahkan ulang.");
        return;
      }

      // Format data untuk backend sesuai dengan struktur yang benar
      const transaksiData: any = {
        tipe: tipeTransaksi,
        tipe_pembayaran: tipePembayaran || "cash",
        keterangan: keteranganTransaksi || `Transaksi kasir ${tipeTransaksi} - ${new Date().toLocaleString()}`,
        items: keranjang.map(item => {
          const itemData: any = {
            id_sparepart: String(item.id_sparepart), // Pastikan dalam format string
            jumlah: Number(item.qty),
            harga_satuan: Number(item.harga_jual), // Tambahkan harga_satuan
            eceran: Boolean(item.eceran)
          };
          
          // Jika eceran, tambahkan harga_total
          if (item.eceran) {
            itemData.harga_total = Number(item.harga_total);
          } else {
            // Jika tidak eceran, hitung harga_total dari qty * harga_satuan
            itemData.harga_total = Number(item.qty) * Number(item.harga_jual);
          }
          
          return itemData;
        })
      };

      // Tambahkan field due jika pembayaran kredit
      if (tipePembayaran === 'kredit') {
        if (!dueDate) {
          alert("Tanggal jatuh tempo wajib diisi untuk pembayaran kredit!");
          setLoadingTransaksi(false);
          return;
        }
        transaksiData.due = dueDate;
      }

      console.log("Mengirim data transaksi:", transaksiData);
      console.log("Struktur items:", transaksiData.items);
      
      // Validasi setiap item yang akan dikirim
      transaksiData.items.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, item);
        if (!item.id_sparepart || !item.jumlah) {
          console.error(`Item ${index} tidak valid:`, item);
        }
      });
      
      // Panggil API untuk menyimpan transaksi menggunakan withAuthRetry
      const response = await withAuthRetry((token) => addTransaksi(token, transaksiData));
      
      console.log("Response transaksi:", response);
      console.log("Response data:", response.data);
      console.log("ID Transaksi dari response langsung:", response.id_transaksi);
      console.log("ID Transaksi dari response.data:", response.data?.id_transaksi);
      
      // Coba ambil ID transaksi dari berbagai lokasi yang mungkin
      let transactionId = response.id_transaksi || response.data?.id_transaksi;
      
      if (!transactionId) {
        console.error("ID transaksi tidak ditemukan dalam response!");
        console.log("Full response structure:", response);
        alert("Transaksi berhasil dibuat, tetapi ID transaksi tidak ditemukan. Tidak dapat mencetak struk.");
        return;
      }
      
      console.log("Final transaction ID:", transactionId);
      
      // Format data untuk modal dengan nomor transaksi dari backend
      const detailData = {
        ...transaksiData,
        id_transaksi: transactionId, // Gunakan ID asli dari database
        nomor_transaksi: response.nomor_transaksi || response.data?.nomor_transaksi || `TRX-${Date.now()}`,
        tanggal: response.tanggal || response.data?.tanggal || new Date().toISOString(),
        total: tipeTransaksi === 'masuk' ? 0 : (response.harga_total || response.data?.harga_total || keranjang.reduce((a, b) => a + (Number(b.harga_total) || 0), 0)), // Total 0 untuk transaksi masuk
        items: keranjang // Gunakan data keranjang untuk tampilan yang lengkap
      };
      
      // Set detail transaksi dan tampilkan modal
      setDetailTransaksi(detailData);
      setShowModalTransaksi(true);
      
      // Auto Print struk jika printer terhubung (hanya untuk transaksi keluar/penjualan)
      if (tipeTransaksi === 'keluar' && isPrinterConnected) {
        console.log('Starting auto print for transaction:', transactionId);
        // Auto print struk dengan delay 1 detik untuk memastikan modal tertampil
        setTimeout(() => {
          autoPrintStruk(transactionId);
        }, 1000);
      }
      
      // Reset keranjang setelah transaksi berhasil
      setKeranjang([]);
      
      // Refresh data produk untuk update stok (terutama untuk transaksi masuk)
      console.log('Refreshing produk data after transaction...');
      await refreshProdukData();
      
    } catch (error) {
      console.error("Error saat membuat transaksi:", error);
      alert("Gagal membuat transaksi! " + (error as any)?.response?.data?.message || "Silakan coba lagi.");
    } finally {
      setLoadingTransaksi(false);
    }
  };

  // Fungsi cetak struk menggunakan endpoint /struk-html
  const cetakStruk = async () => {
    if (!detailTransaksi?.id_transaksi) {
      alert("ID transaksi tidak ditemukan!");
      return;
    }

    try {
      console.log("Cetak struk untuk transaksi ID:", detailTransaksi.id_transaksi);
      
      console.log("Calling getStrukHTML with withAuthRetry:", { 
        transaksiId: detailTransaksi.id_transaksi
      });
      
      // Ambil HTML struk dari backend menggunakan endpoint /struk-html dengan withAuthRetry
      const strukHtml = await withAuthRetry((token) => getStrukHTML(token, detailTransaksi.id_transaksi));
      
      console.log("HTML content received, length:", strukHtml?.length);
      
      // Perbaiki path gambar dalam HTML agar bisa diakses
      let modifiedHtml = strukHtml;
      
      // Ganti path relatif dengan absolute URL untuk gambar
      const baseUrl = window.location.origin;
      modifiedHtml = modifiedHtml.replace(
        /src=["'](?!http|data:)([^"']+)["']/g,
        `src="${baseUrl}/$1"`
      );
      
      // Tambahkan base tag untuk memastikan resource loading yang benar
      const htmlWithBase = `
        <!DOCTYPE html>
        <html>
        <head>
          <base href="${baseUrl}/">
          <meta charset="utf-8">
          <style>
            @media print {
              body { margin: 0; }
              img { max-width: 100% !important; height: auto !important; }
            }
          </style>
        </head>
        <body>
          ${modifiedHtml}
        </body>
        </html>
      `;
      
      // Buka window baru untuk cetak
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlWithBase);
        printWindow.document.close();
        
        // Tunggu sebentar agar gambar ter-load sebelum print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saat cetak struk:", error);
      alert("Gagal mencetak struk: " + error);
    }
  };

  // Fungsi simpan struk sebagai PDF menggunakan endpoint /struk-pdf
  const simpanStrukPDF = async () => {
    if (!detailTransaksi?.id_transaksi) {
      alert("ID transaksi tidak ditemukan!");
      return;
    }

    try {
      // Ambil PDF struk dari backend menggunakan endpoint /struk-pdf dengan withAuthRetry
      const pdfBlob = await withAuthRetry((token) => cetakStrukTransaksi(token, detailTransaksi.id_transaksi));
      
      // Buat URL untuk blob dan download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `struk-${detailTransaksi.nomor_transaksi || detailTransaksi.id_transaksi}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert("Struk PDF berhasil diunduh!");
    } catch (error) {
      console.error("Error saat simpan PDF:", error);
      alert("Gagal membuat PDF: " + error);
    }
  };

  return (
    <AutoPrintWrapper>
      <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8">
      {/* Kiri: Cari & Daftar Produk */}
      <div className="flex-1 space-y-6">
        {/* Pilihan Tipe Transaksi */}
        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔄</span>
            <span className="text-xl font-bold">Tipe Transaksi</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setTipeTransaksi('keluar')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                tipeTransaksi === 'keluar' 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
              }`}
            >
              📤 Barang Keluar
            </button>
            <button
              onClick={() => setTipeTransaksi('masuk')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all ${
                tipeTransaksi === 'masuk' 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
              }`}
            >
              📥 Barang Masuk
            </button>
          </div>
        </div>

        <div className="border rounded-2xl p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl"><ShoppingCart /></span>
            <span className="text-xl font-bold">Cari Produk</span>
          </div>
          <label className="font-semibold" htmlFor="cari-produk">Cari berdasarkan nama, kode barang, atau deskripsi</label>
          <div className="relative mt-2">
            <input 
              id="cari-produk" 
              className="block w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10" 
              placeholder="Ketik nama produk, kode barang, atau deskripsi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              Menampilkan hasil pencarian untuk: <span className="font-semibold">&ldquo;{searchQuery}&rdquo;</span>
              {produkList.length > 0 && (
                <span className="ml-2 text-blue-600">({produkList.length} produk ditemukan)</span>
              )}
            </div>
          )}
        </div>
        <div className="border rounded-2xl bg-white shadow-sm flex flex-col h-[600px]">
          {/* Header Section - Fixed */}
          <div className="p-6 border-b">
            <div className="font-bold text-lg mb-2">Daftar Produk</div>
            <div className="flex flex-wrap gap-4 mb-4">
              <select className="border rounded px-2 py-1 text-sm" value={filterKategori} onChange={e => setFilterKategori(e.target.value)}>
                <option value="">Semua Kategori</option>
                {kategoriList.length === 0 ? (
                  <option disabled value="">(Tidak ada data kategori)</option>
                ) : kategoriList.map((k) => (
                  <option key={k.id_kategori_barang} value={k.id_kategori_barang}>{k.nama_kategori}</option>
                ))}
              </select>
              <select className="border rounded px-2 py-1 text-sm" value={filterMerek} onChange={e => setFilterMerek(e.target.value)}>
                <option value="">Semua Merek</option>
                {merekList.length === 0 ? (
                  <option disabled value="">(Tidak ada data merek)</option>
                ) : merekList.map((m) => (
                  <option key={m.id_merek} value={m.id_merek}>{m.nama_merek}</option>
                ))}
              </select>
              {(filterKategori || filterMerek || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterKategori("");
                    setFilterMerek("");
                    setSearchQuery("");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="text-sm">Klik produk untuk menambahkan ke keranjang</div>
          </div>
          
          {/* Scrollable Product List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loadingProduk ? (
                <div className="col-span-full text-center text-gray-400 italic py-8">Memuat data produk...</div>
              ) : produkList.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 italic py-8">Tidak ada produk ditemukan.</div>
              ) : produkList.map((produk) => {
                // Cari nama kategori berdasarkan id
                const kategori = kategoriList.find(k => k.id_kategori_barang === produk.id_kategori_barang);
                const namaKategori = kategori ? kategori.nama_kategori : '';
                
                return (
                  <div
                    key={produk.id_sparepart}
                    className={`border rounded-xl p-4 cursor-pointer transition-all bg-white ${
                      produk.sisa > 0 
                        ? 'hover:shadow-lg hover:scale-105' 
                        : tipeTransaksi === 'masuk'
                          ? 'hover:shadow-lg hover:scale-105 border-orange-300 bg-orange-50'  // Untuk transaksi masuk, stok 0 masih bisa diklik
                          : 'opacity-60 border-red-300 bg-red-50 cursor-not-allowed'  // Untuk transaksi keluar, stok 0 tidak bisa diklik
                    }`}
                    onClick={() => {
                      // Cek stok hanya untuk transaksi keluar, jika 0 atau kurang maka tidak bisa ditambahkan
                      if (tipeTransaksi === 'keluar' && produk.sisa <= 0) {
                        return; // Tidak ada alert, langsung return
                      }
                      
                      console.log("Data produk dari server:", produk);
                      console.log("ID Sparepart:", produk.id_sparepart);
                      
                      tambahKeKeranjang({
                        id_sparepart: produk.id_sparepart || produk.id,
                        nama_barang: produk.nama_barang,
                        harga_jual: produk.harga_jual,
                        stok: produk.sisa,
                        kode_barang: produk.kode_barang,
                        kategori: produk.id_kategori_barang,
                        merek: produk.id_merek,
                      });
                    }}
                  >
                    {/* Nama Kategori + Nama Barang */}
                    <div className="font-semibold text-sm mb-1">
                      {namaKategori && (
                        <span className="text-blue-600 text-xs font-medium">
                          {highlightText(namaKategori, debouncedSearchQuery)} - 
                        </span>
                      )}
                      <span className="ml-1">
                        {highlightText(produk.nama_barang || "", debouncedSearchQuery)}
                      </span>
                    </div>
                    
                    <div className="text-xl font-bold text-green-600 mb-2">
                      Rp {produk.harga_jual.toLocaleString()}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      Stok: <span className={`font-semibold ${produk.sisa > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {produk.sisa}
                        {produk.sisa <= 0 && (
                          <span className={`ml-1 ${tipeTransaksi === 'masuk' ? 'text-orange-600' : 'text-red-600'}`}>
                            ⚠️ {tipeTransaksi === 'masuk' ? 'SILAHKAN RESTOK' : 'HABIS'}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400 mb-2">
                      Kode: {highlightText(produk.kode_barang || "", debouncedSearchQuery)}
                    </div>
                    
                    {produk.deskripsi && (
                      <div className="text-xs text-gray-400 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {highlightText(produk.deskripsi, debouncedSearchQuery)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Kanan: Keranjang Belanja */}
      <div className="w-full md:w-[400px]">
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-white to-blue-50 p-6 border border-blue-100 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-lg">
              <ShoppingCart />
              <span>Keranjang Belanja</span>
            </div>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{keranjang.length} item</span>
          </div>
          {/* Toggle eceran */}
          {/* <div className="flex items-center gap-2 mb-2">
            <label className="font-medium text-sm">Eceran</label>
            <input type="checkbox" checked={eceran} onChange={e => setEceran(e.target.checked)} className="accent-blue-600" />
            <span className="text-xs text-gray-400">(Input harga manual)</span>
          </div> */}
          {/* Pilihan tipe transaksi */}
          <div className="hidden">
            {/* Hidden - sudah ada di atas */}
          </div>
          {/* Daftar keranjang dinamis */}
          {keranjang.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <ShoppingCart size={48} />
              <div className="font-semibold text-lg mt-2">Keranjang kosong</div>
              <div className="text-sm">Tambahkan produk untuk memulai transaksi</div>
            </div>
          ) : (
            <div className="space-y-3">
              {keranjang.map((item) => (
                <div key={item.id_sparepart} className="flex items-center gap-2 border-b pb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{item.nama_barang}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => ubahQty(item.id_sparepart, Math.max(1, Number(e.target.value)))}
                        className="w-14 border rounded px-1 py-0.5 text-sm"
                      />
                      <span className="text-xs text-gray-500">x Rp {item.harga_jual.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <label className="text-xs">Eceran</label>
                      <input
                        type="checkbox"
                        checked={item.eceran}
                        onChange={e => toggleEceran(item.id_sparepart, e.target.checked)}
                        className="accent-blue-600"
                      />
                      {item.eceran && (
                        <input
                          type="text"
                          value={hargaEceranInput[item.id_sparepart] || formatRupiahInput(item.harga_total)}
                          onChange={(e) => {
                            const formatted = formatRupiahInput(e.target.value);
                            setHargaEceranInput(prev => ({
                              ...prev,
                              [item.id_sparepart]: formatted
                            }));
                            const numericValue = parseRupiahInput(e.target.value);
                            ubahHargaTotal(item.id_sparepart, numericValue);
                          }}
                          onBlur={() => {
                            // Reset format saat blur
                            setHargaEceranInput(prev => ({
                              ...prev,
                              [item.id_sparepart]: formatRupiahInput(item.harga_total)
                            }));
                          }}
                          className="w-24 border rounded px-1 py-0.5 text-xs"
                          placeholder="0"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => hapusItem(item.id_sparepart)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                    <div className="text-xs font-bold mt-2">
                      {tipeTransaksi === 'masuk' ? (
                        <span className="text-green-600">Rp 0</span>
                      ) : (
                        <span>Rp {item.harga_total.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Total harga keranjang */}
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-blue-700">
                  {tipeTransaksi === 'masuk' ? (
                    <span className="text-green-600">Rp 0</span>
                  ) : (
                    <span>Rp {keranjang.reduce((a, b) => a + (Number(b.harga_total) || 0), 0).toLocaleString()}</span>
                  )}
                </span>
              </div>

              {/* Pilihan Tipe Pembayaran */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-semibold mb-2">Tipe Pembayaran:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTipePembayaran('cash');
                      setDueDate(''); // Reset due date ketika pilih cash
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                      tipePembayaran === 'cash' 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    onClick={() => setTipePembayaran('kredit')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold border transition-all ${
                      tipePembayaran === 'kredit' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    💳 Kredit
                  </button>
                </div>
              </div>

              {/* Input Tanggal Jatuh Tempo (hanya muncul jika kredit) */}
              {tipePembayaran === 'kredit' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <label className="block text-sm font-semibold mb-2 text-yellow-800">
                    Tanggal Jatuh Tempo: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Minimal hari ini
                    className="w-full p-2 border border-yellow-300 rounded-lg text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    required
                  />
                  <p className="text-xs text-yellow-700 mt-1">
                    Wajib diisi untuk pembayaran kredit
                  </p>
                </div>
              )}

              {/* Input Keterangan */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-semibold mb-2">Keterangan (Opsional):</label>
                <textarea
                  value={keteranganTransaksi}
                  onChange={(e) => setKeteranganTransaksi(e.target.value)}
                  placeholder="Masukkan keterangan transaksi..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={2}
                />
              </div>

              {/* Status Auto Print */}
              {tipeTransaksi === 'keluar' && (
                <div className={`mt-4 p-3 rounded-lg border ${isPrinterConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className={`text-sm font-medium ${isPrinterConnected ? 'text-green-700' : 'text-yellow-700'}`}>
                      Auto Print: {isPrinterConnected ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isPrinterConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isPrinterConnected 
                      ? 'Struk akan dicetak otomatis setelah transaksi selesai' 
                      : 'Printer tidak terhubung - struk tidak akan dicetak otomatis'
                    }
                  </p>
                </div>
              )}

              {/* Button Selesaikan Transaksi */}
              <button
                onClick={selesaikanTransaksi}
                disabled={loadingTransaksi || keranjang.length === 0}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingTransaksi ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    🧾 Selesaikan Transaksi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail Transaksi */}
      {showModalTransaksi && detailTransaksi && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            // Tutup modal jika klik di background
            if (e.target === e.currentTarget) {
              setShowModalTransaksi(false);
              // Refresh data saat tutup modal
              refreshProdukData();
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold text-green-600">✅ Transaksi Berhasil!</h2>
              <p className="text-sm text-gray-600 mt-1">Detail transaksi telah disimpan</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="font-semibold">No. Transaksi:</span>
                <span className="font-mono text-sm">{detailTransaksi.nomor_transaksi}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Tanggal:</span>
                <span className="text-sm">{new Date(detailTransaksi.tanggal).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Tipe:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  detailTransaksi.tipe === 'masuk' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {detailTransaksi.tipe === 'masuk' ? '📥 Barang Masuk' : '📤 Barang Keluar'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Pembayaran:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  detailTransaksi.tipe_pembayaran === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {detailTransaksi.tipe_pembayaran === 'cash' ? '💵 Cash' : '💳 Kredit'}
                </span>
              </div>
            </div>

            <div className="border-t border-b py-4 mb-4">
              <h3 className="font-semibold mb-3">
                {tipeTransaksi === 'masuk' ? 'Item yang direstok:' : 'Item yang dibeli:'}
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detailTransaksi.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{item.nama_barang}</div>
                      <div className="text-gray-500 text-xs">
                        {item.qty} x {tipeTransaksi === 'masuk' ? 'unit' : `Rp ${item.harga_jual.toLocaleString()}`}
                        {item.eceran && tipeTransaksi !== 'masuk' && <span className="text-orange-600"> (Eceran)</span>}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {tipeTransaksi === 'masuk' ? (
                        <span className="text-green-600">+ {item.qty} unit</span>
                      ) : (
                        <span>Rp {item.harga_total.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-lg font-bold mb-6">
              <span>TOTAL:</span>
              <span className={`${tipeTransaksi === 'masuk' ? 'text-green-600' : 'text-green-600'}`}>
                Rp {(detailTransaksi.total || 0).toLocaleString()}
                {tipeTransaksi === 'masuk' && (
                  <span className="text-xs font-normal text-gray-500 ml-2">(Transaksi Masuk)</span>
                )}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cetakStruk}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
              >
                🖨️ Cetak Struk
              </button>
              <button
                onClick={simpanStrukPDF}
                className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold"
              >
                📄 Simpan PDF
              </button>
              <button
                onClick={() => {
                  setShowModalTransaksi(false);
                  // Optional: refresh data lagi saat tutup modal untuk memastikan
                  refreshProdukData();
                }}
                className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AutoPrintWrapper>
  );
}
