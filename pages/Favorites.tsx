import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Star, MapPin, X } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist } from '../types';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState<string[]>([]);
  const currentUser = AuthService.getCurrentUser();

  const loadFavorites = async () => {
    if (!currentUser) return;
    // Fetch fresh user data to get latest favorites
    const freshUser = await DB.getUserById(currentUser.id);
    if (freshUser) {
      AuthService.updateSession(freshUser);
    }
    const favoriteIds = freshUser?.favorites || currentUser.favorites || [];
    const specialists = await DB.getSpecialists();
    const favoriteSpecialists = specialists.filter(s => favoriteIds.includes(s.id));
    setFavorites(favoriteSpecialists);
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, []);

  const removeFavorite = async (specialistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    
    setLoading(prev => [...prev, specialistId]);
    
    const newFavorites = (currentUser.favorites || []).filter(id => id !== specialistId);
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    
    await loadFavorites();
    setLoading(prev => prev.filter(id => id !== specialistId));
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <div className="pt-8 sm:pt-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">My <span className="text-red-500">Favorites</span></h1>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(specialist => (
              <Link key={specialist.id} to={`/profile/${specialist.id}`} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl hover:border-red-500/40 transition-all group relative">
                <button
                  onClick={(e) => removeFavorite(specialist.id, e)}
                  disabled={loading.includes(specialist.id)}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500 rounded-full transition-all z-10 group/btn"
                  title="Remove from favorites"
                >
                  <X className="w-4 h-4 text-red-500 group-hover/btn:text-white" />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500">
                    <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{specialist.name}</h3>
                    <p className="text-xs text-blue-500 uppercase tracking-widest font-bold">{specialist.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-bold">{specialist.rating}</span>
                  </div>
                  <span className="text-lg font-black">₹{specialist.hourlyRate}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No favorites yet</p>
            <Link to="/listing" className="inline-block mt-4 px-6 py-3 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-500 transition-all">
              Browse Specialists
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
