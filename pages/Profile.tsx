
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Star, MapPin, ArrowLeft, CheckCircle2, Loader2, Award, Briefcase, Clock, MessageCircle, Heart, Zap, Users, ThumbsUp, Calendar, Globe, Share2, BadgeCheck, Sparkles, TrendingUp, Bell, BellOff } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Review, User } from '../types';
import { calculateDistance, formatDistance } from '../utils/distance';
import VerificationBadges from '../components/VerificationBadges';

const ReviewItem: React.FC<{ review: Review; reviewer: User | undefined }> = ({ review, reviewer }) => {
  return (
    <div className="pb-5 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-sm font-bold text-white">
            {reviewer?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{reviewer?.name || 'User'}</p>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-[10px] text-gray-400">Verified Booking</span>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed pl-[52px]">{review.comment}</p>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [specialist, setSpecialist] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [reviewers, setReviewers] = useState<Record<string, User | undefined>>({});
  const [isWatching, setIsWatching] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const loadData = async () => {
      const specialists = await DB.getSpecialists();
      const found = specialists.find(s => s.id === id) || specialists[0];
      setSpecialist(found);
      // Subscribe to real-time updates for this specialist
      unsub = DB.onSpecialist(found.id, (updated) => setSpecialist(updated));
      const r = await DB.getReviewsBySpecialist(found.id);
      setReviews(r);
      // Pre-load reviewer data
      const reviewerMap: Record<string, User | undefined> = {};
      await Promise.all(r.map(async (rev) => {
        reviewerMap[rev.userId] = await DB.getUserById(rev.userId);
      }));
      setReviewers(reviewerMap);
        if (currentUser) {
          setIsFavorite(currentUser.favorites?.includes(found.id) || false);
          const watching = await DB.isWatchingAvailability(found.id, currentUser.id);
            setIsWatching(watching);
            if (watching) {
              // If worker already became available while user was away, notify immediately
              if (found.availability === 'available') {
                await DB.createNotification({
                  userId: currentUser.id,
                  type: 'availability',
                  title: `${found.name} is now available!`,
                  message: `${found.name} is now available for bookings. Tap to book now.`,
                  link: `/profile/${found.id}`,
                });
                await DB.unsubscribeAvailabilityNotify(found.id, currentUser.id);
                setIsWatching(false);
              } else {
                // Still busy — reattach the real-time watcher
                DB.startAvailabilityWatcher(found.id, currentUser.id);
              }
            }
        }
    };
    loadData();
    let geoCancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (!geoCancelled) setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => {}
    );
    return () => { geoCancelled = true; unsub?.(); };
  }, [id]);

  const handleBooking = () => {
    if (!currentUser) { navigate('/login'); return; }
    if (currentUser.role !== 'user') { alert('Only regular users can book services.'); return; }
    setBookingInProgress(true);
    setTimeout(() => {
      DB.createBooking({ specialistId: specialist.id, userId: currentUser.id, userLat: 19.0760, userLng: 72.8777, startTime: new Date().toISOString(), totalValue: specialist.hourlyRate });
      navigate('/booking');
    }, 1500);
  };

  const toggleFavorite = async () => {
    if (!currentUser) { navigate('/login'); return; }
    const newFavorites = isFavorite
      ? (currentUser.favorites || []).filter(fid => fid !== specialist.id)
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

  const handleToggleNotify = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setNotifyLoading(true);
    if (isWatching) {
      await DB.unsubscribeAvailabilityNotify(specialist.id, currentUser.id);
      setIsWatching(false);
    } else {
      await DB.subscribeAvailabilityNotify(specialist.id, currentUser.id);
      setIsWatching(true);
    }
    setNotifyLoading(false);
  };

  const getDistance = () => {
    if (!userLoc || !specialist) return null;
    return calculateDistance(userLoc.lat, userLoc.lng, specialist.lat, specialist.lng);
  };

  if (!specialist) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    </div>
  );

  const distance = getDistance();
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : specialist.rating;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
        {/* Hero Section */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-20 sm:pb-24">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to results
            </button>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative flex-shrink-0">
                  <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center ${
                    specialist.availability === 'available' ? 'bg-green-500' : specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                  } shadow-md`}>
                    <div className="w-[104px] h-[104px] sm:w-[120px] sm:h-[120px] rounded-full bg-white flex items-center justify-center">
                      <img src={specialist.avatar} alt={specialist.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover" />
                    </div>
                  </div>
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-md ${
                  specialist.availability === 'available' ? 'bg-green-500' : specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {specialist.availability === 'available' ? 'Online' : specialist.availability === 'busy' ? 'Busy' : 'Offline'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{specialist.name}</h1>
                      {specialist.verified && <BadgeCheck className="w-6 h-6 text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm font-medium text-gray-500">{specialist.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={toggleFavorite} className={`p-2.5 rounded-xl border transition-all ${isFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-300 hover:text-red-400 hover:border-red-200'}`}>
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
                    </button>
                    <button className="p-2.5 rounded-xl border border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-300 transition-all">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {specialist.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" /> {specialist.category}
                  </span>
                  {distance && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <Globe className="w-3.5 h-3.5 text-gray-400" /> {formatDistance(distance)} away
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <VerificationBadges specialist={specialist} />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Floating Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-gray-100">
            {[
              { icon: Star, label: 'Rating', value: avgRating, sub: `${reviews.length} reviews`, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                { icon: Briefcase, label: 'Projects', value: specialist.projects, sub: 'completed', color: 'text-teal-600', bg: 'bg-teal-50' },
              { icon: Clock, label: 'Experience', value: `${specialist.experience}y`, sub: 'in field', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: ThumbsUp, label: 'Success', value: '100%', sub: 'rate', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: TrendingUp, label: 'Response', value: specialist.totalRequests ? `${specialist.responseRate ?? 100}%` : 'New', sub: specialist.totalRequests ? 'response rate' : 'no data yet', color: 'text-orange-500', bg: 'bg-orange-50' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-4 sm:py-5">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 leading-tight">{stat.value}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex gap-1">
              {(['about', 'reviews'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'about' ? 'About' : `Reviews (${reviews.length})`}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <>
                {/* About Section */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">About</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{specialist.description}</p>
                  {specialist.tags && specialist.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {specialist.tags.map((tag: string) => (
                          <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills & Expertise */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Skills & Expertise</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {specialist.skills.map((skill: string) => (
                      <span key={skill} className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-150 rounded-xl text-sm text-gray-700 font-medium hover:shadow-sm transition-shadow">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Credentials & Certifications */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Credentials & Certifications</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialist.credentials.map((cred: string) => (
                      <div key={cred} className="flex items-center gap-3 p-3.5 bg-green-50/50 border border-green-100 rounded-xl">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{cred}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service Highlights */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Service Highlights</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon: Shield, title: 'Background Verified', desc: 'Identity and criminal background checked', active: specialist.backgroundChecked },
                      { icon: BadgeCheck, title: 'Document Verified', desc: 'Aadhaar, PAN & credentials verified', active: specialist.verified },
                      { icon: Clock, title: 'Fast Responder', desc: 'Typically responds within 2 hours', active: specialist.fastResponder },
                      { icon: Award, title: 'Top Rated', desc: 'Consistently high customer ratings', active: specialist.topRated },
                    ].map(item => (
                        <div key={item.title} className={`p-4 rounded-xl border ${item.active ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.active ? 'bg-green-100' : 'bg-gray-200'}`}>
                              <item.icon className={`w-4 h-4 ${item.active ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                  {/* Availability Info */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Availability & Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-400 mb-1">Languages</p>
                        <p className="text-sm font-semibold text-gray-900">English, Hindi</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-400 mb-1">Working Hours</p>
                        <p className="text-sm font-semibold text-gray-900">9 AM - 7 PM</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl text-center">
                        <p className="text-xs text-gray-400 mb-1">Service Area</p>
                        <p className="text-sm font-semibold text-gray-900">{specialist.location}</p>
                      </div>
                    </div>
                    {specialist.busyUntil && new Date(specialist.busyUntil) > new Date() && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-amber-700 mb-0.5">Currently Busy</p>
                            <p className="text-xs text-amber-600">
                              Available{' '}
                              {specialist.busyFrom
                                ? new Date(specialist.busyFrom).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : '—'}{' '}
                              {' → '}{' '}
                              {new Date(specialist.busyUntil).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                      </div>
                    )}
                  </div>
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Rating Summary */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900">{avgRating}</p>
                      <div className="flex items-center gap-0.5 mt-2 justify-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = reviews.filter(r => Math.round(r.rating) === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-3">{star}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Info notice */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Reviews can only be submitted after completing a booking with this professional. This ensures all reviews are from verified customers.</p>
                </div>

                {/* Review List */}
                <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
                  <div className="space-y-5">
                    {reviews.length > 0 ? reviews.map(review => (
                        <ReviewItem key={review.id} review={review} reviewer={reviewers[review.userId]} />
                      )) : (
                      <div className="text-center py-12">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Star className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No reviews yet</p>
                        <p className="text-gray-400 text-xs mt-1">Book this professional to leave the first review.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Pricing Card */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gray-900 p-6 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Starting from</p>
                    <p className="text-4xl font-bold text-white">₹{specialist.hourlyRate}</p>
                    <p className="text-xs text-gray-400 mt-0.5">per visit</p>
                  </div>

                  <div className="p-5 space-y-3">
                      <button onClick={handleBooking} disabled={bookingInProgress || specialist.availability !== 'available'}
                        className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={specialist.availability === 'available' && !bookingInProgress ? {
                          background: 'linear-gradient(135deg, #4169E1 0%, #2f54c8 100%)',
                          color: '#fff',
                          boxShadow: '0 4px 18px rgba(65,105,225,0.45)',
                        } : {
                          background: '#1f2937',
                          color: '#fff',
                        }}
                        onMouseEnter={e => { if (specialist.availability === 'available' && !bookingInProgress) { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(65,105,225,0.55)'; } }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; if (specialist.availability === 'available' && !bookingInProgress) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(65,105,225,0.45)'; }}
                      >
                        {bookingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                        {bookingInProgress ? 'Booking...' : specialist.availability === 'available' ? 'Book Now' : 'Currently Unavailable'}
                      </button>

                      <button onClick={handleMessage}
                        className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Send Message
                      </button>

                    {specialist.availability !== 'available' && currentUser?.role === 'user' && (
                      <button
                        onClick={handleToggleNotify}
                        disabled={notifyLoading}
                        className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
                          isWatching
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {notifyLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isWatching ? (
                          <BellOff className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                        {notifyLoading
                          ? 'Saving...'
                          : isWatching
                          ? 'Cancel Notification'
                          : 'Notify Me When Available'}
                      </button>
                    )}
                </div>
              </div>

                {/* Quick Info */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Quick Info</h4>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Response Time</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">~2 hours</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Completion Rate</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">100%</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Languages</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">EN, HI</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Hired</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{specialist.projects}+ times</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
