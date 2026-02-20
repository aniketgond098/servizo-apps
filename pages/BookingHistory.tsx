import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Star, Filter, Download } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Booking, Specialist, BookingAnalytics } from '../types';

export default function BookingHistory() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    if (!currentUser) return;
    const allBookings = await DB.getBookings();
    const userBookings = allBookings.filter(b => b.userId === currentUser.id);
    setBookings(userBookings);
    const specs = await DB.getSpecialists();
    setSpecialists(specs);
    const completed = userBookings.filter(b => b.status === 'completed');
    const cancelled = userBookings.filter(b => b.status === 'cancelled');
    const totalSpent = completed.reduce((sum, b) => sum + b.totalValue, 0);
    const reviews = await DB.getReviews();
    const userReviews = reviews.filter(r => r.userId === currentUser.id);
    const avgRating = userReviews.length > 0 ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length : 0;
    const categoryCount: Record<string, number> = {};
    completed.forEach(b => { const spec = specs.find(s => s.id === b.specialistId); if (spec) categoryCount[spec.category] = (categoryCount[spec.category] || 0) + 1; });
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, 'Architecture') as any;
    setAnalytics({ totalBookings: userBookings.length, totalSpent, averageRating: avgRating, favoriteCategory, completedBookings: completed.length, cancelledBookings: cancelled.length, monthlySpending: [] });
  };

  const filteredBookings = bookings.filter(b => filter === 'all' ? true : b.status === filter);
  const getSpecialist = (id: string) => specialists.find(s => s.id === id);

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">Booking History</h1>
          <p className="text-sm text-gray-500 mt-1">Your complete transaction archive</p>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Calendar, label: 'Total Bookings', value: analytics.totalBookings, color: 'text-[#4169E1]', bg: 'bg-blue-50' },
              { icon: DollarSign, label: 'Total Spent', value: `₹${analytics.totalSpent}`, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Star, label: 'Avg Rating', value: analytics.averageRating.toFixed(1), color: 'text-yellow-500', bg: 'bg-yellow-50' },
              { icon: TrendingUp, label: 'Top Category', value: analytics.favoriteCategory, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4">
                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                <p className="text-xl font-bold text-[#000000]">{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === f ? (f === 'completed' ? 'bg-green-600 text-white' : f === 'cancelled' ? 'bg-red-500 text-white' : 'bg-[#000000] text-white') : 'bg-white border border-gray-200 text-gray-500'}`}>
              {f}
            </button>
          ))}
          <button className="ml-auto px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Bookings */}
        <div className="space-y-3">
          {filteredBookings.map(booking => {
            const spec = getSpecialist(booking.specialistId);
            if (!spec) return null;
            return (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                      <img src={spec.avatar} alt={spec.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
                    <div>
                      <h3 className="font-semibold text-[#000000] text-sm">{spec.name}</h3>
                      <p className="text-xs text-[#4169E1] font-medium">{spec.category}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-[#000000]">₹{booking.totalValue}</p>
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                      booking.status === 'completed' ? 'bg-green-50 text-green-600' : booking.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
                    }`}>{booking.status}</span>
                  </div>
                </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span>{booking.id}</span><span>·</span><span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>
              </div>
            );
          })}
        </div>
        {filteredBookings.length === 0 && (
          <div className="text-center py-12"><p className="text-sm text-gray-400">No bookings found</p></div>
        )}
      </div>
    </div>
  );
}
