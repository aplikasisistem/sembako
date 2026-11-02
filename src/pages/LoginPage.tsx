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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Refined Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-slate-100 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[400px] bg-white rounded-2xl p-7 sm:p-10 shadow-xl shadow-slate-200/60 relative z-10 border border-slate-100">
        
        {/* PANDIR STORE Brand Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center mb-4 shadow-sm">
            <Store className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            PANDIR STORE
          </h1>
          <p className="text-[13px] text-slate-400 font-medium mt-2">
            PWA POS & Manajemen Toko
          </p>
        </div>

        {/* Error Banners */}
        {sessionRevokedMessage && (
          <div className="mb-5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-[11px] font-bold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{sessionRevokedMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-[11px] font-bold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 ml-1">
              Email / Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 ml-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Masuk...' : 'Masuk ke Kasir'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.1em]">
            Vercel Powered • Enterprise Cloud POS
          </p>
        </div>
      </div>
    </div>
  );
};
