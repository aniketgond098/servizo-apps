
import React, { useState, useEffect } from 'react';
import { Shield, Clock, MapPin, CreditCard, MessageCircle, Phone, RefreshCw, Activity, CheckCircle2, Zap, Star, Loader2, ArrowUpRight, Share2, X, ArrowLeft, Calendar, User, AlertTriangle, Navigation } from 'lucide-react';
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
    if (!currentUser) {
      navigate('/login');
      return;
    }
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

    // Refresh booking data every 5 seconds for live tracking
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteBooking = () => {
    if (activeBooking && !activeBooking.reviewed) {
      setShowReviewModal(true);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser || !activeBooking) return;
    
    await DB.createReview({
      bookingId: activeBooking.id,
      specialistId: activeBooking.specialistId,
      userId: currentUser.id,
      rating: review.rating,
      comment: review.comment
    });
    
    const updatedBooking = { ...activeBooking, reviewed: true };
    await DB.updateBooking(updatedBooking);
    await DB.updateBookingStatus(activeBooking.id, 'completed');
    
    setShowReviewModal(false);
    navigate('/dashboard');
  };

  const handleMessage = () => {
    if (specialist) {
      navigate(`/chat/${specialist.userId || specialist.id}`);
    }
  };

  if (!activeBooking || !specialist) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 sm:space-y-8 px-4 sm:px-6 text-center">
         <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" />
         </div>
         <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic">No Active Deployments</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium max-w-xs mx-auto">Your operational queue is currently empty. Visit the directory to initiate artisan vectoring.</p>
         </div>
         <a href="/#/listing" className="px-8 sm:px-10 py-3 sm:py-4 bg-blue-600 rounded-full font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
            ENTER DIRECTORY
         </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
      
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 py-8 sm:py-12 border-b border-zinc-900">
        <div className="flex items-center gap-4 sm:gap-6">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${activeBooking.isEmergency ? 'bg-gradient-to-br from-red-600 to-orange-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center shadow-2xl ${activeBooking.isEmergency ? 'shadow-red-600/30' : 'shadow-blue-600/30'}`}>
                {activeBooking.isEmergency ? <AlertTriangle className="text-white w-6 h-6 sm:w-7 sm:h-7" /> : <Shield className="text-white w-6 h-6 sm:w-7 sm:h-7" />}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                   <h1 className="text-2xl sm:text-3xl font-black tracking-tighter italic leading-none">COMMAND<span className={activeBooking.isEmergency ? 'text-red-500' : 'text-blue-500'}>DECK</span></h1>
                   <span className={`px-2 py-0.5 ${activeBooking.isEmergency ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'} border text-[8px] font-bold uppercase rounded`}>{activeBooking.isEmergency ? 'EMERGENCY' : 'V 2.4'}</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] break-all">PROTOCOL: {activeBooking.id}</span>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-[10px] font-bold tracking-widest uppercase text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                SATELLITE SYNC: ACTIVE
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold tracking-widest uppercase text-gray-300 hover:text-white hover:border-zinc-600 transition-all">
                <Share2 className="w-3.5 h-3.5" /> SHARE TRACKING
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 mt-8 sm:mt-12">
        {/* Main Operational Feed */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Real-time Status Banner */}
            <div className={`bg-gradient-to-br ${activeBooking.isEmergency ? 'from-red-900/50 to-black' : 'from-zinc-900 to-black'} border ${activeBooking.isEmergency ? 'border-red-800' : 'border-zinc-800'} rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-12 relative overflow-hidden`}>
                {activeBooking.isEmergency && (
                  <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                )}
                <div className="absolute top-0 right-0 p-8 hidden sm:block">
                     <div className={`${activeBooking.isEmergency ? 'bg-red-600/10 border-red-500/20' : 'bg-blue-600/10 border-blue-500/20'} backdrop-blur-xl border rounded-3xl p-6 flex items-center gap-6`}>
                        <div>
                            <span className={`block text-[9px] ${activeBooking.isEmergency ? 'text-red-500/70' : 'text-blue-500/70'} tracking-widest font-bold uppercase mb-1`}>TRANSIT ETA</span>
                            <span className="text-5xl font-black tabular-nums tracking-tighter">{eta}<span className="text-sm font-normal text-gray-600 ml-2 uppercase">MINS</span></span>
                        </div>
                        <div className={`w-14 h-14 ${activeBooking.isEmergency ? 'bg-red-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center shadow-lg ${activeBooking.isEmergency ? 'shadow-red-600/20' : 'shadow-blue-600/20'}`}>
                            <Clock className="text-white w-7 h-7" />
                        </div>
                     </div>
                </div>

                <div className="space-y-4 sm:space-y-6 relative z-10 lg:pr-48">
                    <div className={`flex items-center gap-2 text-[10px] font-bold tracking-widest ${activeBooking.isEmergency ? 'text-red-500' : 'text-blue-500'} uppercase`}>
                        {activeBooking.isEmergency ? <AlertTriangle className="w-3.5 h-3.5 fill-red-500" /> : <Zap className="w-3.5 h-3.5 fill-blue-500" />}
                        {activeBooking.isEmergency ? 'EMERGENCY PRIORITY' : `VECTOR: ${specialist.location.split(',')[0]}`}
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase">
                        {activeBooking.isEmergency ? 'EMERGENCY' : 'DEPLOYMENT'}<br/>
                        <span className={`${activeBooking.isEmergency ? 'text-red-500' : 'text-blue-500'} italic`}>IN PROGRESS</span>
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 max-w-sm font-medium leading-relaxed">
                      {activeBooking.isEmergency 
                        ? 'Priority dispatch activated. Artisan is en route with maximum urgency to your location.' 
                        : 'Artisan has cleared pre-flight check and is currently navigating optimized routes to your estate.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 lg:mt-16 pt-6 sm:pt-10 border-t border-white/5">
                    <div className="space-y-3">
                         <div className={`flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest`}>
                            <CreditCard className={`w-3.5 h-3.5 ${activeBooking.isEmergency ? 'text-red-500' : 'text-blue-500'}`} /> VALUATION
                         </div>
                         <div className="flex items-baseline gap-2">
                           <span className="text-3xl font-black block">₹{activeBooking.totalValue}</span>
                           {activeBooking.isEmergency && activeBooking.emergencyMultiplier && (
                             <span className="text-xs font-bold text-red-500">+{Math.round((activeBooking.emergencyMultiplier - 1) * 100)}%</span>
                           )}
                         </div>
                    </div>
                    <div className="space-y-3">
                         <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> DISTANCE
                         </div>
                         <span className="text-3xl font-black block">4.2<span className="text-base font-medium text-gray-600 ml-1">KM</span></span>
                    </div>
                    <div className="space-y-3 hidden sm:block">
                         <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            <Activity className="text-blue-500 w-3.5 h-3.5" /> PULSE
                         </div>
                         <span className="text-3xl font-black block text-green-500">OPTIMAL</span>
                    </div>
                </div>
            </div>

            {/* Workflow Timeline */}
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-12">
                <div className="flex justify-between items-center mb-8 sm:mb-12 lg:mb-16">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic">Operational Logs</h3>
                    <div className="px-4 py-1.5 bg-zinc-900 rounded-full border border-zinc-800 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Live Stream</div>
                </div>

                <div className="relative pl-8 sm:pl-12 space-y-12 sm:space-y-16 lg:space-y-20">
                    <div className="absolute left-5 top-2 bottom-2 w-[1px] bg-zinc-800"></div>
                    
                    <div className="relative">
                        <div className="absolute -left-8 sm:-left-12 top-0 w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 border-black group">
                            <CheckCircle2 className="text-green-500 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                                <h4 className="text-base sm:text-lg font-bold uppercase tracking-tight">System Request Verified</h4>
                                <p className="text-xs text-gray-500 mt-1">Order processed by Servizo Core Engine</p>
                            </div>
                            <span className="text-[10px] font-black text-gray-600 tabular-nums">10:30:12 AM</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className={`absolute -left-8 sm:-left-12 top-0 w-8 h-8 sm:w-10 sm:h-10 ${activeBooking.isEmergency ? 'bg-red-600' : 'bg-blue-600'} rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 border-black shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse`}>
                            <RefreshCw className="text-white w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
                        </div>
                        <div className={`${activeBooking.isEmergency ? 'bg-red-600/5 border-red-500/10' : 'bg-blue-600/5 border-blue-500/10'} border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 space-y-3 sm:space-y-4`}>
                            <div className="flex justify-between items-center">
                                <h4 className={`text-lg sm:text-xl font-bold uppercase italic ${activeBooking.isEmergency ? 'text-red-400' : 'text-blue-400'}`}>
                                  {activeBooking.isEmergency ? 'Emergency Dispatch' : 'Vector Optimization'}
                                </h4>
                                <span className={`px-3 py-1 ${activeBooking.isEmergency ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'} rounded text-[9px] font-bold uppercase tracking-widest`}>Active Phase</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                {activeBooking.isEmergency 
                                  ? `Emergency priority activated. Specialist ${specialist.name} has been dispatched immediately and is en route with maximum urgency. ETA: ${eta} minutes.`
                                  : `Specialist ${specialist.name} is currently in transit via ${specialist.category} Priority Route. Telemetry indicates arrival in ${eta} minutes.`}
                            </p>
                        </div>
                    </div>

                    <div className="relative opacity-30">
                        <div className="absolute -left-8 sm:-left-12 top-0 w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 sm:border-4 border-black">
                            <MapPin className="text-zinc-700 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <h4 className="text-base sm:text-lg font-bold uppercase tracking-tight">Estate Entry Verification</h4>
                        <p className="text-xs text-gray-500 mt-1">Waiting for physical proximity match</p>
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

        {/* Tactical Intel Sidebar */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-10">
            {/* Professional Profile Mini-Card */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8 lg:space-y-10">
                <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl sm:rounded-[32px] overflow-hidden border-2 border-zinc-800 shadow-2xl p-1 bg-zinc-900">
                             <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover rounded-[20px] sm:rounded-[28px]" />
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-black shadow-xl">
                            <Star className="text-white w-5 h-5 fill-white" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-2xl sm:text-3xl font-black tracking-tighter italic">{specialist.name}</h4>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em]">{specialist.category} Specialist</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 text-center">
                        <span className="block text-[8px] text-gray-500 tracking-widest uppercase font-black">Rank</span>
                        <span className="text-sm font-black uppercase text-blue-400">Titanium</span>
                    </div>
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-1 text-center">
                        <span className="block text-[8px] text-gray-500 tracking-widest uppercase font-black">Rating</span>
                        <span className="text-sm font-black uppercase">{specialist.rating} / 5</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                    <button onClick={handleMessage} className="w-full bg-blue-600 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm tracking-widest flex items-center justify-center gap-2 sm:gap-3 group shadow-2xl shadow-blue-600/20 hover:bg-blue-500 transition-all uppercase">
                        <MessageCircle className="w-5 h-5 fill-white" /> OPEN CHANNEL
                    </button>
                    <button className="w-full border border-zinc-800 py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black text-xs tracking-widest text-gray-500 hover:text-white hover:bg-zinc-900 transition-all uppercase flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" /> VOICE SIGNAL
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button onClick={() => setShowMap(!showMap)} className="p-6 sm:p-8 bg-zinc-900/20 border border-zinc-900 rounded-3xl sm:rounded-[32px] flex flex-col items-center gap-3 sm:gap-4 group hover:border-blue-500/40 transition-all">
                    <Navigation className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[8px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">TRACK LIVE</span>
                </button>
                <button onClick={handleCompleteBooking} className="p-6 sm:p-8 bg-zinc-900/20 border border-zinc-900 rounded-3xl sm:rounded-[32px] flex flex-col items-center gap-3 sm:gap-4 group hover:border-green-500/40 transition-all">
                    <CheckCircle2 className="w-6 h-6 text-gray-600 group-hover:text-green-500 transition-colors" />
                    <span className="text-[8px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">COMPLETE</span>
                </button>
            </div>

            {/* System Specs Footer */}
            <div className="p-6 text-center space-y-2 opacity-30">
                 <div className="h-[1px] w-full bg-zinc-800 mb-4"></div>
                 <p className="text-[8px] font-black tracking-[0.5em] text-gray-400 uppercase">SERVIZO ENCRYPTION: SHA-256</p>
                 <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Operational Build 2.0.4 - Mumbai</p>
            </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full space-y-6">
            <h3 className="text-2xl font-black tracking-tight">Rate Your Experience</h3>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => setReview(prev => ({ ...prev, rating: r }))}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-8 h-8 ${r <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Comment</label>
              <textarea
                value={review.comment}
                onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500 min-h-[120px]"
                placeholder="Share your experience..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmitReview} className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all">
                Submit Review
              </button>
              <button onClick={() => setShowReviewModal(false)} className="px-6 py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-all">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Map Modal */}
      {showMap && activeBooking && specialist && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">Live Tracking</h3>
              <p className="text-xs text-gray-500">Real-time worker location</p>
            </div>
            <button onClick={() => setShowMap(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 relative">
            <MapView
              specialists={[
                {
                  ...specialist,
                  lat: activeBooking.workerLat || specialist.lat,
                  lng: activeBooking.workerLng || specialist.lng,
                  name: `${specialist.name} (Worker)`,
                  availability: 'available'
                },
                {
                  id: 'user-location',
                  name: 'Your Location',
                  lat: activeBooking.userLat,
                  lng: activeBooking.userLng,
                  avatar: '',
                  category: specialist.category,
                  hourlyRate: 0,
                  rating: 0,
                  description: '',
                  location: '',
                  availability: 'busy',
                  userId: currentUser.id
                } as Specialist
              ]}
              userLoc={{ lat: activeBooking.userLat, lng: activeBooking.userLng }}
              getAvailabilityColor={(status) => status === 'available' ? 'border-green-500' : 'border-blue-500'}
              showRoute={true}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Worker Location</p>
                  <p className="text-sm font-bold">{specialist.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-green-500">LIVE</span>
                </div>
              </div>
              {activeBooking.workerLastUpdate && (
                <p className="text-xs text-gray-500">Last updated: {new Date(activeBooking.workerLastUpdate).toLocaleTimeString()}</p>
              )}
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-blue-600/20 rounded-lg text-center">
                  <p className="text-xs text-blue-400">ETA</p>
                  <p className="text-lg font-black">{eta} min</p>
                </div>
                <div className="flex-1 p-2 bg-purple-600/20 rounded-lg text-center">
                  <p className="text-xs text-purple-400">Distance</p>
                  <p className="text-lg font-black">4.2 km</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
