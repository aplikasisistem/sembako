import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Store
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, sessionRevokedMessage, clearSessionMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearSessionMessage();

    if (!email.trim() || !password.trim()) {
      setError('Silakan masukkan email/username dan kata sandi.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login gagal.');
      setPassword(''); // Clear password on error securely
    }
  };

  return (
    <div className="min-h-screen bg-[#161922] flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white font-sans">
      {/* Refined Subtle Dark Slate Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-950/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-slate-900/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-[#252a36] rounded-2xl p-7 sm:p-9 shadow-2xl relative z-10 border border-[#32384a]">
        
        {/* PANDIR STORE Brand Header with New Monogram Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-white/95 p-2 flex items-center justify-center mb-4 shadow-md border border-slate-600/50 overflow-hidden">
            <img 
              src="/assets/aistudio/logo_6f62622a.png" 
              alt="PANDIR STORE" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">
            PANDIR STORE
          </h1>
          <p className="text-[12px] text-slate-400 font-medium mt-2">
            PWA POS & Manajemen Toko Sembako
          </p>
        </div>

        {/* Error Banners */}
        {sessionRevokedMessage && (
          <div className="mb-5 bg-rose-950/40 border border-rose-800/60 text-rose-300 p-3 rounded-xl text-[11px] font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{sessionRevokedMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-rose-950/40 border border-rose-800/60 text-rose-300 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5 ml-1">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                placeholder="admin@pandirstore.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1e2330] border border-[#32384a] rounded-xl text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5 ml-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#1e2330] border border-[#32384a] rounded-xl text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? 'Masuk...' : 'Masuk ke Kasir'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 pt-4 border-t border-[#32384a] space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
            Pintasan Masuk Cepat:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin');
                setPassword('admin123');
              }}
              className="px-2.5 py-1.5 bg-[#1e2330] hover:bg-[#2c3345] text-slate-200 border border-[#32384a] rounded-lg text-xs font-bold transition text-center"
            >
              👑 Admin (admin)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('kasir');
                setPassword('kasir123');
              }}
              className="px-2.5 py-1.5 bg-[#1e2330] hover:bg-[#2c3345] text-slate-200 border border-[#32384a] rounded-lg text-xs font-bold transition text-center"
            >
              🛒 Kasir (kasir)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">
            PANDIR STORE POS • Scale Smart
          </p>
        </div>
      </div>
    </div>
  );
};
