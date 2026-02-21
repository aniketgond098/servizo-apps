
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MapPin, ChevronDown, Loader2, CheckCircle2,
  Clock, X, Droplets, Wrench, Plug, Paintbrush, Ruler, Bot,
  IndianRupee, Siren, FileText, Phone
} from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { ServiceCategory, EmergencyRequest } from '../types';

const CATEGORIES: { name: ServiceCategory; icon: React.ElementType; color: string; bg: string }[] = [
  { name: 'Plumbing',      icon: Droplets,   color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  { name: 'Electrical',   icon: Plug,       color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { name: 'Mechanical',   icon: Wrench,     color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { name: 'Aesthetics',   icon: Paintbrush, color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200' },
  { name: 'Architecture', icon: Ruler,      color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { name: 'Automation',   icon: Bot,        color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

const CATEGORY_BASE_RATES: Record<ServiceCategory, number> = {
  Plumbing: 800,
  Electrical: 900,
  Mechanical: 1000,
  Aesthetics: 700,
  Architecture: 1500,
  Automation: 1200,
};

export default function EmergencyBooking() {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<EmergencyRequest | null>(null);
  const [pastRequests, setPastRequests] = useState<EmergencyRequest[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    DB.getUserEmergencyRequests(user.id).then(r => {
      setPastRequests(r);
      setLoadingPast(false);
    });
    // Auto-get location on mount
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser.'); return; }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocError('Could not detect location. Please enter your address manually.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const baseRate = category ? CATEGORY_BASE_RATES[category] : 0;
  const emergencyRate = Math.round(baseRate * 1.2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || !description.trim() || !address.trim()) return;
    if (lat === null || lng === null) {
      setLocError('Please allow location access or enter your address and try detecting location again.');
      return;
    }
    setSubmitting(true);
    try {
      const req = await DB.createEmergencyRequest({
        userId: user.id,
        userName: user.name,
        category,
        description: description.trim(),
        address: address.trim(),
        lat,
        lng,
        baseRate,
      });
      setSubmitted(req);
      setPastRequests(prev => [req, ...prev]);
    } catch {
      alert('Failed to submit request. Please try again.');
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this emergency request?')) return;
    await DB.cancelEmergencyRequest(id);
    setPastRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    if (submitted?.id === id) setSubmitted(null);
  };

  const statusBadge = (status: EmergencyRequest['status']) => {
    if (status === 'open')     return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Open</span>;
    if (status === 'accepted') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Accepted</span>;
    return                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Cancelled</span>;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Nearby {submitted.category} specialists within 5 km have been notified. You'll get a notification once someone accepts.
          </p>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <Siren className="w-4 h-4" /> Emergency Request — {submitted.id}
            </div>
            <div className="text-sm text-gray-600"><span className="font-medium">Category:</span> {submitted.category}</div>
            <div className="text-sm text-gray-600"><span className="font-medium">Rate:</span> ₹{submitted.emergencyRate}/hr <span className="text-green-600 text-xs">(20% emergency premium)</span></div>
            <div className="text-sm text-gray-600"><span className="font-medium">Address:</span> {submitted.address}</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSubmitted(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              View History
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Siren className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Emergency Booking</h1>
          </div>
          <p className="text-red-100 text-sm">Specialists within 5 km get notified instantly. You pay 20% above standard rate.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Describe Your Emergency</h2>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Service Category <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(({ name, icon: Icon, color, bg }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition text-center ${
                    category === name
                      ? `${bg} border-current ${color}`
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${category === name ? color : 'text-gray-400'}`} />
                  <span className="text-xs font-medium leading-tight">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price preview */}
          {category && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <IndianRupee className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="text-sm">
                <span className="text-gray-500 line-through mr-2">₹{baseRate}/hr</span>
                <span className="text-amber-800 font-bold text-base">₹{emergencyRate}/hr</span>
                <span className="text-amber-600 text-xs ml-2">+20% emergency premium</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Describe the Problem <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Burst pipe under the kitchen sink, water flooding the floor..."
              rows={4}
              maxLength={500}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{description.length}/500</div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Service Address <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Flat/House No, Street, Locality, City"
                required
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {locating ? (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting location...
                </span>
              ) : lat !== null ? (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <MapPin className="w-3.5 h-3.5" /> Location detected
                </span>
              ) : (
                <button type="button" onClick={detectLocation} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <MapPin className="w-3.5 h-3.5" /> Detect my location
                </button>
              )}
              {locError && <span className="text-xs text-red-500">{locError}</span>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !category || !description.trim() || !address.trim()}
            className="w-full py-3.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Siren className="w-4 h-4" /> Submit Emergency Request</>}
          </button>
        </form>

        {/* Past Requests */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Emergency Requests</h2>
          {loadingPast ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : pastRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No emergency requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {pastRequests.map(req => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{req.category}</span>
                        {statusBadge(req.status)}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{req.description}</p>
                    </div>
                    {req.status === 'open' && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{req.address}</div>
                    <div className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{req.emergencyRate}/hr</div>
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(req.createdAt).toLocaleString()}</div>
                    {req.acceptedByName && (
                      <div className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />{req.acceptedByName}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
