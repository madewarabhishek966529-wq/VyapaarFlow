import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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

          <div className="text-center text-xs text-content-secondary pt-3 border-t border-borderline">
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
