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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          
          {/* Logo & Store Name - Compact */}
          <div className="flex items-center gap-2.5 sm:gap-3 select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 leading-tight">
                  PANDIR STORE
                </h1>
                <span className="hidden xs:inline-block px-1 py-0.2 text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 rounded">
                  POS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Manajemen Toko Sembako
              </p>
            </div>
          </div>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Status Indicators - Compact */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Wifi className="w-3 h-3" />
                  <span className="hidden md:inline uppercase tracking-wider">Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden md:inline uppercase tracking-wider">Offline</span>
                </span>
              )}

              <span className="w-px h-3 bg-slate-200 mx-0.5"></span>

              {isFirebaseActive ? (
                <span className="flex items-center gap-1 text-blue-600">
                  <Database className="w-3 h-3" />
                  <span className="hidden lg:inline uppercase tracking-wider">Cloud</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <Database className="w-3 h-3" />
                  <span className="hidden lg:inline uppercase tracking-wider">Local</span>
                </span>
              )}
            </div>

            {/* PWA Install - Refined */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition"
              >
                <Download className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}

            {/* User Profile Pill - Clean */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-200/60 px-2 py-1 rounded-lg">
                  {isAdmin ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <div className="text-left leading-tight hidden xs:block">
                    <span className="text-[11px] font-bold block max-w-[80px] truncate uppercase">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 p-1 flex items-center justify-center">
                <img src="/logo.svg" alt="PANDIR STORE" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-slate-500">Aplikasi PANDIR STORE PWA</p>
              </div>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 mb-4 pl-1">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                <span>Buka browser <strong>Safari</strong> di iPhone Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                <span>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah atas di bawah layar).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600 bg-emerald-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                <span>Pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
