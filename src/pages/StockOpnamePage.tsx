import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { StockOpnameItem, StockOpnameReport, StockOpnameStatus } from '../types';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  History, 
  Layers, 
  Info,
  Check,
  Eye,
  X
} from 'lucide-react';

export const StockOpnamePage: React.FC = () => {
  const { products, stockOpnameReports, applyStockOpname } = useStore();
  const { currentUser } = useAuth();

  // Active view tab: 'input' (Formulir SO) or 'history' (Riwayat SO)
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'history'>('input');

  // --- FORMULIR SO STATE ---
  // Initialized from current products list
  const [opnameItems, setOpnameItems] = useState<StockOpnameItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockOpnameStatus>('ALL');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // --- RIWAYAT SO STATE (CUSTOM DATE FILTER) ---
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }, []);

  const [historyStartDate, setHistoryStartDate] = useState(firstDayOfMonthStr);
  const [historyEndDate, setHistoryEndDate] = useState(todayStr);
  const [selectedReportDetail, setSelectedReportDetail] = useState<StockOpnameReport | null>(null);

  // Initialize or re-sync opname items when products change (only if opnameItems is empty)
  useEffect(() => {
    if (products.length > 0 && opnameItems.length === 0) {
      const initial: StockOpnameItem[] = products.map((prod) => ({
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        category: prod.category,
        unit: prod.baseUnit,
        systemStock: prod.stock,
        physicalStock: prod.stock, // Default matches system for seamless workflow
        difference: 0,
        status: 'sesuai',
        notes: '',
        costBase: prod.costBase || 0,
        differenceValue: 0,
      }));
      setOpnameItems(initial);
    }
  }, [products, opnameItems.length]);

  // Handle physical stock change for an item
  const handlePhysicalStockChange = (productId: string, valStr: string) => {
    const rawVal = valStr.trim();
    const parsed = rawVal === '' ? 0 : parseFloat(rawVal);
    const safePhysical = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setOpnameItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const diff = Math.round((safePhysical - item.systemStock) * 1000) / 1000;
        let status: StockOpnameStatus = 'sesuai';
        if (diff < -0.0001) status = 'selisih_kurang';
        else if (diff > 0.0001) status = 'selisih_lebih';

        const diffVal = Math.round(diff * (item.costBase || 0));

        return {
          ...item,
          physicalStock: safePhysical,
          difference: diff,
          status,
          differenceValue: diffVal,
        };
      })
    );
  };

  // Handle note change for an item
  const handleItemNoteChange = (productId: string, note: string) => {
    setOpnameItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, notes: note } : item))
    );
  };

  // Quick Action: Reset all physical stock to match current system stock
  const handleResetToSystem = () => {
    if (confirm('Atur ulang seluruh stok fisik agar persis sama dengan stok sistem?')) {
      const resetItems: StockOpnameItem[] = products.map((prod) => ({
        productId: prod.id,
        productCode: prod.code,
        productName: prod.name,
        category: prod.category,
        unit: prod.baseUnit,
        systemStock: prod.stock,
        physicalStock: prod.stock,
        difference: 0,
        status: 'sesuai',
        notes: '',
        costBase: prod.costBase || 0,
        differenceValue: 0,
      }));
      setOpnameItems(resetItems);
    }
  };

  // Quick Action: Reset all physical stock to 0 (Fresh physical count from scratch)
  const handleResetToZero = () => {
    if (confirm('Kosongkan semua isian stok fisik menjadi 0 untuk penghitungan manual dari awal?')) {
      setOpnameItems((prev) =>
        prev.map((item) => {
          const diff = -item.systemStock;
          const status: StockOpnameStatus = diff === 0 ? 'sesuai' : 'selisih_kurang';
          return {
            ...item,
            physicalStock: 0,
            difference: diff,
            status,
            differenceValue: Math.round(diff * (item.costBase || 0)),
          };
        })
      );
    }
  };

  // Filtered opname items based on search, category, and status
  const categoriesList = useMemo(() => {
    const setCat = new Set<string>();
    products.forEach((p) => p.category && setCat.add(p.category));
    return Array.from(setCat).sort();
  }, [products]);

  const filteredOpnameItems = useMemo(() => {
    return opnameItems.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.productCode.toLowerCase().includes(q);
        const matchName = item.productName.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Status
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [opnameItems, searchQuery, selectedCategory, statusFilter]);

  // Overall Statistics for current input form
  const stats = useMemo(() => {
    const total = opnameItems.length;
    const sesuai = opnameItems.filter((i) => i.status === 'sesuai').length;
    const kurang = opnameItems.filter((i) => i.status === 'selisih_kurang').length;
    const lebih = opnameItems.filter((i) => i.status === 'selisih_lebih').length;
    const totalSelisihVal = opnameItems.reduce((acc, i) => acc + (i.differenceValue || 0), 0);
    const itemsWithDifference = opnameItems.filter((i) => Math.abs(i.difference) > 0.0001);

    return {
      total,
      sesuai,
      kurang,
      lebih,
      totalSelisihVal,
      diffCount: itemsWithDifference.length,
      itemsWithDifference,
    };
  }, [opnameItems]);

  // Save & Apply Stock Opname to Database
  const handleSaveStockOpname = async () => {
    setIsSaving(true);
    try {
      const cashierName = currentUser?.name || 'Petugas Toko';
      const cashierId = currentUser?.id;

      const res = await applyStockOpname(opnameItems, sessionNotes, cashierName, cashierId);
      if (res.success) {
        setSaveSuccessMsg(
          `Berhasil menyimpan hasil Stok Opname ${res.report.opnameNumber}! ${res.updatedCount} produk diperbarui di database.`
        );
        setIsConfirmModalOpen(false);
        setSessionNotes('');
        // Reinitialize items with the newly updated product stock
        setTimeout(() => {
          setSaveSuccessMsg(null);
        }, 5000);
      } else {
        alert('Gagal menyimpan hasil Stok Opname. Silakan coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Export current input table to Excel
  const handleExportCurrentTable = () => {
    storage.exportStockOpnameToExcel(opnameItems, {
      cashierName: currentUser?.name || 'Petugas Toko',
      notes: sessionNotes || 'Draf Hasil Stok Opname Langsung',
      title: 'FORMULIR HASIL STOK OPNAME TOKO',
    });
  };

  // --- RIWAYAT STOK OPNAME FILTER & EXPORT ---
  const filteredReports = useMemo(() => {
    const start = new Date(`${historyStartDate}T00:00:00`);
    const end = new Date(`${historyEndDate}T23:59:59.999`);

    return stockOpnameReports.filter((rep) => {
      const d = new Date(rep.date || rep.createdAt);
      return d >= start && d <= end;
    });
  }, [stockOpnameReports, historyStartDate, historyEndDate]);

  const handleExportHistoryToExcel = () => {
    storage.exportStockOpnameHistoryToExcel(historyStartDate, historyEndDate);
  };

  const handleQuickDatePreset = (preset: 'today' | '7days' | '30days' | 'month' | 'all') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setHistoryStartDate(today);
      setHistoryEndDate(today);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setHistoryStartDate(d.toISOString().split('T')[0]);
      setHistoryEndDate(today);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setHistoryStartDate(d.toISOString().split('T')[0]);
      setHistoryEndDate(today);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(1);
      setHistoryStartDate(d.toISOString().split('T')[0]);
      setHistoryEndDate(today);
    } else if (preset === 'all') {
      setHistoryStartDate('2024-01-01');
      setHistoryEndDate(today);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 pb-24 lg:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-600 mb-1">
            <ClipboardCheck className="w-6 h-6 stroke-[2.2]" />
            <span className="text-xs font-black tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Audit & Inventarisasi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Stok Opname (SO) Sembako
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencocokan stok fisik riil toko dengan sistem, hitung selisih otomatis secara real-time, dan audit log penyesuaian.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-center border border-slate-200">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'input'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Formulir Input Opname</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Opname</span>
            {stockOpnameReports.length > 0 && (
              <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {stockOpnameReports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification Banner on Success */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="flex-1">{saveSuccessMsg}</span>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          SUBTAB 1: FORMULIR INPUT OPNAME
         ======================================================== */}
      {activeSubTab === 'input' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Produk</span>
              <span className="text-xl font-black text-slate-800">{stats.total}</span>
              <span className="text-[10px] text-slate-400 block">SKU Terdaftar</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <span className="text-[11px] font-semibold text-emerald-700 block">Stok Sesuai</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-black text-emerald-700">{stats.sesuai}</span>
              </div>
              <span className="text-[10px] text-emerald-600/80 block">Selisih = 0</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-xs bg-rose-50/20">
              <span className="text-[11px] font-semibold text-rose-700 block">Selisih Kurang</span>
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span className="text-xl font-black text-rose-700">{stats.kurang}</span>
              </div>
              <span className="text-[10px] text-rose-600/80 block">Stok Hilang / Rusak</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-xs bg-blue-50/20">
              <span className="text-[11px] font-semibold text-blue-700 block">Selisih Lebih</span>
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span className="text-xl font-black text-blue-700">{stats.lebih}</span>
              </div>
              <span className="text-[10px] text-blue-600/80 block">Surplus Fisik</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-xs bg-amber-50/20 col-span-2 sm:col-span-1 lg:col-span-2">
              <span className="text-[11px] font-semibold text-amber-800 block">Total Nilai Selisih HPP</span>
              <span className={`text-xl font-black ${stats.totalSelisihVal < 0 ? 'text-rose-600' : stats.totalSelisihVal > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                {stats.totalSelisihVal < 0 ? '-' : stats.totalSelisihVal > 0 ? '+' : ''}
                Rp {Math.abs(stats.totalSelisihVal).toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {stats.diffCount} produk memerlukan penyesuaian
              </span>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search SKU or Name */}
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode SKU atau nama barang..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Status Selisih</option>
                  <option value="sesuai">Hanya Sesuai (0)</option>
                  <option value="selisih_kurang">Hanya Selisih Kurang (-)</option>
                  <option value="selisih_lebih">Hanya Selisih Lebih (+)</option>
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetToSystem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  title="Salin semua nilai stok sistem ke stok fisik"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Set Semua Sesuai Sistem</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToZero}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  title="Kosongkan stok fisik menjadi 0 untuk hitung dari awal"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset ke 0</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCurrentTable}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  title="Unduh tabel hasil opname ke Excel (.xlsx) dengan rumus selisih"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Download Excel (XLSX)</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN OPNAME TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold tracking-wide uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3 w-10 text-center">No</th>
                    <th className="px-3.5 py-3 w-28">Kode / SKU</th>
                    <th className="px-3.5 py-3 min-w-[180px]">Nama Barang Sembako</th>
                    <th className="px-3.5 py-3 w-28">Kategori</th>
                    <th className="px-3.5 py-3 w-20 text-center">Satuan</th>
                    <th className="px-3.5 py-3 w-28 text-right bg-slate-800">Stok Sistem</th>
                    <th className="px-3.5 py-3 w-32 text-center bg-emerald-950 text-emerald-200">
                      Stok Fisik
                    </th>
                    <th className="px-3.5 py-3 w-28 text-right">Selisih</th>
                    <th className="px-3.5 py-3 w-32 text-center">Status</th>
                    <th className="px-3.5 py-3 min-w-[180px]">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpnameItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        Tidak ada barang yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOpnameItems.map((item, idx) => {
                      const diff = item.difference;
                      const hasDiff = Math.abs(diff) > 0.0001;
                      const isLess = diff < -0.0001;
                      const isMore = diff > 0.0001;

                      return (
                        <tr
                          key={item.productId}
                          className={`hover:bg-slate-50/80 transition ${
                            isLess ? 'bg-rose-50/30' : isMore ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-slate-700">
                            {item.productCode}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="font-bold text-slate-800 block text-xs">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              HPP: Rp {(item.costBase || 0).toLocaleString('id-ID')} / {item.unit}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center text-slate-600 font-bold uppercase text-[11px]">
                            {item.unit}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-slate-700 bg-slate-50/60">
                            {item.systemStock.toLocaleString('id-ID')}
                          </td>
                          <td className="px-3.5 py-2.5 text-center bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.physicalStock}
                              onChange={(e) => handlePhysicalStockChange(item.productId, e.target.value)}
                              className="w-24 px-2 py-1.5 text-center font-mono font-black text-sm bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs ${
                                isLess
                                  ? 'text-rose-700 bg-rose-100 font-black'
                                  : isMore
                                  ? 'text-blue-700 bg-blue-100 font-black'
                                  : 'text-emerald-700 bg-emerald-100'
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            {isLess ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                Selisih Kurang
                              </span>
                            ) : isMore ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                <ArrowUpRight className="w-3 h-3 text-blue-600" />
                                Selisih Lebih
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Sesuai
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleItemNoteChange(item.productId, e.target.value)}
                              placeholder={hasDiff ? 'Alasan selisih (rusak/bocor/dll)...' : 'Catatan opsional...'}
                              className={`w-full px-2.5 py-1 text-xs rounded border transition ${
                                hasDiff
                                  ? 'border-amber-300 bg-amber-50/50 text-slate-800'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              } focus:bg-white focus:outline-none focus:border-emerald-500`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Bar & Save Action */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Ditemukan <strong>{stats.diffCount} produk selisih</strong> dari total {stats.total} produk. Menekan tombol simpan akan langsung menyesuaikan stok di database dan dicatat di Audit Log Stok.
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Sesuaikan Stok</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUBTAB 2: RIWAYAT STOK OPNAME (CUSTOM DATE FILTER)
         ======================================================== */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Custom Date Range Picker Toolbar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Filter Rentang Tanggal:</span>
                </div>

                {/* Dari Tanggal */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Dari:</span>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Sampai Tanggal */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Sampai:</span>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportHistoryToExcel}
                  disabled={filteredReports.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel Riwayat SO (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Pilihan Cepat:
              </span>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('today')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('7days')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('30days')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('month')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('all')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Semua Riwayat
              </button>
            </div>
          </div>

          {/* History Reports List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Sesi Stok Opname Selesai
                </h3>
                <p className="text-xs text-slate-400">
                  Menampilkan {filteredReports.length} sesi pemeriksaan stok pada periode {historyStartDate} s/d {historyEndDate}
                </p>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Belum ada riwayat Stok Opname pada rentang tanggal ini.</p>
                <p className="text-xs text-slate-400">
                  Silakan ubah filter tanggal atau lakukan stok opname baru di tab "Formulir Input Opname".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const dt = new Date(report.date || report.createdAt);
                  const dateStr = dt.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                  const timeStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={report.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {report.opnameNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            {dateStr} • {timeStr}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            oleh <strong className="text-slate-700">{report.cashierName}</strong>
                          </span>
                        </div>

                        {report.notes && (
                          <p className="text-xs text-slate-600 italic">
                            Catatan: "{report.notes}"
                          </p>
                        )}

                        {/* Breakdown Badges */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {report.countedProducts} Produk Diperiksa
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {report.matchedCount} Sesuai
                          </span>
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {report.shortageCount} Selisih Kurang
                          </span>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {report.surplusCount} Selisih Lebih
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            report.totalDifferenceValue < 0 
                              ? 'text-rose-700 bg-rose-50 border border-rose-200' 
                              : report.totalDifferenceValue > 0 
                              ? 'text-blue-700 bg-blue-50 border border-blue-200' 
                              : 'text-slate-600 bg-slate-100'
                          }`}>
                            Nilai Selisih: {report.totalDifferenceValue < 0 ? '-' : report.totalDifferenceValue > 0 ? '+' : ''}Rp {Math.abs(report.totalDifferenceValue).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedReportDetail(report)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian Item</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            storage.exportStockOpnameToExcel(report.items, {
                              opnameNumber: report.opnameNumber,
                              cashierName: report.cashierName,
                              date: report.date,
                              notes: report.notes,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs"
                          title="Unduh file Excel untuk sesi laporan ini"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                          <span>Unduh Excel</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: KONFIRMASI SIMPAN & SESUAIKAN STOK
         ======================================================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">
                  Konfirmasi Penyesuaian Stok
                </h3>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan memperbarui stok database untuk <strong>{stats.diffCount} produk</strong> yang mengalami selisih fisik. Perubahan ini akan otomatis dicatat ke dalam <strong>Audit Log Stok Toko</strong>.
            </p>

            {/* Quick stats in modal */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Total SKU</span>
                <span className="text-sm font-black text-slate-800">{stats.total}</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 block font-semibold">Selisih Kurang</span>
                <span className="text-sm font-black text-rose-700">{stats.kurang}</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-500 block font-semibold">Selisih Lebih</span>
                <span className="text-sm font-black text-blue-700">{stats.lebih}</span>
              </div>
            </div>

            {/* Session Notes Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Sesi Stok Opname (Opsional):
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Misal: SO Rutin Akhir Pekan, pemeriksaan rak minyak & beras..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStockOpname}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:bg-slate-300"
              >
                {isSaving ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Ya, Simpan & Sesuaikan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RINCIAN ITEM SESI DOKUMEN SO
         ======================================================== */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">
                  Rincian Dokumen
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedReportDetail.opnameNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedReportDetail.date || selectedReportDetail.createdAt).toLocaleString('id-ID')} • Kasir: {selectedReportDetail.cashierName}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">No</th>
                    <th className="px-3 py-2">Kode</th>
                    <th className="px-3 py-2">Nama Barang</th>
                    <th className="px-3 py-2 text-right">Stok Sistem</th>
                    <th className="px-3 py-2 text-right">Stok Fisik</th>
                    <th className="px-3 py-2 text-right">Selisih</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReportDetail.items.map((item, idx) => {
                    const diff = item.difference;
                    const isLess = diff < 0;
                    const isMore = diff > 0;
                    return (
                      <tr key={idx} className={isLess ? 'bg-rose-50/30' : isMore ? 'bg-blue-50/30' : ''}>
                        <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{item.productCode}</td>
                        <td className="px-3 py-2 font-bold text-slate-800">{item.productName}</td>
                        <td className="px-3 py-2 text-right font-mono">{item.systemStock} {item.unit}</td>
                        <td className="px-3 py-2 text-right font-mono font-black">{item.physicalStock} {item.unit}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">
                          <span className={isLess ? 'text-rose-600' : isMore ? 'text-blue-600' : 'text-emerald-600'}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isLess ? 'bg-rose-100 text-rose-800' : isMore ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 italic">{item.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                Total {selectedReportDetail.items.length} produk diperiksa
              </span>
              <button
                type="button"
                onClick={() =>
                  storage.exportStockOpnameToExcel(selectedReportDetail.items, {
                    opnameNumber: selectedReportDetail.opnameNumber,
                    cashierName: selectedReportDetail.cashierName,
                    date: selectedReportDetail.date,
                    notes: selectedReportDetail.notes,
                  })
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Unduh Excel Sesi Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
