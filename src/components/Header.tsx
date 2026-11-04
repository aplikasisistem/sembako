import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { usePWA } from '../hooks/usePWA';
import { 
  LogOut, 
  Wifi, 
  WifiOff, 
  Database, 
  Download, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Store
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { isOnline, isFirebaseActive } = useStore();
  const { isInstallable, isInstalled, isIOS, install, hasUpdate, applyUpdate } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <>
      {/* Seamless Auto-Update Notification Banner (Section 11) */}
      {hasUpdate && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md sticky top-0 z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Versi baru PANDIR STORE tersedia! Nikmati perbaikan & fitur terbaru.</span>
          </div>
          <button
            onClick={applyUpdate}
            className="bg-white text-amber-700 px-3 py-1 rounded font-bold hover:bg-amber-50 active:scale-95 transition text-xs shadow"
          >
            Perbarui Sekarang
          </button>
        </div>
      )}

      {/* Main Header with Logo Integrity & Compact Mobile Height & Safe Area Notch Padding */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-40 shadow-xs pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-13 sm:h-15 flex items-center justify-between gap-1.5 sm:gap-2">
          
          {/* Logo & Store Name - Compact & Proportional on Mobile */}
          <div className="flex items-center gap-2 sm:gap-3 select-none min-w-0">
            <div className="h-8 w-8 sm:h-9.5 sm:w-9.5 p-1 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img 
                src="/assets/aistudio/logo_6f62622a.png" 
                alt="PANDIR STORE" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight truncate">
                  PANDIR STORE
                </h1>
                <span className="inline-block px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                  POS
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium hidden sm:block truncate">
                Sistem Kasir &amp; Manajemen Toko Sembako
              </p>
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Status Indicators - Clean Light Mode Pill */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 backdrop-blur-md px-2 py-1 rounded-xl text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-700" title="Online (Terkoneksi)">
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span className="hidden md:inline uppercase tracking-wider text-[9px] font-bold">Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-700" title="Offline Mode">
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span className="hidden md:inline uppercase tracking-wider text-[9px] font-bold">Offline</span>
                </span>
              )}

              <span className="w-px h-2.5 bg-slate-300 mx-0.5"></span>

              {isFirebaseActive ? (
                <span className="flex items-center gap-1 text-sky-700" title="Cloud Database">
                  <Database className="w-3 h-3 text-sky-600" />
                  <span className="hidden lg:inline uppercase tracking-wider text-[9px] font-bold">Cloud</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-600" title="Local Storage">
                  <Database className="w-3 h-3 text-slate-500" />
                  <span className="hidden lg:inline uppercase tracking-wider text-[9px] font-bold">Local</span>
                </span>
              )}
            </div>

            {/* PWA Install Button */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}

            {/* User Profile Pill - Clean Light Mode */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-1 sm:pl-1.5 border-l border-slate-200">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  )}
                  <span className="text-[10px] sm:text-[11px] font-extrabold max-w-[65px] sm:max-w-[80px] truncate uppercase hidden xs:inline-block">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* iOS Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-zinc-700/60">
                <img src="/assets/aistudio/logo_6f62622a.png" alt="PANDIR STORE" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-zinc-400">Aplikasi PANDIR STORE PWA</p>
              </div>
            </div>

            <ol className="text-xs text-zinc-300 space-y-2.5 mb-4 pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                <span>Buka browser <strong>Safari</strong> di iPhone Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                <span>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah atas di bawah layar).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                <span>Pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
