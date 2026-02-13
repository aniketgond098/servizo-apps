
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Clock, Shield, Star, MapPin, Search, ChevronRight, ArrowLeft, Heart } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Booking, Specialist } from '../types';

export default function UserDashboard() {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recommendations, setRecommendations] = useState<Specialist[]>([]);
  const [favorites, setFavorites] = useState<Specialist[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'user') {
      navigate('/login');
      return;
    }
    const loadData = async () => {
      const allBookings = (await DB.getBookings()).filter(b => b.userId === user.id);
      setBookings(allBookings);

      const favoriteIds = user.favorites || [];
      const allSpecialists = await DB.getSpecialists();
      setSpecialists(allSpecialists);
      const favoriteSpecialists = allSpecialists.filter(s => favoriteIds.includes(s.id));
      setFavorites(favoriteSpecialists);

      const lastBooking = allBookings[0];
      if (lastBooking) {
        const specialist = allSpecialists.find(s => s.id === lastBooking.specialistId);
        if (specialist) {
          setRecommendations(allSpecialists.filter(s => s.category === specialist.category && s.id !== specialist.id));
        }
      } else {
        setRecommendations(allSpecialists.slice(0, 3));
      }
    };
    loadData();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 space-y-8 sm:space-y-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
      
      <header className="py-8 sm:py-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-900">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic">USER<span className="text-blue-500">COMMAND</span></h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Welcome Back, Agent {user.name.split(' ')[0]}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 sm:px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
            <span className="block text-[8px] text-gray-500 uppercase font-bold tracking-widest">Total Hires</span>
            <span className="text-lg sm:text-xl font-black">{bookings.length}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-8 sm:space-y-12">
          {/* Active Deployments */}
          <section className="space-y-4 sm:space-y-6">
            <h3 className="text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-gray-500">Active Operational Protocols</h3>
            {bookings.filter(b => b.status === 'active').length > 0 ? (
              bookings.filter(b => b.status === 'active').map(b => {
                const sp = specialists.find(s => s.id === b.specialistId);
                return (
                  <div key={b.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Activity className="text-white w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg sm:text-xl font-bold truncate">{sp?.name}</h4>
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{sp?.category} Dispatch</span>
                      </div>
                    </div>
                    <Link to="/booking" className="w-full md:w-auto text-center px-6 sm:px-8 py-3 bg-blue-600/10 border border-blue-500/20 text-blue-500 font-bold rounded-full text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                      Monitor Feed
                    </Link>
                  </div>
                )
              })
            ) : (
              <div className="p-8 sm:p-12 border-2 border-dashed border-zinc-900 rounded-3xl sm:rounded-[32px] text-center">
                <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">No Active Vectors</p>
              </div>
            )}
          </section>

          {/* Previous History */}
          <section className="space-y-4 sm:space-y-6">
            <h3 className="text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase text-gray-500">Historical Registry</h3>
            <div className="space-y-4">
              {bookings.filter(b => b.status !== 'active').map(b => {
                const sp = specialists.find(s => s.id === b.specialistId);
                return (
                  <div key={b.id} className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="min-w-0 w-full sm:w-auto">
                      <h4 className="font-bold truncate">{sp?.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(b.createdAt).toLocaleDateString()} • {b.status}</p>
                    </div>
                    <span className="font-black">₹{b.totalValue}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-red-500">Favorites ({favorites.length})</h3>
              </div>
              <div className="space-y-4">
                {favorites.map(sp => (
                  <Link key={sp.id} to={`/profile/${sp.id}`} className="flex items-center gap-3 sm:gap-4 group">
                    <img src={sp.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate">{sp.name}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-[10px] text-gray-500">{sp.rating}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
          
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 space-y-6 sm:space-y-8">
            <h3 className="text-xs font-bold tracking-[0.3em] uppercase text-blue-500">Personalized Insights</h3>
            <div className="space-y-6">
              {recommendations.map(sp => (
                <Link key={sp.id} to={`/profile/${sp.id}`} className="flex items-center gap-3 sm:gap-4 group">
                  <img src={sp.avatar} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate">{sp.name}</h4>
                    <span className="text-[8px] text-gray-500 uppercase tracking-widest">{sp.category} Match</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
            <Link to="/listing" className="block text-center text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest border-t border-zinc-800 pt-6">
              View All Specialists
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
