import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, X, Bookmark, MapPin, ChevronRight } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist } from '../types';

export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState<string[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const currentUser = AuthService.getCurrentUser();

  const loadFavorites = async () => {
    if (!currentUser) return;
    const freshUser = await DB.getUserById(currentUser.id);
    if (freshUser) AuthService.updateSession(freshUser);
    const favoriteIds = freshUser?.favorites || currentUser.favorites || [];
    const specialists = await DB.getSpecialists();
    setFavorites(specialists.filter(s => favoriteIds.includes(s.id)));
  };

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    loadFavorites();
  }, []);

  const removeFavorite = async (specialistId: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUser) return;
    setRemoving(specialistId);
    setLoading(prev => [...prev, specialistId]);
    const newFavorites = (currentUser.favorites || []).filter(id => id !== specialistId);
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    await loadFavorites();
    setLoading(prev => prev.filter(id => id !== specialistId));
    setRemoving(null);
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#000000]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#000000]">Saved Specialists</h1>
            {favorites.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{favorites.length} specialist{favorites.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Content */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((specialist, idx) => (
              <Link
                key={specialist.id}
                to={`/profile/${specialist.id}`}
                className={`group bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 hover:shadow-md transition-all relative ${
                  removing === specialist.id ? 'opacity-50 scale-95' : ''
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Remove button */}
                <button
                  onClick={(e) => removeFavorite(specialist.id, e)}
                  disabled={loading.includes(specialist.id)}
                  className="absolute top-3 right-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all z-10 opacity-0 group-hover:opacity-100"
                  title="Remove from saved"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>

                  <div className="flex items-center gap-3.5 mb-4">
                    {/* Avatar */}
                    <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0 ${
                      specialist.availability === 'available' ? 'bg-green-500' :
                      specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      <div className="w-[54px] h-[54px] rounded-full bg-white flex items-center justify-center">
                        <img src={specialist.avatar} alt={specialist.name} className="w-[48px] h-[48px] rounded-full object-cover" />
                      </div>
                    </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#000000] text-sm truncate">{specialist.name}</h3>
                    <p className="text-xs text-[#4169E1] font-medium">{specialist.category}</p>
                    {specialist.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-400 truncate">{specialist.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-[#000000]">{specialist.rating}</span>
                    {specialist.reviews !== undefined && (
                      <span className="text-xs text-gray-400">({specialist.reviews})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#000000]">{'\u20B9'}{specialist.hourlyRate}<span className="text-xs font-normal text-gray-400">/hr</span></span>
                    <div className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#000000] group-hover:text-white group-hover:border-[#000000] transition-all">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-[#000000] mb-1">No saved specialists</h3>
            <p className="text-xs text-gray-400 mb-5 text-center max-w-xs">
              Save your favorite specialists to quickly find and book them later
            </p>
            <Link to="/listing" className="px-5 py-2.5 bg-[#000000] text-white rounded-lg text-xs font-semibold hover:bg-[#1a1a1a] transition-colors inline-block">
              Browse Specialists
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
