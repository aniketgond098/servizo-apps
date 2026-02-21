
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, Star, ChevronRight, Heart, Calendar, TrendingUp, CheckCircle2, MessageSquare, Download, Mail, FileText, X, Loader2 } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Booking, Specialist, Review, User } from '../types';
import { downloadBillAsPDF, emailBill } from '../utils/generateBill';

interface BillState {
  booking: Booking;
  specialist: Specialist;
  user: User;
}

export default function UserDashboard() {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<Specialist[]>([]);
  const [favorites, setFavorites] = useState<Specialist[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [billState, setBillState] = useState<BillState | null>(null);
  const [billLoading, setBillLoading] = useState<string | null>(null); // bookingId being loaded

  useEffect(() => {
    if (!user || user.role !== 'user') { navigate('/login'); return; }
    const loadData = async () => {
      const [allBookings] = await Promise.all([
        DB.getBookings().then(bs => bs.filter(b => b.userId === user.id)),
      ]);
      setBookings(allBookings);
      const favoriteIds = user.favorites || [];
      const allSpecialists = await DB.getSpecialists();
      setSpecialists(allSpecialists);
      setFavorites(allSpecialists.filter(s => favoriteIds.includes(s.id)));
      const lastBooking = allBookings[0];
      if (lastBooking) {
        const specialist = allSpecialists.find(s => s.id === lastBooking.specialistId);
        if (specialist) setRecommendations(allSpecialists.filter(s => s.category === specialist.category && s.id !== specialist.id));
      } else {
      setRecommendations(allSpecialists.slice(0, 3));
        }
        const allReviews = await DB.getReviews();
        setReviews(allReviews.filter(r => r.userId === user.id));
    };
    loadData();
  }, [navigate]);

  const openBill = async (booking: Booking) => {
    setBillLoading(booking.id);
    try {
      const [freshBooking, specialist, userProfile] = await Promise.all([
        DB.getBookingById(booking.id),
        DB.getSpecialistById(booking.specialistId),
        DB.getUserById(booking.userId),
      ]);
      if (!freshBooking || !specialist || !userProfile) {
        alert('Could not load bill data. Please try again.');
        return;
      }
      setBillState({ booking: freshBooking, specialist, user: userProfile });
    } finally {
      setBillLoading(null);
    }
  };

  if (!user) return null;

  const activeBookings = bookings.filter(b => b.status === 'active');
  const pastBookings = bookings.filter(b => b.status !== 'active');

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">Welcome back, {user.name.split(' ')[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your bookings and find new services</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-gray-400">Total Bookings</p>
              <p className="text-xl font-bold text-[#000000]">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Active Bookings */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Active Bookings</h3>
              {activeBookings.length > 0 ? activeBookings.map(b => {
                const sp = specialists.find(s => s.id === b.specialistId);
                return (
                  <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-[#4169E1]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#000000]">{sp?.name}</h4>
                        <span className="text-xs text-[#4169E1] font-medium">{sp?.category}</span>
                      </div>
                    </div>
                    <Link to="/booking" className="px-5 py-2 bg-[#000000] text-white rounded-lg text-xs font-semibold hover:bg-[#1a1a1a] transition-colors">
                      View Details
                    </Link>
                  </div>
                );
              }) : (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-gray-400">No active bookings</p>
                </div>
              )}
            </section>

            {/* Past Bookings */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Booking History</h3>
                <Link to="/booking-history" className="text-xs text-[#4169E1] font-semibold hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                  {pastBookings.slice(0, 5).map(b => {
                      const sp = specialists.find(s => s.id === b.specialistId);
                      const hasReviewed = reviews.some(r => r.bookingId === b.id);
                      const isPaid = b.status === 'completed' && b.paymentStatus === 'paid';
                      return (
                        <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-[#000000] text-sm">{sp?.name}</h4>
                            <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()} · <span className={b.status === 'completed' ? 'text-green-600' : 'text-red-500'}>{b.status}</span></p>
                          </div>
                          <div className="flex items-center gap-2">
                              {isPaid && (
                                <button
                                  onClick={() => openBill(b)}
                                  disabled={billLoading === b.id}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                                >
                                  {billLoading === b.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <FileText className="w-3.5 h-3.5" />}
                                  Bill
                                </button>
                              )}
                            {b.status === 'completed' && !hasReviewed && (
                              <Link to={`/review/${b.id}`} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5" /> Review
                              </Link>
                            )}
                            {b.status === 'completed' && hasReviewed && (
                              <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
                              </span>
                            )}
                            <span className="font-bold text-[#000000]">₹{b.totalValue}</span>
                          </div>
                        </div>
                    );
                  })}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            {favorites.length > 0 && (
              <section className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <h3 className="text-sm font-semibold text-[#000000]">Favorites ({favorites.length})</h3>
                </div>
                <div className="space-y-3">
                  {favorites.map(sp => (
                      <Link key={sp.id} to={`/profile/${sp.id}`} className="flex items-center gap-3 group">
                        <img src={sp.avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#000000] truncate">{sp.name}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-400">{sp.rating}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4169E1] flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              
              <section className="bg-white border border-gray-100 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#000000] mb-4">Recommended For You</h3>
                <div className="space-y-3">
                  {recommendations.map(sp => (
                    <Link key={sp.id} to={`/profile/${sp.id}`} className="flex items-center gap-3 group">
                      <img src={sp.avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#000000] truncate">{sp.name}</h4>
                      <span className="text-xs text-gray-400">{sp.category}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4169E1] flex-shrink-0" />
                  </Link>
                ))}
              </div>
              <Link to="/listing" className="block text-center text-xs text-[#4169E1] font-semibold mt-4 pt-4 border-t border-gray-100 hover:underline">
                View All Specialists
              </Link>
            </section>
          </aside>
        </div>
      </div>

      {/* E-Bill Modal */}
      {billState && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-[#000000] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">E-Bill</h3>
                  <p className="text-xs text-gray-400">{billState.booking.id}</p>
                </div>
              </div>
              <button onClick={() => setBillState(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Customer</span>
                  <span className="text-sm font-semibold">{billState.user.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Service Provider</span>
                  <span className="text-sm font-semibold">{billState.specialist.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Category</span>
                  <span className="text-sm font-semibold">{billState.specialist.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-semibold">{billState.booking.paidAt ? new Date(billState.booking.paidAt).toLocaleDateString('en-IN') : new Date(billState.booking.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Base Charge</span>
                  <span className="text-sm font-semibold">₹{billState.booking.totalValue.toLocaleString('en-IN')}</span>
                </div>
                {(billState.booking.extraCharges || []).map(c => (
                  <div key={c.id} className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{c.description}</span>
                    <span className="text-sm font-semibold text-amber-600">+₹{c.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2">
                  <span className="text-base font-bold">Total Paid</span>
                  <span className="text-lg font-bold text-[#4169E1]">₹{(billState.booking.finalTotal || billState.booking.totalValue).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => downloadBillAsPDF(billState)}
                  className="py-3 bg-[#000000] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={() => emailBill(billState)}
                  className="py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
