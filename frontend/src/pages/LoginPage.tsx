import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Store, ShieldCheck, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-pearl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl ring-4 ring-coral/20">
            VF
          </div>
          <h1 className="text-2xl font-black text-navy tracking-tight">VyapaarFlow</h1>
          <p className="text-xs text-slate-500">Retail Billing, Inventory & Udhaar Management for Bharat</p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-softgrey-border shadow-xl space-y-5">
          <h2 className="text-lg font-black text-navy">Welcome Back</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium"
                  placeholder="name@store.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-xs"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In to Store'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Banner */}
          <div className="pt-4 border-t border-softgrey-border space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider text-center">
              Quick 1-Click Demo Login:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => quickFill('ramesh@kirana.com', 'password123')}
                className="p-2 rounded-xl bg-pearl hover:bg-softgrey-light border border-softgrey-border text-left font-semibold text-slate-700 transition"
              >
                <div className="flex items-center gap-1 text-coral font-bold">
                  <Store className="w-3 h-3" />
                  <span>Kirana Store</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">ramesh@kirana.com</div>
              </button>

              <button
                type="button"
                onClick={() => quickFill('admin@vyapaarflow.com', 'password123')}
                className="p-2 rounded-xl bg-pearl hover:bg-softgrey-light border border-softgrey-border text-left font-semibold text-slate-700 transition"
              >
                <div className="flex items-center gap-1 text-navy font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">admin@vyapaarflow.com</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
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
