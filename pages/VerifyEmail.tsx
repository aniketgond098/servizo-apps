import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { EmailService } from '../services/email';
import { DB } from '../services/db';
import { auth } from '../services/firebase';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(true);
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
  }, []);

  const handleCheckVerification = async () => {
    setError('');
    setChecking(true);

    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        const updatedUser = { ...currentUser!, emailVerified: true };
        await DB.updateUser(updatedUser);
        AuthService.updateSession(updatedUser);
        // Automatically redirect to phone verification
        navigate('/verify-phone', { replace: true });
      } else {
        setError('Email not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to check verification status');
    } finally {
      setChecking(false);
    }
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      await EmailService.resendVerificationEmail();
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError('Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">VERIFY<span className="text-blue-500">EMAIL</span></h1>
          <p className="text-sm text-gray-400">We've sent a 6-digit code to<br/><span className="text-white font-bold">{currentUser.email}</span></p>
        </div>

        {sent && (
          <div className="p-4 bg-green-600/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-400">Verification email sent! Check your inbox.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-400 text-center">
              Click the verification link in your email, then click the button below.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

          <button 
            onClick={handleCheckVerification} 
            disabled={checking}
            className="w-full bg-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                CHECKING...
              </>
            ) : (
              <>
                I'VE VERIFIED MY EMAIL
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button 
            onClick={resendEmail} 
            disabled={resending}
            className="text-sm text-gray-400 hover:text-blue-500 font-bold disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
