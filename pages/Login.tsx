
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../services/auth';
import { EmailService } from '../services/email';
import { ServizoIcon } from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  // Forgot password state
  const [fpStep, setFpStep] = useState<'closed' | 'email' | 'otp' | 'newpass'>('closed');
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpConfirmPass, setFpConfirmPass] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);

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

  const handleFpSendOtp = async () => {
    if (!validateEmail(fpEmail)) { setFpError('Enter a valid email address'); return; }
    setFpLoading(true); setFpError('');
    try {
      const users = await import('../services/db').then(m => m.DB.getUsers());
      const exists = users.find(u => u.email === fpEmail);
      if (!exists) { setFpError('No account found with this email'); setFpLoading(false); return; }
      await EmailService.sendOTP(fpEmail, exists.name || 'User');
      setFpStep('otp');
    } catch (e: any) {
      setFpError(e.message || 'Failed to send OTP');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpVerifyOtp = async () => {
    if (fpOtp.length !== 6) { setFpError('Enter the 6-digit OTP'); return; }
    setFpLoading(true); setFpError('');
    try {
      const valid = await EmailService.verifyOTP(fpEmail, fpOtp);
      if (!valid) { setFpError('Invalid or expired OTP'); setFpLoading(false); return; }
      setFpStep('newpass');
    } catch (e: any) {
      setFpError(e.message || 'Verification failed');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResetPassword = async () => {
    if (fpNewPass.length < 6) { setFpError('Password must be at least 6 characters'); return; }
    if (fpNewPass !== fpConfirmPass) { setFpError('Passwords do not match'); return; }
    setFpLoading(true); setFpError('');
    try {
      await AuthService.resetPassword(fpEmail, fpNewPass);
      setFpSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => { setFpStep('closed'); setFpEmail(''); setFpOtp(''); setFpNewPass(''); setFpConfirmPass(''); setFpSuccess(''); }, 2500);
    } catch (e: any) {
      setFpError(e.message || 'Failed to reset password');
    } finally {
      setFpLoading(false);
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
              <div className="text-right">
                <button type="button" onClick={() => { setFpStep('email'); setFpEmail(''); setFpError(''); }} className="text-xs text-[#4169E1] hover:underline">
                  Forgot password?
                </button>
              </div>
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

      {/* Forgot Password Modal */}
      {fpStep !== 'closed' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7">
            {fpSuccess ? (
              <div className="text-center py-4">
                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-800">{fpSuccess}</p>
              </div>
            ) : (
              <>
                {/* Step: Enter email */}
                {fpStep === 'email' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <KeyRound className="w-5 h-5 text-[#4169E1]" />
                      <h2 className="text-lg font-bold text-gray-800">Forgot Password</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Enter your registered email and we'll send an OTP to reset your password.</p>
                    <div className="relative mb-4">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1]"
                      />
                    </div>
                    {fpError && <p className="text-red-500 text-xs mb-3">{fpError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setFpStep('closed')} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                      <button onClick={handleFpSendOtp} disabled={fpLoading} className="flex-1 bg-[#4169E1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3558c8] disabled:opacity-50 flex items-center justify-center gap-2">
                        {fpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                      </button>
                    </div>
                  </>
                )}

                {/* Step: Enter OTP */}
                {fpStep === 'otp' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <ShieldCheck className="w-5 h-5 text-[#4169E1]" />
                      <h2 className="text-lg font-bold text-gray-800">Enter OTP</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">A 6-digit OTP was sent to <span className="font-medium text-gray-700">{fpEmail}</span>. It expires in 5 minutes.</p>
                    <input
                      type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1] mb-4"
                    />
                    {fpError && <p className="text-red-500 text-xs mb-3">{fpError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => { setFpStep('email'); setFpError(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Back</button>
                      <button onClick={handleFpVerifyOtp} disabled={fpLoading} className="flex-1 bg-[#4169E1] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3558c8] disabled:opacity-50 flex items-center justify-center gap-2">
                        {fpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
                      </button>
                    </div>
                    <button onClick={handleFpSendOtp} className="w-full mt-3 text-xs text-[#4169E1] hover:underline">Resend OTP</button>
                  </>
                )}

                {/* Step: New password */}
                {fpStep === 'newpass' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <Lock className="w-5 h-5 text-[#4169E1]" />
                      <h2 className="text-lg font-bold text-gray-800">Set New Password</h2>
                    </div>
                    <div className="relative mb-3">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPass ? 'text' : 'password'} value={fpNewPass} onChange={e => setFpNewPass(e.target.value)}
                        placeholder="New password (min 6 characters)"
                        className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1]"
                      />
                      <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative mb-4">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPass ? 'text' : 'password'} value={fpConfirmPass} onChange={e => setFpConfirmPass(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1]"
                      />
                    </div>
                    {fpError && <p className="text-red-500 text-xs mb-3">{fpError}</p>}
                    <button onClick={handleFpResetPassword} disabled={fpLoading} className="w-full bg-[#000000] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#1a1a1a] disabled:opacity-50 flex items-center justify-center gap-2">
                      {fpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
