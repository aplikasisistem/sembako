import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { 
  ShoppingCart, 
  Receipt,
  Boxes, 
  ClipboardCheck,
  BookOpen, 
  Wallet, 
  Send, 
  TrendingUp, 
  Users, 
  Settings,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export type NavTab = 
  | 'pos' 
  | 'transactions'
  | 'inventory' 
  | 'stockOpname'
  | 'debts' 
  | 'pettyCash' 
  | 'closing' 
  | 'finance' 
  | 'users' 
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();
  const { debts, products, cartTotalItemsCount } = useStore();

  const unpaidDebtsCount = debts.filter((d) => d.status !== 'lunas').length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    adminOnly?: boolean;
  }[] = [
    { 
      id: 'pos', 
      label: 'Kasir (POS)', 
      icon: ShoppingCart,
      badge: cartTotalItemsCount > 0 ? cartTotalItemsCount : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'transactions',
      label: 'Riwayat Transaksi',
      icon: Receipt,
    },
    { 
      id: 'inventory', 
      label: 'Stok Sembako', 
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'stockOpname',
      label: 'Stok Opname',
      icon: ClipboardCheck,
    },
    { 
      id: 'debts', 
      label: 'Buku Utang / Bon', 
      icon: BookOpen,
      badge: unpaidDebtsCount > 0 ? unpaidDebtsCount : undefined,
      badgeColor: 'bg-red-500 text-white'
    },
    { 
      id: 'pettyCash', 
      label: 'Kas Operasional', 
      icon: Wallet 
    },
    { 
      id: 'closing', 
      label: 'Closing Kasir (WA)', 
      icon: Send 
    },
    { 
      id: 'finance', 
      label: 'Laba Rugi & Modal', 
      icon: TrendingUp,
      adminOnly: true 
    },
    { 
      id: 'users', 
      label: 'Kelola Pengguna', 
      icon: Users,
      adminOnly: true 
    },
    { 
      id: 'settings', 
      label: 'Pengaturan Toko', 
      icon: Settings,
      adminOnly: true 
    },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* DESKTOP SIDEBAR - Deep Charcoal Dark Theme */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#18181b] border-r border-zinc-800 shrink-0 p-3 min-h-[calc(100vh-4rem)]">
        <div className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 px-3 mb-3">
          Sistem Menu
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition group ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-black rounded ${isActive ? 'bg-emerald-500 text-zinc-950 font-black' : (item.badgeColor || 'bg-zinc-800 text-zinc-400')}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Low Stock Warning Pill if any */}
        {lowStockCount > 0 && (
          <div className="mt-auto pt-4 border-t border-zinc-800">
            <div 
              onClick={() => setActiveTab('inventory')}
              className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-3 cursor-pointer hover:bg-amber-900/40 transition"
            >
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Peringatan Stok!</span>
              </div>
              <p className="text-[11px] text-amber-300/80">
                Ada {lowStockCount} produk sembako menipis atau habis.
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Width < 1024px) */}
      {/* Adheres strictly to min 44px x 44px touch targets and scrollable for full access */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#18181b]/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-xl mx-auto">
          {/* 1. Kasir */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'pos' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <div className="relative">
              <ShoppingCart className={`w-4 h-4 ${activeTab === 'pos' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
              {cartTotalItemsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-zinc-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {cartTotalItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 truncate">Kasir</span>
          </button>

          {/* 2. Riwayat Transaksi */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center min-w-[58px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'transactions' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <Receipt className={`w-4 h-4 ${activeTab === 'transactions' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 truncate">Transaksi</span>
          </button>

          {/* 3. Stok Sembako */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'inventory' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <div className="relative">
              <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-zinc-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 truncate">Stok</span>
          </button>

          {/* 4. Stok Opname (SO) */}
          <button
            onClick={() => setActiveTab('stockOpname')}
            className={`flex flex-col items-center justify-center min-w-[58px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'stockOpname' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <ClipboardCheck className={`w-4 h-4 ${activeTab === 'stockOpname' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 truncate">Opname</span>
          </button>

          {/* 5. Utang / Bon */}
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'debts' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <div className="relative">
              <BookOpen className={`w-4 h-4 ${activeTab === 'debts' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
              {unpaidDebtsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unpaidDebtsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 truncate">Bon</span>
          </button>

          {/* 6. Closing */}
          <button
            onClick={() => setActiveTab('closing')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'closing' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
            }`}
          >
            <Send className={`w-4 h-4 ${activeTab === 'closing' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 truncate">Closing</span>
          </button>

          {/* 7. Laba / Kas */}
          <button
            onClick={() => setActiveTab(isAdmin ? 'finance' : 'pettyCash')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
              activeTab === 'finance' || (!isAdmin && activeTab === 'pettyCash')
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-zinc-400 font-medium'
            }`}
          >
            {isAdmin ? (
              <TrendingUp className={`w-4 h-4 ${activeTab === 'finance' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
            ) : (
              <Wallet className={`w-4 h-4 ${activeTab === 'pettyCash' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
            )}
            <span className="text-[10px] mt-0.5 truncate">
              {isAdmin ? 'Laba' : 'Kas'}
            </span>
          </button>

          {/* 8 & 9: Admin options */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
                  activeTab === 'users' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'users' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
                <span className="text-[10px] mt-0.5 truncate">Akun</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] rounded-lg px-2 py-1 transition shrink-0 ${
                  activeTab === 'settings' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-zinc-400 font-medium'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-emerald-400 stroke-[2.5]' : ''}`} />
                <span className="text-[10px] mt-0.5 truncate">Setelan</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
