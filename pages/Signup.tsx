
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Briefcase, ArrowRight, Loader2, Mail, Lock, Phone, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/auth';
import { ServizoIcon } from '../components/Logo';
import { UserRole } from '../types';

export default function Signup() {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (p: string) => /^\d{10}$/.test(p.replace(/\D/g, ''));

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !validateEmail(value) ? 'Invalid email format' : '');
  };

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

    const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

    const handleSendOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!validateEmail(email)) { setEmailError('Please enter a valid email'); return; }
      if (pass.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (name.length < 2) { setError('Name must be at least 2 characters'); return; }
    const otp = generateOtp();
      setGeneratedOtp(otp);
      setStep('otp');
      setResendTimer(30);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    if (value.length > 1) {
      // Paste handling
      const chars = value.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (index + i < 6) newDigits[index + i] = c;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
    } else {
      newDigits[index] = value;
      setOtpDigits(newDigits);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

      const handleVerifyAndSignup = async () => {
        const code = otpDigits.join('');
        if (!validatePhone(phone)) { setError('Please enter a valid 10-digit phone number'); return; }
        if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }
      if (code !== generatedOtp) { setError('Invalid OTP. Please try again.'); return; }

      setOtpLoading(true);
      setError('');
      try {
        const user = await AuthService.signup(email, pass, name, role);
        if (!user) { setError('Failed to create account. Email may already be in use.'); setOtpLoading(false); return; }
        navigate('/verify-email', { replace: true });
      } catch (err: any) {
        setError(err.message || 'Signup failed');
        setOtpLoading(false);
      }
    };

  const handleResend = () => {
    if (resendTimer > 0) return;
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setResendTimer(30);
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otpDigits.every(d => d !== '') && step === 'otp') {
      handleVerifyAndSignup();
    }
  }, [otpDigits]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
              <ServizoIcon size={48} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1a2b49]">
              {step === 'form' ? 'Create your account' : 'Verify your phone'}
            </h1>
              <p className="text-sm text-gray-500 mt-1">
                {step === 'form' ? 'Join Servizo and get started' : 'Enter your phone number and verify with OTP'}
              </p>
          </div>

          {step === 'form' ? (
            <>
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setRole('user')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'user' ? 'border-[#1a2b49] bg-[#1a2b49]/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <UserIcon className={`w-5 h-5 ${role === 'user' ? 'text-[#1a2b49]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${role === 'user' ? 'text-[#1a2b49]' : 'text-gray-500'}`}>I need help</span>
                  <span className="text-xs text-gray-400">Find & hire professionals</span>
                </button>
                <button 
                  onClick={() => setRole('worker')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === 'worker' ? 'border-[#1a2b49] bg-[#1a2b49]/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Briefcase className={`w-5 h-5 ${role === 'worker' ? 'text-[#1a2b49]' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${role === 'worker' ? 'text-[#1a2b49]' : 'text-gray-500'}`}>I'm a pro</span>
                  <span className="text-xs text-gray-400">Offer my services</span>
                </button>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
                  <input 
                    required value={name} onChange={e => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" required value={email} onChange={handleEmailChange}
                      placeholder="you@example.com"
                      className={`w-full border rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 transition-all ${emailError ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-[#1a73e8]'}`}
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
                      className="w-full border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-all"
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>}
                <button disabled={!!emailError || loading} className="w-full bg-[#1a2b49] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0f1d35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6">
                {/* Demo OTP display */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">Demo Mode — Your OTP is</p>
                  <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{generatedOtp}</p>
                </div>

                  {/* Phone Input */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">+91</span>
                      <input 
                        type="tel" required value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full border border-gray-200 rounded-lg py-2.5 pl-[4.5rem] pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] transition-all"
                      />
                    </div>
                  </div>

                  {/* OTP Input */}
              <div className="flex justify-center gap-2.5">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-11 h-13 text-center text-lg font-bold border-2 rounded-xl focus:outline-none transition-all ${
                      digit ? 'border-[#1a2b49] bg-[#1a2b49]/5 text-[#1a2b49]' : 'border-gray-200 text-gray-700'
                    } focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20`}
                  />
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">{error}</p>}

              <button
                onClick={handleVerifyAndSignup}
                disabled={otpLoading || otpDigits.some(d => !d)}
                className="w-full bg-[#1a2b49] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0f1d35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Verify & Create Account</>
                )}
              </button>

              <div className="text-center text-sm text-gray-500">
                Didn't receive the code?{' '}
                {resendTimer > 0 ? (
                  <span className="text-gray-400">Resend in {resendTimer}s</span>
                ) : (
                  <button onClick={handleResend} disabled={loading} className="text-[#1a73e8] font-semibold hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to signup form
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-[#1a73e8] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
