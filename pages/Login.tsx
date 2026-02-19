
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { ServizoIcon } from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !validateEmail(value) ? 'Invalid email format' : '');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { setEmailError('Please enter a valid email'); return; }
    if (pass.length < 3) { setError('Password must be at least 3 characters'); return; }
    setLoading(true);
    setError('');
    const user = await AuthService.login(email, pass);
      if (user) {
        if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'worker') navigate('/worker-dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
              <ServizoIcon size={48} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#000000]">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your Servizo account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" required
                  value={email} onChange={handleEmailChange}
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
                  type="password" required
                  value={pass} onChange={e => setPass(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1] transition-all"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>}
            <button 
              disabled={loading || !!emailError}
              className="w-full bg-[#000000] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <Link to="/signup" className="text-[#4169E1] font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
        
        {/* Demo Credentials */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 text-center mb-3 font-medium">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-50 p-2.5 rounded-lg text-center">
              <p className="text-gray-400 mb-1 font-medium">User</p>
              <p className="text-[#4169E1] font-medium">user@servizo.in</p>
              <p className="text-gray-400">user123</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg text-center">
              <p className="text-gray-400 mb-1 font-medium">Worker</p>
              <p className="text-green-600 font-medium">worker@servizo.in</p>
              <p className="text-gray-400">worker123</p>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-lg text-center">
              <p className="text-gray-400 mb-1 font-medium">Admin</p>
              <p className="text-red-500 font-medium">admin@servizo.in</p>
              <p className="text-gray-400">admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
