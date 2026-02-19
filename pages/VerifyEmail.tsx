import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { AuthService } from '../services/auth';
import { EmailService } from '../services/email';
import { DB } from '../services/db';
import { ServizoIcon } from '../components/Logo';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.emailVerified) {
      navigate('/verify-phone');
      return;
    }
    // Send OTP on mount
    sendOTP();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    if (countdown > 0) return;
    setSending(true);
    setError('');
    try {
      await EmailService.sendOTP(currentUser!.email, currentUser!.name);
      setSent(true);
      setCountdown(60);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
        const msg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        console.error('Send OTP error:', msg);
        setError(msg);
      } finally {
      setSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
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
      const valid = await EmailService.verifyOTP(currentUser!.email, code);
      if (valid) {
        const updatedUser = { ...currentUser!, emailVerified: true };
        await DB.updateUser(updatedUser);
        AuthService.updateSession(updatedUser);
        navigate('/verify-phone', { replace: true });
      } else {
        setError('Invalid or expired code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    verifyOTP(code);
  };

  if (!currentUser) return null;

  // Mask email: show first 3 chars and domain
  const email = currentUser.email;
  const [localPart, domain] = email.split('@');
  const maskedEmail = localPart.length > 3
    ? `${localPart.slice(0, 3)}${'*'.repeat(Math.min(localPart.length - 3, 5))}@${domain}`
    : email;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4169E1] to-[#1557b0] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#000000]">Verify your email</h1>
            <p className="text-sm text-gray-500 mt-2">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-[#000000] mt-1">{maskedEmail}</p>
          </div>

          {/* Success toast */}
          {sent && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Verification code sent! Check your inbox.</p>
            </div>
          )}

          {/* OTP Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
                        ${digit ? 'border-[#4169E1] bg-blue-50/50 text-[#000000]' : 'border-gray-200 text-gray-700'}
                        focus:border-[#4169E1] focus:ring-4 focus:ring-[#4169E1]/10
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
                  Verify Email
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-xs text-gray-400">Didn't receive the code?</p>
            <button
              onClick={sendOTP}
              disabled={sending || countdown > 0}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4169E1] hover:text-[#1557b0] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
              {sending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
            <p className="text-xs text-gray-400">
              Check your spam folder if you don't see it in your inbox
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
