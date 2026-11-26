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
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 relative overflow-hidden text-content-primary">
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#142D4E] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md border border-[#256D85]/30">
            VF
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142D4E] dark:text-white tracking-tight font-sans">
            VyapaarFlow
          </h1>
          <p className="text-xs text-content-secondary font-medium">
            Smart Retail POS, Inventory & Udhaar Ledger for Indian Businesses
          </p>
        </div>

        {/* Enterprise Card */}
        <div className="bg-surface border border-borderline shadow-card rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#142D4E] dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#256D85]" />
              <span>Sign In to Your Store</span>
            </h2>
            <span className="text-[10px] bg-app border border-borderline text-content-secondary px-2.5 py-0.5 rounded-full font-bold">
              v2.0
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-content-primary block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="name@store.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#D97706] hover:bg-amber-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Banner */}
          <div className="pt-4 border-t border-borderline space-y-2.5">
            <span className="text-[10px] font-bold text-content-muted block uppercase tracking-wider text-center">
              Quick 1-Click Demo Login:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => quickFill('ramesh@kirana.com', 'password123')}
                className="p-3 rounded-xl bg-app hover:bg-[#256D85]/10 border border-borderline hover:border-[#256D85]/40 text-left font-semibold text-content-primary transition"
              >
                <div className="flex items-center gap-1.5 text-[#256D85] font-bold">
                  <Store className="w-3.5 h-3.5" />
                  <span>Kirana Store</span>
                </div>
                <div className="text-[10px] text-content-secondary mt-1">ramesh@kirana.com</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('admin@vyapaarflow.com', 'password123')}
                className="p-3 rounded-xl bg-app hover:bg-[#256D85]/10 border border-borderline hover:border-[#256D85]/40 text-left font-semibold text-content-primary transition"
              >
                <div className="flex items-center gap-1.5 text-[#D97706] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-content-secondary mt-1">admin@vyapaarflow.com</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-content-secondary pt-1">
            <span>New shopkeeper? </span>
            <Link to="/register" className="font-bold text-[#256D85] hover:underline">
              Register New Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
