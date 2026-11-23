import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Store, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#070A12] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      {/* Dynamic Aurora Ambient Background Orbs */}
      <div className="aurora-mesh" aria-hidden="true">
        <div className="aurora-orb-1 animate-aurora-1" />
        <div className="aurora-orb-2 animate-aurora-2" />
        <div className="aurora-orb-3 animate-aurora-3" />
        <div className="aurora-grid-dots" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aurora-purple via-aurora-indigo to-coral text-white flex items-center justify-center font-black text-2xl mx-auto shadow-glow-purple border border-white/20 animate-float">
            VF
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VyapaarFlow
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Smart Retail POS, Inventory & Udhaar Ledger for Bharat
          </p>
        </div>

        {/* Glass Bento Card */}
        <div className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurora-purple" />
              <span>Welcome Back</span>
            </h2>
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
              v2.0
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="name@store.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-3.5 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple hover:opacity-95 text-white font-bold rounded-2xl shadow-glow-coral transition-all transform active:scale-95 flex items-center justify-center gap-2 text-xs overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span>{isLoading ? 'Signing in...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Glass Banner */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
              Quick 1-Click Demo Login:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => quickFill('ramesh@kirana.com', 'password123')}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left font-semibold text-slate-200 transition transform hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-1.5 text-coral font-bold">
                  <Store className="w-3.5 h-3.5" />
                  <span>Kirana Store</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">ramesh@kirana.com</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('admin@vyapaarflow.com', 'password123')}
                className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left font-semibold text-slate-200 transition transform hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-1.5 text-aurora-purple font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">admin@vyapaarflow.com</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-1">
            <span>New shopkeeper? </span>
            <Link to="/register" className="font-bold text-coral hover:underline">
              Register New Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
