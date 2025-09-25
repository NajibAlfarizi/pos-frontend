/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState, useMemo, useRef } from "react";
import { getProfile, apiWithRefresh } from "@/lib/api/authHelper";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGlobalLoading } from "@/app/GlobalLoadingContext";
import { 
  getAllRetur, 
  addRetur, 
  updateRetur, 
  deleteRetur, 
  getReturStats 
} from "@/lib/api/returHelper";
import { getAllSparepart } from "@/lib/api/sparepartHelper";
import { 
  Package, 
  RotateCcw, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar,
  TrendingDown,
  AlertTriangle
} from "lucide-react";

// Helper function to convert UTC to WIB
const toWIBTime = (dateString: string) => {
  const date = new Date(dateString);
  // Convert to WIB (UTC+7)
  const wibOffset = 7 * 60; // 7 hours in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (wibOffset * 60000));
  return wibTime;
};

const ReturPage: React.FC = () => {
  const { setLoading: setIsLoading } = useGlobalLoading();
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [returList, setReturList] = useState<any[]>([]);
  const [sparepartList, setSparepartList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRetur, setSelectedRetur] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const router = useRouter();

  // Form states
  const [formData, setFormData] = useState({
    id_sparepart: '',
    jumlah_retur: '',
    keterangan: ''
  });

  // Search states for sparepart
  const [sparepartSearch, setSparepartSearch] = useState('');
  const [showSparepartDropdown, setShowSparepartDropdown] = useState(false);
  const [selectedSparepartName, setSelectedSparepartName] = useState('');
  
  // Refs
  const sparepartDropdownRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    id_sparepart: '',
    start_date: '',
    end_date: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    try {
      const user = getProfile();
      setProfile(user);
      setToken(user.access_token);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const fetchRetur = async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      
      const response = await apiWithRefresh(
        (t) => getAllRetur(t, params),
        token,
        setToken,
        () => {},
        router
      );

      setReturList(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching retur:', error);
      toast.error('Gagal memuat data retur');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const fetchSparepart = async () => {
    setIsLoading(true);
    try {
      const response = await apiWithRefresh(
        (t) => getAllSparepart(t),
        token,
        setToken,
        () => {},
        router
      );

      setSparepartList(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching sparepart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await apiWithRefresh(
        (t) => getReturStats(t),
        token,
        setToken,
        () => {},
        router
      );

      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    if (!token) return;
    
    const fetchAllData = async () => {
      await Promise.all([
        fetchRetur(),
        fetchSparepart(),
        fetchStats()
      ]);
    };

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sparepartDropdownRef.current && !sparepartDropdownRef.current.contains(event.target as Node)) {
        setShowSparepartDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter sparepart berdasarkan search
  const filteredSparepart = useMemo(() => {
    if (!sparepartSearch) return sparepartList;
    
    return sparepartList.filter(item => 
      item.nama_barang?.toLowerCase().includes(sparepartSearch.toLowerCase()) ||
      item.kode_barang?.toLowerCase().includes(sparepartSearch.toLowerCase())
    );
  }, [sparepartList, sparepartSearch]);

  // Filter data berdasarkan pencarian
  const filteredRetur = useMemo(() => {
    if (!filters.search) return returList;

    return returList.filter(item => 
      item.sparepart?.nama_barang?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.sparepart?.kode_barang?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.keterangan?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [returList, filters.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_sparepart || !formData.jumlah_retur) {
      toast.error('Semua field wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        jumlah_retur: parseInt(formData.jumlah_retur)
      };

      if (modalMode === 'add') {
        await apiWithRefresh(
          (t) => addRetur(t, submitData),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Retur berhasil ditambahkan');
      } else {
        await apiWithRefresh(
          (t) => updateRetur(t, selectedRetur.id_retur, submitData),
          token,
          setToken,
          () => {},
          router
        );
        toast.success('Retur berhasil diperbarui');
      }

      setShowModal(false);
      resetForm();
      await fetchRetur();
      await fetchStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await apiWithRefresh(
        (t) => deleteRetur(t, deleteId),
        token,
        setToken,
        () => {},
        router
      );
      toast.success('Retur berhasil dihapus');
      await fetchRetur();
      await fetchStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal menghapus retur');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteId('');
    }
  };

  const resetForm = () => {
    setFormData({
      id_sparepart: '',
      jumlah_retur: '',
      keterangan: ''
    });
    setSparepartSearch('');
    setSelectedSparepartName('');
    setShowSparepartDropdown(false);
    setSelectedRetur(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId('');
  };

  const openModal = (mode: 'add' | 'edit', retur?: any) => {
    setModalMode(mode);
    if (mode === 'edit' && retur) {
      setSelectedRetur(retur);
      setFormData({
        id_sparepart: retur.id_sparepart,
        jumlah_retur: retur.jumlah_retur.toString(),
        keterangan: retur.keterangan || ''
      });
      // Set selected sparepart name for display
      const selectedSparepart = sparepartList.find(s => s.id_sparepart === retur.id_sparepart);
      if (selectedSparepart) {
        setSelectedSparepartName(`${selectedSparepart.nama_barang} - ${selectedSparepart.kode_barang}`);
        setSparepartSearch(`${selectedSparepart.nama_barang} - ${selectedSparepart.kode_barang}`);
      }
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const selectSparepart = (sparepart: any) => {
    setFormData({ ...formData, id_sparepart: sparepart.id_sparepart });
    setSparepartSearch(`${sparepart.nama_barang} - ${sparepart.kode_barang}`);
    setSelectedSparepartName(`${sparepart.nama_barang} - ${sparepart.kode_barang}`);
    setShowSparepartDropdown(false);
  };

  const openDetailModal = (retur: any) => {
    setSelectedRetur(retur);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 pb-28 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <RotateCcw className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              Manajemen Retur
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Kelola data retur barang</p>
          </div>
          <button
            onClick={() => openModal('add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm md:text-base w-full md:w-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Tambah Retur
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="bg-red-100 p-2 md:p-3 rounded-xl">
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">Total Retur</h3>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats?.overall_summary?.total_retur || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="bg-orange-100 p-2 md:p-3 rounded-xl">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">Total Jumlah Retur</h3>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {stats?.overall_summary?.total_jumlah_retur || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 md:col-span-1 col-span-1">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="bg-yellow-100 p-2 md:p-3 rounded-xl">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-1">Retur Bulan Ini</h3>
            <p className="text-xl md:text-2xl font-bold text-gray-800">
              {Number(Object.values(stats?.monthly_stats || {}).reduce((acc: any, month: any) => acc + month.count, 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                type="text"
                placeholder="Cari nama barang, kode barang..."
                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <select
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              value={filters.id_sparepart}
              onChange={(e) => setFilters({ ...filters, id_sparepart: e.target.value })}
            >
              <option value="">Semua Sparepart</option>
              {sparepartList.map((sparepart) => (
                <option key={sparepart.id_sparepart} value={sparepart.id_sparepart}>
                  {sparepart.nama_barang} - {sparepart.kode_barang}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              placeholder="Tanggal Mulai"
            />

            <input
              type="date"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              placeholder="Tanggal Akhir"
            />
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 mb-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center py-8 text-gray-500">
                <RotateCcw className="w-8 h-8 mx-auto mb-3 text-gray-300 animate-spin" />
                <p>Memuat data...</p>
              </div>
            </div>
          ) : filteredRetur.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Tidak ada data retur</p>
                <p className="text-sm">Belum ada data retur untuk ditampilkan</p>
              </div>
            </div>
          ) : (
            filteredRetur.map((retur) => (
              <div key={retur.id_retur} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-4">
                  {/* Header with date and status */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-100 p-1.5 rounded-lg">
                        <RotateCcw className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {retur.sparepart?.nama_barang || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {retur.sparepart?.kode_barang}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {toWIBTime(retur.tanggal_retur).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                        {retur.jumlah_retur} pcs
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Kategori</span>
                      <span className="text-xs text-gray-900">
                        {retur.sparepart?.kategori_barang?.nama_kategori || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Merek</span>
                      <span className="text-xs text-gray-900">
                        {retur.sparepart?.merek?.nama_merek || '-'}
                      </span>
                    </div>
                    {retur.keterangan && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500">Keterangan:</span>
                        <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 rounded">{retur.keterangan}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openDetailModal(retur)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Detail
                    </button>
                    <button
                      onClick={() => openModal('edit', retur)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(retur.id_retur)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Tanggal</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Nama Barang</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Kategori</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Merek</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Jumlah Retur</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Keterangan</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredRetur.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada data retur
                    </td>
                  </tr>
                ) : (
                  filteredRetur.map((retur) => (
                    <tr key={retur.id_retur} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="text-sm text-gray-900">
                          {toWIBTime(retur.tanggal_retur).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900">
                          {retur.sparepart?.nama_barang || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {retur.sparepart?.kode_barang}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {retur.sparepart?.kategori_barang?.nama_kategori || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {retur.sparepart?.merek?.nama_merek || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                          {retur.jumlah_retur}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {retur.keterangan || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailModal(retur)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', retur)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(retur.id_retur)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-gray-100 gap-3 md:gap-0">
              <div className="text-xs md:text-sm text-gray-500 order-2 md:order-1">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-2 order-1 md:order-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 min-w-[80px]"
                >
                  <span className="hidden md:inline">Sebelumnya</span>
                  <span className="md:hidden">Prev</span>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 min-w-[80px]"
                >
                  <span className="hidden md:inline">Selanjutnya</span>
                  <span className="md:hidden">Next</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  {modalMode === 'add' ? 'Tambah Retur' : 'Edit Retur'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative" ref={sparepartDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sparepart <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sparepartSearch}
                      onChange={(e) => {
                        setSparepartSearch(e.target.value);
                        setShowSparepartDropdown(true);
                        if (!e.target.value) {
                          setFormData({ ...formData, id_sparepart: '' });
                          setSelectedSparepartName('');
                        }
                      }}
                      onFocus={() => setShowSparepartDropdown(true)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      placeholder="Cari sparepart..."
                      required
                      disabled={modalMode === 'edit'}
                    />
                    
                    {/* Dropdown untuk hasil search */}
                    {showSparepartDropdown && filteredSparepart.length > 0 && modalMode === 'add' && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 md:max-h-60 overflow-y-auto">
                        {filteredSparepart.map((sparepart) => (
                          <div
                            key={sparepart.id_sparepart}
                            onClick={() => selectSparepart(sparepart)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 text-sm">{sparepart.nama_barang}</div>
                            <div className="text-xs text-gray-500">{sparepart.kode_barang}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Retur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.jumlah_retur}
                      onChange={(e) => setFormData({ ...formData, jumlah_retur: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keterangan
                    </label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      rows={3}
                      placeholder="Alasan retur..."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <button
                      type="submit"
                      className="order-1 md:order-1 flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
                    >
                      {modalMode === 'add' ? 'Tambah' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="order-2 md:order-2 flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail */}
        {showDetailModal && selectedRetur && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Detail Retur</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Kolom Kiri */}
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">ID Retur</label>
                      <p className="text-sm md:text-base text-gray-900 font-medium break-all">{selectedRetur.id_retur}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Nama Barang</label>
                      <p className="text-sm md:text-base text-gray-900 font-medium">{selectedRetur.sparepart?.nama_barang}</p>
                      <p className="text-xs md:text-sm text-gray-500">{selectedRetur.sparepart?.kode_barang}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Kategori</label>
                      <p className="text-sm md:text-base text-gray-900">{selectedRetur.sparepart?.kategori_barang?.nama_kategori || '-'}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Merek</label>
                      <p className="text-sm md:text-base text-gray-900">{selectedRetur.sparepart?.merek?.nama_merek || '-'}</p>
                    </div>
                  </div>

                  {/* Kolom Kanan */}
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Harga Jual</label>
                      <p className="text-sm md:text-base text-gray-900 font-medium">Rp {selectedRetur.sparepart?.harga_jual?.toLocaleString('id-ID') || '0'}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Jumlah Retur</label>
                      <p className="text-sm md:text-base text-gray-900 font-medium">{selectedRetur.jumlah_retur}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Tanggal Retur</label>
                      <p className="text-sm md:text-base text-gray-900">
                        {toWIBTime(selectedRetur.tanggal_retur).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500">
                        {toWIBTime(selectedRetur.tanggal_retur).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })} WIB
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-500 mb-1">Keterangan</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm md:text-base text-gray-900 break-words">{selectedRetur.keterangan || 'Tidak ada keterangan'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-100 mt-4 md:mt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full md:w-auto bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 md:px-6 rounded-lg font-medium transition-colors text-sm md:text-base"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-2 md:p-3 rounded-full mr-3 md:mr-4">
                    <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-gray-800">Konfirmasi Hapus</h2>
                    <p className="text-xs md:text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>

                <p className="text-sm md:text-base text-gray-700 mb-4 md:mb-6">
                  Apakah Anda yakin ingin menghapus data retur ini? Data yang sudah dihapus tidak dapat dikembalikan.
                </p>

                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={confirmDelete}
                    className="order-1 md:order-1 flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={cancelDelete}
                    className="order-2 md:order-2 flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors text-sm md:text-base"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturPage;