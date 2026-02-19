
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Briefcase, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { AuthService } from '../services/auth';
import { ServizoIcon } from '../components/Logo';
import { UserRole } from '../types';

export default function Signup() {
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !validateEmail(value) ? 'Invalid email format' : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) { setEmailError('Please enter a valid email'); return; }
    if (pass.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (name.length < 2) { setError('Name must be at least 2 characters'); return; }

    setLoading(true);
    try {
      const user = await AuthService.signup(email, pass, name, role);
      if (!user) {
        setError('Failed to create account. Email may already be in use.');
        setLoading(false);
        return;
      }
      navigate('/verify-email', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <ServizoIcon size={48} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#000000]">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Join Servizo and get started</p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'user' ? 'border-[#000000] bg-[#000000]/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <UserIcon className={`w-5 h-5 ${role === 'user' ? 'text-[#000000]' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${role === 'user' ? 'text-[#000000]' : 'text-gray-500'}`}>I need help</span>
              <span className="text-xs text-gray-400">Find & hire professionals</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'worker' ? 'border-[#000000] bg-[#000000]/5' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Briefcase className={`w-5 h-5 ${role === 'worker' ? 'text-[#000000]' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${role === 'worker' ? 'text-[#000000]' : 'text-gray-500'}`}>I'm a pro</span>
              <span className="text-xs text-gray-400">Offer my services</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
              <input
                required value={name} onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1] transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required value={email} onChange={handleEmailChange}
                  placeholder="you@example.com"
                  className={`w-full border rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 transition-all ${emailError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#4169E1]'}`}
                />
              </div>
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password" required value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1] transition-all"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>}

            <button
              type="submit"
              disabled={!!emailError || loading}
              className="w-full bg-[#000000] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-[#4169E1] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
