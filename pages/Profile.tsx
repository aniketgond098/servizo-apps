
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Star, MapPin, ArrowLeft, CheckCircle2, Loader2, Award, Briefcase, Clock, MessageCircle, Heart, AlertTriangle, Zap } from 'lucide-react';
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
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'user') { alert('Only regular users can book services.'); return; }
    setBookingInProgress(true);
    setTimeout(() => {
      DB.createBooking({ specialistId: specialist.id, userId: currentUser.id, userLat: 19.0760, userLng: 72.8777, startTime: new Date().toISOString(), totalValue: specialist.hourlyRate });
      navigate('/booking');
    }, 1500);
  };

  const handleEmergencyBooking = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'user') { alert('Only regular users can book services.'); return; }
    setEmergencyBookingInProgress(true);
    setTimeout(() => {
      DB.createEmergencyBooking({ specialistId: specialist.id, userId: currentUser.id, userLat: 19.0760, userLng: 72.8777, startTime: new Date().toISOString() }, specialist.hourlyRate);
      navigate('/booking');
    }, 1500);
  };

  const handleSubmitReview = () => {
    if (!currentUser) { navigate('/login'); return; }
    DB.createReview({ bookingId: 'DEMO', specialistId: specialist.id, userId: currentUser.id, rating: newReview.rating, comment: newReview.comment });
    setReviews(DB.getReviewsBySpecialist(specialist.id));
    setShowReviewForm(false);
    setNewReview({ rating: 5, comment: '' });
  };

  const toggleFavorite = async () => {
    if (!currentUser) { navigate('/login'); return; }
    const newFavorites = isFavorite
      ? (currentUser.favorites || []).filter(id => id !== specialist.id)
      : [...(currentUser.favorites || []), specialist.id];
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    setIsFavorite(!isFavorite);
  };

  const handleMessage = () => {
    if (!currentUser) { navigate('/login'); return; }
    navigate(`/chat/${specialist.id}`);
  };

  if (!specialist) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" /></div>;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a2b49] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Header */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="relative flex-shrink-0">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-3 ${
                    specialist.availability === 'available' ? 'border-green-500' : specialist.availability === 'busy' ? 'border-red-400' : 'border-yellow-400'
                  }`}>
                    <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-1.5 -right-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${
                    specialist.availability === 'available' ? 'bg-green-500' : specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {specialist.availability === 'available' ? 'Available' : specialist.availability === 'busy' ? 'Busy' : 'Unavailable'}
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2b49]">{specialist.name}</h1>
                      <p className="text-sm font-medium text-[#1a73e8] mt-0.5">{specialist.title}</p>
                    </div>
                    <button onClick={toggleFavorite} className={`p-2.5 rounded-full border transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-300 hover:text-red-400'}`}>
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>
                  <VerificationBadges specialist={specialist} />
                  <p className="text-sm text-gray-500 leading-relaxed">{specialist.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-[#1a73e8]" /> {specialist.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <Briefcase className="w-3.5 h-3.5 text-[#1a73e8]" /> {specialist.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Star, label: 'Rating', value: specialist.rating, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                { icon: CheckCircle2, label: 'Projects', value: specialist.projects, color: 'text-green-600', bg: 'bg-green-50' },
                { icon: Clock, label: 'Experience', value: `${specialist.experience}y`, color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: Award, label: 'Success', value: '100%', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-xl font-bold text-[#1a2b49]">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#1a2b49] mb-4">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {specialist.skills.map((skill: string) => (
                  <span key={skill} className="px-3.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600 font-medium">{skill}</span>
                ))}
              </div>
            </div>

            {/* Credentials */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#1a2b49] mb-4">Credentials</h3>
              <div className="space-y-2.5">
                {specialist.credentials.map((cred: string) => (
                  <div key={cred} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{cred}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1a2b49]">Reviews ({reviews.length})</h3>
                {currentUser && (
                  <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-4 py-2 bg-[#1a2b49] text-white rounded-lg text-xs font-semibold hover:bg-[#0f1d35] transition-colors">
                    Write Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-5 p-4 bg-gray-50 rounded-xl space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button key={r} onClick={() => setNewReview(prev => ({ ...prev, rating: r }))} className="p-1 hover:scale-110 transition-transform">
                          <Star className={`w-6 h-6 ${r <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-2">Comment</label>
                    <textarea value={newReview.comment} onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#1a73e8] min-h-[100px]"
                      placeholder="Share your experience..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSubmitReview} className="px-4 py-2 bg-[#1a2b49] text-white rounded-lg text-xs font-semibold">Submit</button>
                    <button onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => {
                  const reviewer = DB.getUserById(review.userId);
                  return (
                    <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a2b49] flex items-center justify-center text-sm font-medium text-white">{reviewer?.name.charAt(0) || 'U'}</div>
                          <div>
                            <p className="text-sm font-semibold text-[#1a2b49]">{reviewer?.name || 'User'}</p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{review.comment}</p>
                    </div>
                  );
                }) : (
                  <p className="text-center text-gray-400 text-sm py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-white border border-gray-100 rounded-xl p-6 space-y-5">
              <div className="text-center pb-5 border-b border-gray-100">
                <p className="text-sm text-gray-400 mb-1">Hourly Rate</p>
                <p className="text-4xl font-bold text-[#1a2b49]">₹{specialist.hourlyRate}</p>
                <p className="text-xs text-gray-400 mt-0.5">per hour</p>
              </div>

              <div className="space-y-3">
                <button onClick={handleEmergencyBooking} disabled={emergencyBookingInProgress}
                  className="w-full bg-red-500 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {emergencyBookingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {emergencyBookingInProgress ? 'Booking...' : 'Emergency Hire (+20%)'}
                </button>
                <button onClick={handleBooking} disabled={bookingInProgress || specialist.availability !== 'available'}
                  className="w-full bg-[#1a2b49] text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0f1d35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {bookingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {bookingInProgress ? 'Booking...' : specialist.availability === 'available' ? 'Book Now' : 'Currently Unavailable'}
                </button>
                <button onClick={handleMessage}
                  className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Send Message
                </button>
              </div>

              <div className="pt-5 border-t border-gray-100 space-y-3 text-sm">
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">Emergency Hire</span>
                  </div>
                  <p className="text-xs text-gray-500">Priority response with 20% surcharge. Worker will be dispatched immediately.</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Response Time</span>
                  <span className="font-semibold text-[#1a2b49]">~2 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Completion Rate</span>
                  <span className="font-semibold text-green-600">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Languages</span>
                  <span className="font-semibold text-[#1a2b49]">English, Hindi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
