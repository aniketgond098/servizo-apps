
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    if (pass.length < 3) {
      setError('Password must be at least 3 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const user = await AuthService.login(email, pass);
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'worker') {
        navigate('/worker-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 sm:py-16 lg:py-24 px-4 sm:px-6">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-600/20">
            <Shield className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter italic">ACCESS<span className="text-blue-500">GATE</span></h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Operational Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Registry Email</label>
            <input 
              type="email" required
              value={email} onChange={handleEmailChange}
              className={`w-full bg-black border rounded-xl p-3 sm:p-4 text-sm focus:border-blue-500 outline-none transition-all ${emailError ? 'border-red-500' : 'border-zinc-800'}`}
            />
            {emailError && <p className="text-red-500 text-[10px] font-bold">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Access Key</label>
            <input 
              type="password" required
              value={pass} onChange={e => setPass(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold uppercase text-center">{error}</p>}
          <button 
            disabled={loading || !!emailError}
            className="w-full bg-blue-600 py-3 sm:py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'INITIATE SESSION'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Not in the registry? <Link to="/signup" className="text-blue-500 font-bold hover:underline">Apply for Access</Link>
        </p>
        
        <div className="pt-6 border-t border-zinc-800 space-y-2">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest text-center font-bold">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-2 text-[8px]">
            <div className="bg-black/40 p-2 rounded text-center">
              <p className="text-gray-500 mb-1">USER</p>
              <p className="text-blue-400">user@servizo.in</p>
              <p className="text-gray-600">user123</p>
            </div>
            <div className="bg-black/40 p-2 rounded text-center">
              <p className="text-gray-500 mb-1">WORKER</p>
              <p className="text-green-400">worker@servizo.in</p>
              <p className="text-gray-600">worker123</p>
            </div>
            <div className="bg-black/40 p-2 rounded text-center">
              <p className="text-gray-500 mb-1">ADMIN</p>
              <p className="text-red-400">admin@servizo.in</p>
              <p className="text-gray-600">admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
