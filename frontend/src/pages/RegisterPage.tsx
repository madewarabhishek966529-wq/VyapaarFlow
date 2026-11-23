import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await register(name, email, password, mobile);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-aurora-purple via-aurora-indigo to-coral text-white flex items-center justify-center font-black text-2xl mx-auto shadow-glow-purple border border-white/20 animate-float">
            VF
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VyapaarFlow
          </h1>
          <p className="text-xs text-slate-400">
            Create your business account to start digitizing operations
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-coral" />
            <span>Business Owner Registration</span>
          </h2>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Your Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="e.g. Ramesh Gupta"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="ramesh@kirana.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Mobile Number (10 digits) *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="9822001122"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Create Secure Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-900/90 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-aurora-purple/50 font-medium"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full py-3.5 bg-gradient-to-r from-coral via-rose-500 to-aurora-purple hover:opacity-95 text-white font-bold rounded-2xl shadow-glow-coral transition-all transform active:scale-95 flex items-center justify-center gap-2 text-xs overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <span>{isLoading ? 'Creating Account...' : 'Continue to Store Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-1">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-coral hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
