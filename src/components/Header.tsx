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

      {/* Main Header with Logo Integrity */}
      <header className="bg-[#18181b] border-b border-zinc-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Store Name - Integrated cleanly with new monogram asset */}
          <div className="flex items-center gap-3 select-none">
            <div className="h-10 sm:h-11 px-2 py-1 rounded-xl bg-white/95 border border-zinc-700/60 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
              <img 
                src="/assets/aistudio/logo_6f62622a.png" 
                alt="PANDIR STORE Monogram" 
                className="h-full w-auto max-h-9 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-zinc-100 leading-tight">
                  PANDIR STORE
                </h1>
                <span className="hidden xs:inline-block px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded">
                  POS
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
                Sistem Kasir & Manajemen Toko Sembako
              </p>
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Status Indicators - Compact in dark mode */}
            <div className="flex items-center gap-2 bg-[#222226] px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-400 border border-zinc-800">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Wifi className="w-3 h-3" />
                  <span className="hidden md:inline uppercase tracking-wider">Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400">
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden md:inline uppercase tracking-wider">Offline</span>
                </span>
              )}

              <span className="w-px h-3 bg-zinc-700 mx-0.5"></span>

              {isFirebaseActive ? (
                <span className="flex items-center gap-1 text-sky-400">
                  <Database className="w-3 h-3" />
                  <span className="hidden lg:inline uppercase tracking-wider">Cloud</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-zinc-500">
                  <Database className="w-3 h-3" />
                  <span className="hidden lg:inline uppercase tracking-wider">Local</span>
                </span>
              )}
            </div>

            {/* PWA Install - Refined */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}

            {/* User Profile Pill - Clean */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-800">
                <div className="flex items-center gap-2 bg-[#222226] text-zinc-200 border border-zinc-800 px-2 py-1 rounded-lg">
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <div className="text-left leading-tight hidden xs:block">
                    <span className="text-[11px] font-bold block max-w-[80px] truncate uppercase">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
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
