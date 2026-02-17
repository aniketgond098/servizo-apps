
import React, { useState, useEffect } from 'react';
import { Shield, Clock, MapPin, CreditCard, MessageCircle, Phone, RefreshCw, Activity, CheckCircle2, Star, Loader2, Share2, X, ArrowLeft, AlertTriangle, Navigation } from 'lucide-react';
import { DB } from '../services/db';
import { Specialist, Booking as BookingType } from '../types';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { MapView } from '../components/MapView';
import { PhotoGallery } from '../components/PhotoGallery';

export default function Booking() {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState<BookingType | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [eta, setEta] = useState(12);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [showMap, setShowMap] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const loadData = async () => {
      const active = await DB.getActiveBooking(currentUser.id);
      if (active) {
        setActiveBooking(active);
        const specialists = await DB.getSpecialists();
        const s = specialists.find(sp => sp.id === active.specialistId);
        if (s) setSpecialist(s);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteBooking = () => {
    if (activeBooking && !activeBooking.reviewed) setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !activeBooking) return;
    await DB.createReview({ bookingId: activeBooking.id, specialistId: activeBooking.specialistId, userId: currentUser.id, rating: review.rating, comment: review.comment });
    const updatedBooking = { ...activeBooking, reviewed: true };
    await DB.updateBooking(updatedBooking);
    await DB.updateBookingStatus(activeBooking.id, 'completed');
    setShowReviewModal(false);
    navigate('/dashboard');
  };

  const handleMessage = () => {
    if (specialist) navigate(`/chat/${specialist.userId || specialist.id}`);
  };

  if (!activeBooking || !specialist) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a2b49] mb-2">No Active Bookings</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">You don't have any active bookings. Browse our specialists to get started.</p>
        </div>
        <a href="/#/listing" className="px-6 py-3 bg-[#1a2b49] text-white rounded-lg font-semibold text-sm hover:bg-[#0f1d35] transition-colors">
          Browse Specialists
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a2b49] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Status Banner */}
        <div className={`rounded-xl p-6 sm:p-8 mb-6 ${activeBooking.isEmergency ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {activeBooking.isEmergency ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Activity className="w-5 h-5 text-[#1a73e8]" />}
                <span className={`text-xs font-bold uppercase tracking-wide ${activeBooking.isEmergency ? 'text-red-600' : 'text-[#1a73e8]'}`}>
                  {activeBooking.isEmergency ? 'Emergency Booking' : 'Active Booking'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2b49] mb-1">Service In Progress</h1>
              <p className="text-sm text-gray-500">Booking ID: {activeBooking.id}</p>
            </div>
            <div className={`px-5 py-3 rounded-xl text-center ${activeBooking.isEmergency ? 'bg-red-100' : 'bg-blue-100'}`}>
              <p className="text-xs text-gray-500 mb-0.5">ETA</p>
              <p className="text-3xl font-bold text-[#1a2b49]">{eta}<span className="text-sm font-normal text-gray-500 ml-1">min</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <CreditCard className="w-5 h-5 text-[#1a73e8] mx-auto mb-2" />
                <p className="text-xl font-bold text-[#1a2b49]">₹{activeBooking.totalValue}</p>
                <p className="text-xs text-gray-400">Total Value</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <MapPin className="w-5 h-5 text-[#1a73e8] mx-auto mb-2" />
                <p className="text-xl font-bold text-[#1a2b49]">4.2 km</p>
                <p className="text-xs text-gray-400">Distance</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <Activity className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-400">Status</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#1a2b49] mb-6">Booking Timeline</h3>
              <div className="relative pl-8 space-y-8">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div className="relative">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1a2b49]">Booking Confirmed</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Order processed and confirmed</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-8 top-0 w-6 h-6 ${activeBooking.isEmergency ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                    <RefreshCw className={`w-4 h-4 ${activeBooking.isEmergency ? 'text-red-600' : 'text-[#1a73e8]'} animate-spin`} />
                  </div>
                  <div className={`p-4 rounded-lg ${activeBooking.isEmergency ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                    <h4 className={`text-sm font-semibold ${activeBooking.isEmergency ? 'text-red-700' : 'text-[#1a73e8]'}`}>
                      {activeBooking.isEmergency ? 'Emergency Dispatch' : 'Professional En Route'}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {specialist.name} is on the way. Estimated arrival in {eta} minutes.
                    </p>
                  </div>
                </div>

                <div className="relative opacity-40">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500">Arrival & Service</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Waiting for professional to arrive</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            <PhotoGallery
              bookingId={activeBooking.id}
              beforePhotos={activeBooking.beforePhotos}
              afterPhotos={activeBooking.afterPhotos}
              problemPhotos={activeBooking.problemPhotos}
              canUpload={true}
              uploadType="problem"
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Professional Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-[#1a73e8]">
                <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="text-lg font-bold text-[#1a2b49]">{specialist.name}</h4>
              <p className="text-xs text-[#1a73e8] font-medium mb-4">{specialist.category} Specialist</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-lg font-bold text-[#1a2b49]">{specialist.rating}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Projects</p>
                  <p className="text-lg font-bold text-[#1a2b49]">{specialist.projects}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <button onClick={handleMessage} className="w-full bg-[#1a2b49] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0f1d35] transition-colors">
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
                <button className="w-full border border-gray-200 text-gray-600 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <Phone className="w-4 h-4" /> Call
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowMap(!showMap)} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-[#1a73e8] transition-all group">
                <Navigation className="w-5 h-5 text-gray-400 group-hover:text-[#1a73e8] mx-auto mb-2 transition-colors" />
                <span className="text-xs font-semibold text-gray-500 group-hover:text-[#1a2b49]">Track Live</span>
              </button>
              <button onClick={handleCompleteBooking} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-green-500 transition-all group">
                <CheckCircle2 className="w-5 h-5 text-gray-400 group-hover:text-green-500 mx-auto mb-2 transition-colors" />
                <span className="text-xs font-semibold text-gray-500 group-hover:text-[#1a2b49]">Complete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-5">
            <h3 className="text-xl font-bold text-[#1a2b49]">Rate Your Experience</h3>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setReview(prev => ({ ...prev, rating: r }))} className="p-1 hover:scale-110 transition-transform">
                    <Star className={`w-8 h-8 ${r <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">Comment</label>
              <textarea value={review.comment} onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#1a73e8] min-h-[100px]"
                placeholder="Share your experience..." />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmitReview} className="flex-1 px-4 py-2.5 bg-[#1a2b49] text-white rounded-lg font-semibold text-sm">Submit</button>
              <button onClick={() => setShowReviewModal(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Track Live Modal */}
      {showMap && activeBooking && specialist && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-[#1a73e8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a2b49]">Live Tracking</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-semibold">Tracking active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowMap(false)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              <MapView
                specialists={[
                  { ...specialist, lat: activeBooking.workerLat || specialist.lat, lng: activeBooking.workerLng || specialist.lng, name: `${specialist.name} (Worker)`, availability: 'available' },
                  { id: 'user-location', name: 'Your Location', lat: activeBooking.userLat, lng: activeBooking.userLng, avatar: '', category: specialist.category, hourlyRate: 0, rating: 0, description: '', location: '', availability: 'busy', userId: currentUser!.id } as Specialist
                ]}
                userLoc={{ lat: activeBooking.userLat, lng: activeBooking.userLng }}
                getAvailabilityColor={(status) => status === 'available' ? 'border-green-500' : 'border-blue-500'}
                showRoute={true}
              />
            </div>

            {/* Bottom Info Panel */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Worker info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-green-400 flex-shrink-0">
                    <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1a2b49] truncate">{specialist.name}</p>
                    <p className="text-xs text-gray-400">{specialist.category} Specialist</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-center">
                    <p className="text-[10px] text-[#1a73e8] font-medium uppercase tracking-wide">ETA</p>
                    <p className="text-lg font-bold text-[#1a2b49] leading-tight">{eta}<span className="text-xs font-normal text-gray-400 ml-0.5">m</span></p>
                  </div>
                  <div className="px-4 py-2.5 bg-purple-50 rounded-xl text-center">
                    <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">Dist</p>
                    <p className="text-lg font-bold text-[#1a2b49] leading-tight">4.2<span className="text-xs font-normal text-gray-400 ml-0.5">km</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={handleMessage} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1a2b49] text-white hover:bg-[#0f1d35] transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
