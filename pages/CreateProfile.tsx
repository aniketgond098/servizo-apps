import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { ServiceCategory } from '../types';
import { Save, Camera, User } from 'lucide-react';
const ImageCropper = React.lazy(() => import('../components/ImageCropper'));

export default function CreateProfile() {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Mechanical' as ServiceCategory,
    description: '',
    hourlyRate: 1500,
    location: 'Mumbai, India',
    skills: '',
    credentials: ''
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setRawImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!user || user.role !== 'worker') {
      navigate('/login');
      return;
    }
    if (user.verificationStatus !== 'approved') {
      navigate('/document-upload');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const specialist = {
      id: user.id,
      userId: user.id,
      name: user.name,
      title: formData.title,
      category: formData.category,
      description: formData.description,
      tags: [],
      hourlyRate: formData.hourlyRate,
      rating: 5.0,
      experience: 1,
      projects: 0,
      location: formData.location,
      lat: 19.0760,
      lng: 72.8777,
        avatar: avatarPreview || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      credentials: formData.credentials.split(',').map(c => c.trim()).filter(Boolean),
      availability: 'available' as const,
      verified: true,
      backgroundChecked: true
    };

    await DB.updateSpecialist(specialist);
    navigate('/worker-dashboard');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <div className="pt-8 sm:pt-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] mb-2">Create Your Profile</h1>
          <p className="text-gray-500 text-sm">Your documents have been approved. Complete your profile to start receiving bookings.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full cursor-pointer group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-28 h-28 rounded-full object-cover ring-4 ring-[#4169E1]/20" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-200">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-[#4169E1] font-medium hover:underline">
                Upload Profile Photo
              </button>
            </div>

            <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Professional Title</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Senior Plumber, Master Electrician"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as ServiceCategory})}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
            >
              <option>Architecture</option>
              <option>Plumbing</option>
              <option>Mechanical</option>
              <option>Aesthetics</option>
              <option>Electrical</option>
              <option>Automation</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your expertise and experience..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hourly Rate (Rs.)</label>
              <input 
                type="number"
                required
                value={formData.hourlyRate}
                onChange={e => setFormData({...formData, hourlyRate: Number(e.target.value)})}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
              <input 
                required
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="City, State"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skills (comma separated)</label>
            <input 
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
              placeholder="e.g., Welding, Pipe Fitting, Leak Detection"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credentials (comma separated)</label>
            <input 
              value={formData.credentials}
              onChange={e => setFormData({...formData, credentials: e.target.value})}
              placeholder="e.g., ITI Certified, 10 Years Experience"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/20 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#000000] text-white py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors"
          >
            <Save className="w-5 h-5" />
            Create Profile
          </button>
          </form>
        </div>

        {rawImage && (
          <React.Suspense fallback={null}>
            <ImageCropper
              imageSrc={rawImage}
              onCropDone={(cropped) => { setAvatarPreview(cropped); setRawImage(null); }}
              onCancel={() => setRawImage(null)}
            />
          </React.Suspense>
        )}
      </div>
  );
}
