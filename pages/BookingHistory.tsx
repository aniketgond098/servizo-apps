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
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    if (!currentUser) return;
    
    const allBookings = await DB.getBookings();
    const userBookings = allBookings.filter(b => b.userId === currentUser.id);
    setBookings(userBookings);

    const specs = await DB.getSpecialists();
    setSpecialists(specs);

    // Calculate analytics
    const completed = userBookings.filter(b => b.status === 'completed');
    const cancelled = userBookings.filter(b => b.status === 'cancelled');
    const totalSpent = completed.reduce((sum, b) => sum + b.totalValue, 0);
    
    const reviews = await DB.getReviews();
    const userReviews = reviews.filter(r => r.userId === currentUser.id);
    const avgRating = userReviews.length > 0 
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length 
      : 0;

    const categoryCount: Record<string, number> = {};
    completed.forEach(b => {
      const spec = specs.find(s => s.id === b.specialistId);
      if (spec) {
        categoryCount[spec.category] = (categoryCount[spec.category] || 0) + 1;
      }
    });
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'Architecture'
    ) as any;

    setAnalytics({
      totalBookings: userBookings.length,
      totalSpent,
      averageRating: avgRating,
      favoriteCategory,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length,
      monthlySpending: []
    });
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const getSpecialist = (id: string) => specialists.find(s => s.id === id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="py-12">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter italic mb-2">BOOKING<span className="text-blue-500">HISTORY</span></h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Complete Transaction Archive</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-3" />
            <p className="text-xl sm:text-2xl font-black">{analytics.totalBookings}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Total Bookings</p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-3" />
            <p className="text-xl sm:text-2xl font-black">₹{analytics.totalSpent}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Total Spent</p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mb-3" />
            <p className="text-xl sm:text-2xl font-black">{analytics.averageRating.toFixed(1)}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Avg Rating</p>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 sm:p-6">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-3" />
            <p className="text-xl sm:text-2xl font-black">{analytics.favoriteCategory}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold">Top Category</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
        <Filter className="w-4 h-4 text-gray-500" />
        <button 
          onClick={() => setFilter('all')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase ${filter === 'all' ? 'bg-blue-600' : 'bg-zinc-900 text-gray-500'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('completed')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase ${filter === 'completed' ? 'bg-green-600' : 'bg-zinc-900 text-gray-500'}`}
        >
          Completed
        </button>
        <button 
          onClick={() => setFilter('cancelled')}
          className={`px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase ${filter === 'cancelled' ? 'bg-red-600' : 'bg-zinc-900 text-gray-500'}`}
        >
          Cancelled
        </button>
        <button className="ml-auto px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] sm:text-xs font-bold uppercase flex items-center gap-2">
          <Download className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map(booking => {
          const spec = getSpecialist(booking.specialistId);
          if (!spec) return null;

          return (
            <div key={booking.id} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-4 sm:p-6 hover:border-zinc-700 transition-all">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <img src={spec.avatar} alt={spec.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{spec.name}</h3>
                    <p className="text-xs text-blue-500 uppercase">{spec.category}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-lg sm:text-xl font-black">₹{booking.totalValue}</p>
                  <span className={`inline-block text-[10px] sm:text-xs font-bold uppercase px-2 py-1 rounded ${
                    booking.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                <span className="truncate">ID: {booking.id}</span>
                <span>•</span>
                <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                {booking.isEmergency && (
                  <>
                    <span>•</span>
                    <span className="text-red-500 font-bold">EMERGENCY</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm uppercase tracking-widest font-bold">No bookings found</p>
        </div>
      )}
    </div>
  );
}
