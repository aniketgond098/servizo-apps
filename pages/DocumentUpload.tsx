import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { DB } from '../services/db';

export default function DocumentUpload({ currentUser }: { currentUser: any }) {
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [pan, setPan] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'worker') {
      navigate('/', { replace: true });
      return;
    }
  }, []);

  if (!currentUser || currentUser.role !== 'worker') return null;

  if (currentUser.verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black mb-2">Application Under Review</h2>
          <p className="text-gray-400 mb-6">Your documents are being reviewed by our admin team. You'll be notified once approved.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-zinc-800 rounded-full font-bold hover:bg-zinc-700 transition-all">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.verificationStatus === 'approved') {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Verified!</h2>
          <p className="text-gray-400 mb-6">Your documents are approved. Create your profile to start receiving bookings.</p>
          <button onClick={() => navigate('/create-profile')} className="px-6 py-3 bg-blue-600 rounded-full font-bold">
            Create Profile
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaar || !pan) return;

    setUploading(true);
    
    try {
      const aadhaarData = await fileToBase64(aadhaar);
      const panData = await fileToBase64(pan);
      const cvData = cv ? await fileToBase64(cv) : '';
      
      await DB.createVerificationRequest(currentUser.id, aadhaarData, panData, cvData);
      
      setTimeout(() => {
        setUploading(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary p-4 pt-24">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-3xl p-8">
          <h1 className="text-3xl font-black mb-2">Document Verification</h1>
          <p className="text-gray-400 mb-8">Upload your Aadhaar and PAN card for verification</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Aadhaar Card</label>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
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
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
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
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
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
