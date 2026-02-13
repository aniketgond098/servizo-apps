
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, User as UserIcon, Zap, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { EmailService } from '../services/email';
import { UserRole } from '../types';

export default function Signup() {
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (value && !validatePhone(value)) {
      setPhoneError('Phone must be 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      setLoading(false);
      return;
    }
    if (pass.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (name.length < 2) {
      setError('Name must be at least 2 characters');
      setLoading(false);
      return;
    }
    
    try {
      await EmailService.createUserAndSendVerification(email, pass);
      const user = await AuthService.signup(email, pass, name, role);
      if (!user) {
        setError('Failed to create account');
        setLoading(false);
        return;
      }
      navigate('/verify-email', { replace: true });
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.message?.includes('network') || err.code === 'unavailable') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-blue-600/20">
            <Shield className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter italic">REGISTRY<span className="text-blue-500">ENTRY</span></h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">New Operational Deployment</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button 
            onClick={() => setRole('user')}
            className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center gap-2 sm:gap-3 transition-all ${role === 'user' ? 'bg-blue-600 border-blue-600' : 'bg-black border-zinc-800 text-gray-500'}`}
          >
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Client</span>
          </button>
          <button 
            onClick={() => setRole('worker')}
            className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center gap-2 sm:gap-3 transition-all ${role === 'worker' ? 'bg-blue-600 border-blue-600' : 'bg-black border-zinc-800 text-gray-500'}`}
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Artisan</span>
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name / Entity</label>
            <input 
              required value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Registry Email</label>
            <input 
              type="email" required value={email} onChange={handleEmailChange}
              className={`w-full bg-black border rounded-xl p-3 sm:p-4 text-sm focus:border-blue-500 outline-none transition-all ${emailError ? 'border-red-500' : 'border-zinc-800'}`}
            />
            {emailError && <p className="text-red-500 text-[10px] font-bold">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Security Pin (min 6 chars)</label>
            <input 
              type="password" required value={pass} onChange={e => setPass(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold uppercase text-center">{error}</p>}
          <button disabled={!!emailError || loading} className="w-full bg-blue-600 py-3 sm:py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SENDING EMAIL...
              </>
            ) : (
              <>
                ESTABLISH CONNECTION
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 uppercase font-bold">
          Existing Protocol? <Link to="/login" className="text-blue-500">Login</Link>
        </p>
      </div>
    </div>
  );
}
