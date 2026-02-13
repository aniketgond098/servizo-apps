
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Star, MapPin, Calendar, Globe, ArrowRight, Zap, Target, CheckCircle2, Loader2, ArrowLeft, Award, Briefcase, Clock, MessageCircle, BadgeCheck, ShieldCheck, Heart, AlertTriangle } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Review } from '../types';
import { calculateDistance, formatDistance } from '../utils/distance';
import VerificationBadges from '../components/VerificationBadges';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [emergencyBookingInProgress, setEmergencyBookingInProgress] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [isFavorite, setIsFavorite] = useState(false);
  const [specialist, setSpecialist] = useState<any>(null);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    const loadData = async () => {
      const specialists = await DB.getSpecialists();
      const found = specialists.find(s => s.id === id) || specialists[0];
      setSpecialist(found);
      setReviews(DB.getReviewsBySpecialist(found.id));
      if (currentUser) {
        setIsFavorite(currentUser.favorites?.includes(found.id) || false);
      }
    };
    loadData();
  }, [id, currentUser]);

  const handleBooking = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'user') {
      alert('Only regular users can book services. Workers and admins cannot hire services.');
      return;
    }
    
    setBookingInProgress(true);
    
    setTimeout(() => {
      DB.createBooking({
        specialistId: specialist.id,
        userId: currentUser.id,
        userLat: 19.0760,
        userLng: 72.8777,
        startTime: new Date().toISOString(),
        totalValue: specialist.hourlyRate
      });
      navigate('/booking');
    }, 1500);
  };

  const handleEmergencyBooking = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'user') {
      alert('Only regular users can book services. Workers and admins cannot hire services.');
      return;
    }
    
    setEmergencyBookingInProgress(true);
    
    setTimeout(() => {
      DB.createEmergencyBooking({
        specialistId: specialist.id,
        userId: currentUser.id,
        userLat: 19.0760,
        userLng: 72.8777,
        startTime: new Date().toISOString()
      }, specialist.hourlyRate);
      navigate('/booking');
    }, 1500);
  };

  const handleSubmitReview = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    DB.createReview({
      bookingId: 'DEMO',
      specialistId: specialist.id,
      userId: currentUser.id,
      rating: newReview.rating,
      comment: newReview.comment
    });
    
    setReviews(DB.getReviewsBySpecialist(specialist.id));
    setShowReviewForm(false);
    setNewReview({ rating: 5, comment: '' });
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const newFavorites = isFavorite
      ? (currentUser.favorites || []).filter(id => id !== specialist.id)
      : [...(currentUser.favorites || []), specialist.id];
    
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    setIsFavorite(!isFavorite);
  };

  const handleMessage = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Use specialist.id as fallback since specialists don't have userId set
    navigate(`/chat/${specialist.id}`);
  };

  const getAvailabilityColor = () => {
    switch(specialist.availability) {
      case 'available': return 'border-green-500 text-green-500';
      case 'busy': return 'border-red-500 text-red-500';
      case 'unavailable': return 'border-yellow-500 text-yellow-500';
    }
  };

  const getAvailabilityBg = () => {
    switch(specialist.availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'unavailable': return 'bg-yellow-500';
    }
  };

  if (!specialist) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-8 sm:pt-12">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile Header Card */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 ${getAvailabilityColor()}`}>
                  <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 ${getAvailabilityBg()} rounded-full text-xs font-bold text-white flex items-center gap-1`}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {specialist.availability === 'available' ? 'Available' :
                   specialist.availability === 'busy' ? 'Busy' : 'Unavailable'}
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{specialist.name}</h1>
                    <button onClick={toggleFavorite} className={`p-2 rounded-full transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-zinc-800 text-gray-400 hover:text-red-500'}`}>
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                  <p className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-3">{specialist.title}</p>
                  <VerificationBadges specialist={specialist} />
                </div>
                
                <p className="text-gray-400 leading-relaxed">{specialist.description}</p>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">{specialist.location}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">{specialist.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600/10 rounded-xl mx-auto mb-2">
                <Star className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-black">{specialist.rating}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Rating</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-600/10 rounded-xl mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-black">{specialist.projects}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Projects</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-600/10 rounded-xl mx-auto mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-black">{specialist.experience}y</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Experience</p>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-yellow-600/10 rounded-xl mx-auto mb-2">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-black">100%</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Success</p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Skills & Expertise
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialist.skills.map(skill => (
                <span key={skill} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-sm font-medium hover:border-blue-500 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Credentials
            </h3>
            <div className="space-y-3">
              {specialist.credentials.map(cred => (
                <div key={cred} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{cred}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                Reviews ({reviews.length})
              </h3>
              {currentUser && (
                <button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all"
                >
                  Write Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="mb-6 p-4 bg-zinc-800/50 rounded-2xl space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setNewReview(prev => ({ ...prev, rating: r }))}
                        className="p-2 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${r <= newReview.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Comment</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 min-h-[100px]"
                    placeholder="Share your experience..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSubmitReview} className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all">
                    Submit
                  </button>
                  <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-600 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(review => {
                const reviewer = DB.getUserById(review.userId);
                return (
                  <div key={review.id} className="p-4 bg-zinc-800/30 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                          {reviewer?.name.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{reviewer?.name || 'User'}</p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{review.comment}</p>
                  </div>
                );
              }) : (
                <p className="text-center text-gray-500 text-sm py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="text-center pb-6 border-b border-zinc-800">
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">Hourly Rate</p>
              <p className="text-5xl font-black">₹{specialist.hourlyRate}</p>
              <p className="text-xs text-gray-600 mt-1">per hour</p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleEmergencyBooking}
                disabled={emergencyBookingInProgress}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-500 hover:to-orange-500 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                {emergencyBookingInProgress ? (
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                ) : (
                  <AlertTriangle className="w-5 h-5 fill-white group-hover:scale-110 transition-transform relative z-10" />
                )} 
                <span className="relative z-10">{emergencyBookingInProgress ? 'BOOKING...' : 'EMERGENCY HIRE (+20%)'}</span>
              </button>
              
              <button 
                onClick={handleBooking}
                disabled={bookingInProgress || specialist.availability !== 'available'}
                className="w-full bg-blue-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-all"
              >
                {bookingInProgress ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                )} 
                {bookingInProgress ? 'BOOKING...' : specialist.availability === 'available' ? 'BOOK NOW' : 'UNAVAILABLE'}
              </button>
              
              <button 
                onClick={handleMessage}
                className="w-full border border-zinc-800 py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                MESSAGE
              </button>
            </div>

            <div className="pt-6 border-t border-zinc-800 space-y-3 text-sm">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Emergency Hire</span>
                </div>
                <p className="text-xs text-gray-400">Priority response with 20% surcharge. Worker will be dispatched immediately.</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Response Time</span>
                <span className="font-bold">~2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-bold text-green-500">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Languages</span>
                <span className="font-bold">English, Hindi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
