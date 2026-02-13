import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { SMSService } from '../services/sms';
import { DB } from '../services/db';

export default function VerifyPhone() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
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
  }, []);

  const redirectUser = () => {
    if (currentUser?.role === 'worker') {
      navigate('/document-upload', { replace: true });
    } else if (currentUser?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);

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
      const otpCode = await SMSService.sendOTP(phone);
      setGeneratedOTP(otpCode);
      setStep('otp');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const verified = await SMSService.verifyOTP(phone, otp);
      if (verified) {
        const updatedUser = { ...currentUser!, phone, phoneVerified: true };
        await DB.updateUser(updatedUser);
        AuthService.updateSession(updatedUser);
        redirectUser();
      } else {
        setError('Invalid or expired OTP code');
      }
    } catch (err: any) {
      setError('Invalid OTP code');
    } finally {
      setVerifying(false);
    }
  };

  const resendOTP = async () => {
    setError('');
    setSending(true);
    try {
      const otpCode = await SMSService.sendOTP(phone);
      setGeneratedOTP(otpCode);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setSending(false);
    }
  };

  const skipVerification = () => {
    redirectUser();
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">VERIFY<span className="text-green-500">PHONE</span></h1>
          <p className="text-sm text-gray-400">
            {step === 'phone' 
              ? 'Secure your account with phone verification' 
              : 'Enter the OTP sent to your phone'}
          </p>
        </div>

        {sent && step === 'otp' && (
          <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-xl">
            <p className="text-sm text-green-400 text-center mb-2">📱 OTP sent successfully!</p>
            <div className="p-3 bg-green-600/20 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-1">Your OTP:</p>
              <p className="text-3xl font-black text-green-400 tracking-widest">{generatedOTP}</p>
            </div>
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-lg font-bold tracking-wider focus:border-green-500 outline-none"
                maxLength={10}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            <button type="submit" disabled={sending} className="w-full bg-green-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50">
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  SENDING...
                </>
              ) : (
                <>
                  SEND OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-center text-2xl font-bold tracking-widest focus:border-green-500 outline-none"
                maxLength={6}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            <button type="submit" disabled={verifying} className="w-full bg-green-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50">
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  VERIFY OTP
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center">
              <button type="button" onClick={resendOTP} disabled={sending} className="text-sm text-gray-400 hover:text-green-500 font-bold disabled:opacity-50">
                {sending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-4 border-t border-zinc-800">
          <p className="text-xs text-gray-500 mb-2">Want to add phone later?</p>
          <button onClick={skipVerification} className="text-sm text-gray-400 hover:text-white font-bold">
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
