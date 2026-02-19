import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { ServizoIcon } from '../components/Logo';

export default function DocumentUpload({ currentUser: initialUser }: { currentUser: any }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [pan, setPan] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadFreshUser = async () => {
      const sessionUser = AuthService.getCurrentUser();
      if (!sessionUser || sessionUser.role !== 'worker') {
        navigate('/', { replace: true });
        return;
      }
      const freshUser = await DB.getUserById(sessionUser.id);
      if (freshUser) {
        AuthService.updateSession(freshUser);
        setCurrentUser(freshUser);
      } else {
        setCurrentUser(sessionUser);
      }
    };
    loadFreshUser();
  }, []);

  if (!currentUser || currentUser.role !== 'worker') return null;

  if (currentUser.verificationStatus === 'pending') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-amber-50 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#000000] mb-3">Your Profile is Being Reviewed</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Thank you for submitting your documents! Our admin team is currently reviewing your application.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            You will be notified once your profile has been approved. This usually doesn't take long.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-amber-700 font-medium text-left">Review in progress</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold text-sm hover:bg-[#1a1a1a] transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.verificationStatus === 'approved') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 sm:p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#000000] mb-3">You're Verified!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Your documents have been approved. Create your professional profile to start receiving bookings from customers.
          </p>
          <button 
            onClick={() => navigate('/create-profile')} 
            className="px-6 py-3 bg-[#4169E1] text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
          >
            Create Profile <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhaar' | 'pan' | 'cv') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'aadhaar') setAadhaar(file);
      else if (type === 'pan') setPan(file);
      else setCv(file);
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aadhaar || !pan) return;

      setUploading(true);
      
      try {
        const [aadhaarData, panData, cvData] = await Promise.all([
          DB.uploadPhoto(aadhaar),
          DB.uploadPhoto(pan),
          cv ? DB.uploadPhoto(cv) : Promise.resolve('')
        ]);
        
        await DB.createVerificationRequest(currentUser.id, aadhaarData, panData, cvData);
      
      // Update local session with pending status
      const updatedUser = { ...currentUser, verificationStatus: 'pending' as const };
      AuthService.updateSession(updatedUser);
      setCurrentUser(updatedUser);
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#000000] mb-2">Document Verification</h1>
          <p className="text-gray-500 text-sm mb-8">Upload your Aadhaar and PAN card for verification</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Aadhaar Card</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'aadhaar')}
                  className="hidden"
                  id="aadhaar"
                />
                <label htmlFor="aadhaar" className="cursor-pointer">
                  {aadhaar ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <FileText className="w-5 h-5" />
                      <span>{aadhaar.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-400">Click to upload Aadhaar</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">PAN Card</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'pan')}
                  className="hidden"
                  id="pan"
                />
                <label htmlFor="pan" className="cursor-pointer">
                  {pan ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <FileText className="w-5 h-5" />
                      <span>{pan.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-400">Click to upload PAN</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">CV / Resume</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 'cv')}
                  className="hidden"
                  id="cv"
                />
                <label htmlFor="cv" className="cursor-pointer">
                  {cv ? (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <FileText className="w-5 h-5" />
                      <span>{cv.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-400">Click to upload CV</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
                disabled={!aadhaar || !pan || uploading}
              className="w-full py-4 bg-blue-600 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
