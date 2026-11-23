import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-pearl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-navy text-white flex items-center justify-center font-black text-2xl mx-auto shadow-xl ring-4 ring-coral/20">
            VF
          </div>
          <h1 className="text-2xl font-black text-navy tracking-tight">VyapaarFlow</h1>
          <p className="text-xs text-slate-500">Create your business account to start digitizing operations</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-softgrey-border shadow-xl space-y-5">
          <h2 className="text-lg font-black text-navy">Business Owner Registration</h2>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium"
                  placeholder="e.g. Ramesh Gupta"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium"
                  placeholder="ramesh@kirana.com"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">10-Digit Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  pattern="[6-9][0-9]{9}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium font-mono"
                  placeholder="9822001122"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Create Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-pearl border border-softgrey-border rounded-xl focus:outline-none focus:ring-2 focus:ring-coral font-medium"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-xs"
            >
              <span>{isLoading ? 'Creating Account...' : 'Continue to Store Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
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
