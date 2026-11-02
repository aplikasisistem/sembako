import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { storage } from '../services/storage';
import { Transaction } from '../types';
import { ThermalReceipt } from '../components/ThermalReceipt';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  User, 
  Clock, 
  X,
  CreditCard,
  Banknote
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { transactions } = useStore();

  // Custom Date Range Filters (Default: This Month)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstDayOfMonthStr = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }, []);

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'tunai' | 'utang'>('all');
  const [activePreset, setActivePreset] = useState<'month' | 'today' | 'yesterday' | '7days' | '30days' | 'all' | 'custom'>('month');

  // Thermal Receipt Modal State
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Quick Date Preset Handler
  const handleQuickPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all') => {
    setActivePreset(preset);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('2024-01-01');
      setEndDate(today);
    }
  };

  // Filtered transactions strictly adhering to Custom Date Range & Filters
  const filteredTransactions = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      if (txDate < start || txDate > end) return false;

      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInvoice = tx.invoiceNumber.toLowerCase().includes(q);
        const matchCustomer = (tx.customerName || '').toLowerCase().includes(q);
        const matchPhone = (tx.customerPhone || '').includes(q);
        const matchCashier = tx.cashierName.toLowerCase().includes(q);
        const matchItem = tx.items.some((it) => it.productName.toLowerCase().includes(q) || it.productCode.toLowerCase().includes(q));

        if (!matchInvoice && !matchCustomer && !matchPhone && !matchCashier && !matchItem) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, startDate, endDate, paymentFilter, searchQuery]);

  // Financial Metrics Summary for Filtered Range
  const metrics = useMemo(() => {
    const totalCount = filteredTransactions.length;
    const totalOmset = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalModal = filteredTransactions.reduce((acc, t) => acc + t.totalCost, 0);
    const totalLaba = filteredTransactions.reduce((acc, t) => acc + t.profit, 0);
    const tunaiCount = filteredTransactions.filter((t) => t.paymentMethod === 'tunai').length;
    const utangCount = filteredTransactions.filter((t) => t.paymentMethod === 'utang').length;
    const avgBasket = totalCount > 0 ? Math.round(totalOmset / totalCount) : 0;

    return {
      totalCount,
      totalOmset,
      totalModal,
      totalLaba,
      tunaiCount,
      utangCount,
      avgBasket,
    };
  }, [filteredTransactions]);

  // Download Excel Spreadsheet for Custom Date Range
  const handleDownloadExcel = () => {
    storage.exportTransactionsToExcel(startDate, endDate, {
      paymentFilter: paymentFilter === 'all' ? undefined : paymentFilter,
    });
  };

  const handleOpenReceipt = (tx: Transaction) => {
    setSelectedTxForReceipt(tx);
    setIsReceiptOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 pb-24 lg:pb-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#18181b] rounded-2xl p-4 sm:p-6 border border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-400 mb-1">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
            <span className="text-xs font-black tracking-wider uppercase text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
              Laporan Penjualan
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            Riwayat Transaksi & Struk Kasir
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Daftar lengkap seluruh transaksi penjualan POS, rincian produk, filter tanggal bebas, dan ekspor spreadsheet.
          </p>
        </div>

        {/* Excel Export Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Download Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold">Total Transaksi</span>
            <ShoppingBag className="w-4 h-4 text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-zinc-100">{metrics.totalCount}</span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            {metrics.tunaiCount} Tunai • {metrics.utangCount} Utang / Bon
          </span>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-emerald-900/40 shadow-xs bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold">Total Omset</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400">
            Rp {metrics.totalOmset.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-emerald-300/70 block mt-0.5">
            Rata-rata: Rp {metrics.avgBasket.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-bold">Total Modal (HPP)</span>
            <span className="text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">HPP</span>
          </div>
          <span className="text-2xl font-black text-zinc-100">
            Rp {metrics.totalModal.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            Biaya modal barang pokok
          </span>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-sky-900/40 shadow-xs bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-400 mb-1">
            <span className="text-xs font-bold">Laba Bersih</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-black text-sky-400">
            Rp {metrics.totalLaba.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-sky-300/70 block mt-0.5">
            Margin: {metrics.totalOmset > 0 ? ((metrics.totalLaba / metrics.totalOmset) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* Custom Date Range & Filters Toolbar */}
      <div className="bg-[#18181b] rounded-2xl p-4 sm:p-5 border border-zinc-800 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Custom Date Range Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-200">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold">Rentang Tanggal Custom:</span>
            </div>

            {/* Dari Tanggal */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-[#222226] border border-zinc-700 rounded-lg text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sampai Tanggal */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-[#222226] border border-zinc-700 rounded-lg text-xs font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Search & Payment Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice, nama pelanggan, barang..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#222226] border border-zinc-700 rounded-lg text-xs font-medium text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="py-1.5 px-3 bg-[#222226] border border-zinc-700 rounded-lg text-xs font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Metode Bayar</option>
              <option value="tunai">Hanya Tunai (Cash)</option>
              <option value="utang">Hanya Utang / Bon</option>
            </select>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1">
            Pilihan Cepat:
          </span>
          <button
            type="button"
            onClick={() => handleQuickPreset('today')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === 'today' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('yesterday')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === 'yesterday' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            Kemarin
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('7days')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === '7days' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('30days')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === '30days' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            30 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('month')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === 'month' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
              activePreset === 'all' ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300'
            }`}
          >
            Semua Periode
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#18181b] rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-300 font-bold tracking-wide uppercase text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-3.5 py-3 w-10 text-center">No</th>
                <th className="px-3.5 py-3 w-32">No. Invoice</th>
                <th className="px-3.5 py-3 w-28">Waktu</th>
                <th className="px-3.5 py-3 w-24">Metode</th>
                <th className="px-3.5 py-3 w-36">Pelanggan</th>
                <th className="px-3.5 py-3 min-w-[200px]">Rincian Barang Terjual</th>
                <th className="px-3.5 py-3 w-28 text-right">Total Belanja</th>
                <th className="px-3.5 py-3 w-24 text-right">Laba</th>
                <th className="px-3.5 py-3 w-24 text-center">Aksi Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    Tidak ada transaksi pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const dt = new Date(tx.timestamp);
                  const dateStr = dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                  const timeStr = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/40 transition">
                      <td className="px-3.5 py-3 text-center text-zinc-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-zinc-100">
                        {tx.invoiceNumber}
                        <span className="block text-[10px] text-zinc-500 font-normal">
                          Kasir: {tx.cashierName}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-zinc-300">
                        <span className="font-semibold block">{dateStr}</span>
                        <span className="text-[10px] text-zinc-500">{timeStr} WIB</span>
                      </td>
                      <td className="px-3.5 py-3">
                        {tx.paymentMethod === 'tunai' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                            <Banknote className="w-3 h-3 text-emerald-400" />
                            TUNAI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-950/60 text-rose-400 border border-rose-800/80">
                            <CreditCard className="w-3 h-3 text-rose-400" />
                            BON UTANG
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-zinc-300">
                        {tx.customerName ? (
                          <div>
                            <span className="font-bold block text-zinc-100">{tx.customerName}</span>
                            {tx.customerPhone && (
                              <span className="text-[10px] text-zinc-500">{tx.customerPhone}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Umum / Tunai</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-zinc-300">
                        <div className="space-y-0.5 max-w-sm">
                          {tx.items.slice(0, 3).map((it, itemIdx) => (
                            <div key={itemIdx} className="text-[11px] truncate">
                              <span className="font-semibold text-zinc-200">{it.productName}</span>
                              <span className="text-zinc-500 ml-1">
                                ({it.quantity} {it.selectedUnit})
                              </span>
                            </div>
                          ))}
                          {tx.items.length > 3 && (
                            <span className="text-[10px] text-zinc-500 italic">
                              +{tx.items.length - 3} barang lainnya...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-zinc-100">
                        Rp {tx.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-400">
                        Rp {tx.profit.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#222226] hover:bg-zinc-700 active:scale-95 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-lg transition"
                          title="Buka / Cetak Struk Thermal 58mm"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-[#18181b] border-t border-zinc-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
          <span>
            Menampilkan <strong className="text-zinc-200">{filteredTransactions.length} transaksi</strong> untuk periode {startDate} s/d {endDate}
          </span>
          <div className="flex items-center gap-4 font-mono">
            <span>
              Total Omset: <strong className="text-zinc-100">Rp {metrics.totalOmset.toLocaleString('id-ID')}</strong>
            </span>
            <span>
              Total Laba: <strong className="text-emerald-400">Rp {metrics.totalLaba.toLocaleString('id-ID')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Thermal Receipt Modal */}
      {selectedTxForReceipt && (
        <ThermalReceipt
          transaction={selectedTxForReceipt}
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setSelectedTxForReceipt(null);
          }}
        />
      )}
    </div>
  );
};
