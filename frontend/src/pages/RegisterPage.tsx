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
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 relative overflow-hidden text-content-primary">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#142D4E] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md border border-[#256D85]/30">
            VF
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142D4E] dark:text-white tracking-tight font-sans">
            VyapaarFlow
          </h1>
          <p className="text-xs text-content-secondary">
            Create your business account to start digitizing operations
          </p>
        </div>

        <div className="bg-surface border border-borderline shadow-card rounded-2xl p-6 sm:p-8 space-y-5">
          <h2 className="text-base font-bold text-[#142D4E] dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#256D85]" />
            <span>Business Owner Registration</span>
          </h2>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-content-primary block mb-1">Your Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="e.g. Ramesh Gupta"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="ramesh@kirana.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">Mobile Number (10 digits) *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-mono text-xs"
                  placeholder="9822001122"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">Create Secure Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 vf-input text-content-primary placeholder:text-content-muted font-medium text-xs"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#D97706] hover:bg-amber-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs"
            >
              <span>{isLoading ? 'Creating Account...' : 'Continue to Store Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-content-secondary pt-1">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-[#256D85] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
