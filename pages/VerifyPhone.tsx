import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { AuthService } from '../services/auth';
import { SMSService } from '../services/sms';
import { DB } from '../services/db';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!currentUser.emailVerified) {
      navigate('/verify-email');
      return;
    }
    if (currentUser.phoneVerified) {
      redirectUser();
    }
    return () => {
      SMSService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const redirectUser = () => {
    if (currentUser?.role === 'worker') {
      navigate('/document-upload', { replace: true });
    } else if (currentUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const validatePhone = (p: string) => /^[0-9]{10}$/.test(p);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      setSending(false);
      return;
    }

    try {
        await SMSService.sendOTP(phone, currentUser?.id);
        setStep('otp');
        setSent(true);
        setCountdown(60);
        setTimeout(() => setSent(false), 3000);
        // Focus first OTP input after transition
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
        const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        console.error('Send OTP error:', msg);
        setError(msg);
      } finally {
        setSending(false);
      }
    };

    const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newOtp.every(d => d !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      verifyOTP(pasted);
    }
  };

  const verifyOTP = async (code: string) => {
    setVerifying(true);
    setError('');
    try {
        const valid = await SMSService.verifyOTP(phone, code);
      if (valid) {
        const updatedUser = { ...currentUser!, phone, phoneVerified: true };
        await DB.updateUser(updatedUser);
        AuthService.updateSession(updatedUser);
        redirectUser();
      } else {
        setError('Invalid OTP code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    verifyOTP(code);
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    setError('');
    setSending(true);
    try {
        await SMSService.sendOTP(phone, currentUser?.id);
        setSent(true);
        setCountdown(60);
        setTimeout(() => setSent(false), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to resend OTP');
    } finally {
      setSending(false);
    }
  };

  const skipVerification = () => {
    redirectUser();
  };

  if (!currentUser) return null;

  const maskedPhone = phone ? `${phone.slice(0, 3)}****${phone.slice(7)}` : '';

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#000000]">Verify your phone</h1>
            <p className="text-sm text-gray-500 mt-2">
              {step === 'phone'
                ? 'Secure your account with phone verification'
                : <>We sent a 6-digit code to <span className="font-semibold text-[#000000]">+91 {maskedPhone}</span></>
              }
            </p>
          </div>

          {/* Success toast */}
          {sent && step === 'otp' && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">OTP sent to your phone!</p>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 select-none">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="flex-1 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2.5 font-medium">{error}</p>
              )}

              <button
                id="send-otp-btn"
                type="submit"
                disabled={sending || phone.length !== 10}
                className="w-full bg-[#000000] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block text-center">
                  Enter verification code
                </label>
                <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <React.Fragment key={i}>
                      <input
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                          ${digit ? 'border-emerald-500 bg-emerald-50/50 text-[#000000]' : 'border-gray-200 text-gray-700'}
                          focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10
                          ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                        disabled={verifying}
                      />
                      {i === 2 && (
                        <div className="flex items-center px-0.5">
                          <div className="w-2 h-0.5 bg-gray-300 rounded-full" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2.5 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={verifying || otp.some(d => d === '')}
                className="w-full bg-[#000000] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Phone
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={sending || countdown > 0}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                  {sending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>

              {/* Change number */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                    SMSService.cleanup();
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Change phone number
                </button>
              </div>
            </form>
          )}

          {/* Skip option */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Want to add phone later?</p>
            <button
              onClick={skipVerification}
              className="text-sm text-gray-500 hover:text-[#000000] font-semibold transition-colors"
            >
              Skip for now &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
