
import React, { useState, useEffect } from 'react';
import { Shield, Clock, MapPin, CreditCard, MessageCircle, Phone, RefreshCw, Activity, CheckCircle2, Star, Loader2, Share2, X, ArrowLeft, AlertTriangle, Navigation, Info, IndianRupee, Check, XCircle } from 'lucide-react';
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
  const [showMap, setShowMap] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'review' | 'paying' | 'done'>('review');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const loadData = async () => {
      const bookings = await DB.getBookings();
      // Find active or pending_payment booking for this user
        const userBookings = bookings
          .filter(b => b.userId === currentUser.id && (b.status === 'active' || b.status === 'pending_payment' || b.status === 'cancellation_pending'))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const booking = userBookings[0] || null;
      if (booking) {
        setActiveBooking(booking);
        const specialists = await DB.getSpecialists();
        const s = specialists.find(sp => sp.id === booking.specialistId);
        if (s) setSpecialist(s);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMessage = () => {
    if (specialist) navigate(`/chat/${specialist.userId || specialist.id}`);
  };

  const handleDemoPayment = async () => {
    if (!activeBooking) return;
    setPaymentStep('paying');
    await new Promise(r => setTimeout(r, 2000));
    await DB.markBookingPaid(activeBooking.id);
    setPaymentStep('done');
    setTimeout(() => navigate('/dashboard'), 3000);
  };

  const handleRequestCancel = async () => {
    if (!activeBooking || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      await DB.requestCancellation(activeBooking.id, cancelReason.trim());
      setActiveBooking({ ...activeBooking, status: 'cancellation_pending', cancellationReason: cancelReason.trim() });
      setShowCancelModal(false);
      setCancelReason('');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!activeBooking || !specialist) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#000000] mb-2">No Active Bookings</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">You don't have any active bookings. Browse our specialists to get started.</p>
        </div>
        <a href="/#/listing" className="px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold text-sm hover:bg-[#1a1a1a] transition-colors">
          Browse Specialists
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

          {/* Status Banner */}
          <div className={`rounded-xl p-6 sm:p-8 mb-6 ${activeBooking.status === 'cancellation_pending' ? 'bg-orange-50 border border-orange-100' : activeBooking.status === 'pending_payment' ? 'bg-amber-50 border border-amber-100' : activeBooking.isEmergency ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {activeBooking.status === 'cancellation_pending' ? <XCircle className="w-5 h-5 text-orange-500" /> : activeBooking.status === 'pending_payment' ? <IndianRupee className="w-5 h-5 text-amber-600" /> : activeBooking.isEmergency ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Activity className="w-5 h-5 text-[#4169E1]" />}
                  <span className={`text-xs font-bold uppercase tracking-wide ${activeBooking.status === 'cancellation_pending' ? 'text-orange-600' : activeBooking.status === 'pending_payment' ? 'text-amber-600' : activeBooking.isEmergency ? 'text-red-600' : 'text-[#4169E1]'}`}>
                    {activeBooking.status === 'cancellation_pending' ? 'Cancellation Pending' : activeBooking.status === 'pending_payment' ? 'Payment Required' : activeBooking.isEmergency ? 'Emergency Booking' : 'Active Booking'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] mb-1">
                  {activeBooking.status === 'cancellation_pending' ? 'Awaiting Worker Approval' : activeBooking.status === 'pending_payment' ? 'Review & Pay' : 'Service In Progress'}
                </h1>
                <p className="text-sm text-gray-500">Booking ID: {activeBooking.id}</p>
              </div>
              {activeBooking.status !== 'pending_payment' && activeBooking.status !== 'cancellation_pending' && (
                <div className={`px-5 py-3 rounded-xl text-center ${activeBooking.isEmergency ? 'bg-red-100' : 'bg-blue-100'}`}>
                  <p className="text-xs text-gray-500 mb-0.5">ETA</p>
                  <p className="text-3xl font-bold text-[#000000]">{eta}<span className="text-sm font-normal text-gray-500 ml-1">min</span></p>
                </div>
              )}
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <CreditCard className="w-5 h-5 text-[#4169E1] mx-auto mb-2" />
                <p className="text-xl font-bold text-[#000000]">₹{activeBooking.totalValue}</p>
                <p className="text-xs text-gray-400">Total Value</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <MapPin className="w-5 h-5 text-[#4169E1] mx-auto mb-2" />
                <p className="text-xl font-bold text-[#000000]">4.2 km</p>
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
              <h3 className="text-base font-bold text-[#000000] mb-6">Booking Timeline</h3>
              <div className="relative pl-8 space-y-8">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div className="relative">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#000000]">Booking Confirmed</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Order processed and confirmed</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-8 top-0 w-6 h-6 ${activeBooking.isEmergency ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                    <RefreshCw className={`w-4 h-4 ${activeBooking.isEmergency ? 'text-red-600' : 'text-[#4169E1]'} animate-spin`} />
                  </div>
                  <div className={`p-4 rounded-lg ${activeBooking.isEmergency ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                    <h4 className={`text-sm font-semibold ${activeBooking.isEmergency ? 'text-red-700' : 'text-[#4169E1]'}`}>
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
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  specialist.availability === 'available' ? 'bg-green-500' :
                  specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center">
                    <img src={specialist.avatar} alt={specialist.name} className="w-16 h-16 rounded-full object-cover" />
                  </div>
                </div>
              <h4 className="text-lg font-bold text-[#000000]">{specialist.name}</h4>
              <p className="text-xs text-[#4169E1] font-medium mb-4">{specialist.category} Specialist</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-lg font-bold text-[#000000]">{specialist.rating}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Projects</p>
                  <p className="text-lg font-bold text-[#000000]">{specialist.projects}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <button onClick={handleMessage} className="w-full bg-[#000000] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors">
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
                <button className="w-full border border-gray-200 text-gray-600 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <Phone className="w-4 h-4" /> Call
                </button>
              </div>
            </div>

            {/* Actions */}
              <div className="grid grid-cols-1 gap-3">
                {activeBooking.status === 'active' && (
                  <>
                    <button onClick={() => setShowMap(!showMap)} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-[#4169E1] transition-all group">
                      <Navigation className="w-5 h-5 text-gray-400 group-hover:text-[#4169E1] mx-auto mb-2 transition-colors" />
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-[#000000]">Track Live</span>
                    </button>
                    <button onClick={() => setShowCancelModal(true)} className="bg-white border border-red-100 rounded-xl p-4 text-center hover:border-red-300 transition-all group">
                      <XCircle className="w-5 h-5 text-gray-400 group-hover:text-red-500 mx-auto mb-2 transition-colors" />
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-red-600">Cancel Booking</span>
                    </button>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">The worker will submit final charges when work is done. You'll review and pay to complete the booking.</p>
                    </div>
                  </>
                )}

                {/* Cancellation Pending Info */}
                {activeBooking.status === 'cancellation_pending' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                      <h4 className="text-sm font-bold text-orange-800">Cancellation Requested</h4>
                    </div>
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Your cancellation request has been sent to the worker. They need to approve it before the booking can be cancelled.
                    </p>
                    {activeBooking.cancellationReason && (
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Your Reason</p>
                        <p className="text-xs text-gray-700">{activeBooking.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Review Section */}
                {activeBooking.status === 'pending_payment' && (
                  <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h4 className="text-sm font-bold text-[#000000] mb-4 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-[#4169E1]" /> Payment Summary
                    </h4>

                    {/* Base charge */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Base Service Charge</span>
                      <span className="text-sm font-semibold text-[#000000]">₹{activeBooking.totalValue}</span>
                    </div>

                    {/* Extra charges */}
                    {(activeBooking.extraCharges || []).length > 0 && (
                      <div className="border-t border-gray-100 mt-2 pt-2 space-y-2">
                        {activeBooking.extraCharges!.map(charge => (
                          <div key={charge.id} className="flex justify-between items-start py-1.5">
                            <div className="flex-1 mr-3">
                              <p className="text-sm text-gray-600">{charge.description}</p>
                              <p className="text-[10px] text-gray-400">{new Date(charge.addedAt).toLocaleString()}</p>
                            </div>
                            <span className="text-sm font-semibold text-amber-600">+₹{charge.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-[#000000] mt-3 pt-3 flex justify-between items-center">
                      <span className="text-base font-bold text-[#000000]">Total</span>
                      <span className="text-xl font-bold text-[#4169E1]">₹{activeBooking.finalTotal || activeBooking.totalValue}</span>
                    </div>

                    {/* Payment Button */}
                    {paymentStep === 'review' && (
                      <button
                        onClick={handleDemoPayment}
                        className="w-full mt-5 py-3.5 bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                      >
                        <CreditCard className="w-4 h-4" /> Approve & Pay ₹{activeBooking.finalTotal || activeBooking.totalValue}
                      </button>
                    )}
                    {paymentStep === 'paying' && (
                      <div className="w-full mt-5 py-3.5 bg-gray-100 rounded-xl flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#4169E1] rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-gray-500">Processing Payment...</span>
                      </div>
                    )}
                    {paymentStep === 'done' && (
                      <div className="w-full mt-5 py-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">Payment Successful!</span>
                      </div>
                    )}

                    <p className="text-[10px] text-center text-gray-400 mt-3">This is a demo payment. No real charges will be made.</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Track Live Modal */}
      {showMap && activeBooking && specialist && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-[#4169E1]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#000000]">Live Tracking</h3>
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
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-green-400 flex-shrink-0">
                      <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#000000] truncate">{specialist.name}</p>
                    <p className="text-xs text-gray-400">{specialist.category} Specialist</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2.5 bg-blue-50 rounded-xl text-center">
                    <p className="text-[10px] text-[#4169E1] font-medium uppercase tracking-wide">ETA</p>
                    <p className="text-lg font-bold text-[#000000] leading-tight">{eta}<span className="text-xs font-normal text-gray-400 ml-0.5">m</span></p>
                  </div>
                  <div className="px-4 py-2.5 bg-purple-50 rounded-xl text-center">
                    <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">Dist</p>
                    <p className="text-lg font-bold text-[#000000] leading-tight">4.2<span className="text-xs font-normal text-gray-400 ml-0.5">km</span></p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={handleMessage} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#000000] text-white hover:bg-[#1a1a1a] transition-colors">
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
      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#000000]">Cancel Booking</h3>
                <p className="text-xs text-gray-400">The worker must approve your request</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Reason for cancellation *</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel..."
                className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-red-300 resize-none"
              />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">This will send a cancellation request to the worker. The booking will only be cancelled once the worker approves it.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleRequestCancel}
                disabled={!cancelReason.trim() || cancelLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                Request Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
