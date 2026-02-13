
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Filter, ChevronRight, Star, ArrowUpRight, MapPin, Loader2, X, ArrowLeft, List, Map as MapIcon, Heart, DollarSign, TrendingUp, Award } from 'lucide-react';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, AvailabilityStatus, SortOption, PriceRange } from '../types';
import { parseSearchIntent } from '../services/ai';
import { MapView } from '../components/MapView';
import { calculateDistance, formatDistance } from '../utils/distance';
import { AuthService } from '../services/auth';
import VerificationBadges from '../components/VerificationBadges';

export default function Listing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('filter') || 'All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000 });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cardLoading, setCardLoading] = useState<string[]>([]);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    performSearch(searchParams.get('q') || "", searchParams.get('filter') || "All");
    
    if (currentUser) {
      setFavorites(currentUser.favorites || []);
    }
    
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, [searchParams, availabilityFilter, sortBy, priceRange]);

  const performSearch = async (query: string, category: string) => {
    setLoading(true);
    let all = await DB.getSpecialists();
    
    // Filter only approved workers
    const approvedSpecialists = [];
    for (const s of all) {
      if (!s.userId) {
        approvedSpecialists.push(s);
      } else {
        const user = await DB.getUserById(s.userId);
        if (!user || user.verificationStatus === 'approved') {
          approvedSpecialists.push(s);
        }
      }
    }
    all = approvedSpecialists;
    
    // 1. Filter by category
    if (category !== 'All') {
      all = all.filter(s => s.category === category);
    }

    // 2. Filter by availability
    if (availabilityFilter !== 'all') {
      all = all.filter(s => s.availability === availabilityFilter);
    }

    // 3. Filter by price range
    all = all.filter(s => s.hourlyRate >= priceRange.min && s.hourlyRate <= priceRange.max);

    // 4. Filter by name if explicitly a name match
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      all = all.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) || 
        s.title.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery)
      );
    }

    // 5. Sort
    if (sortBy === 'rating') {
      all.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price-low') {
      all.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (sortBy === 'price-high') {
      all.sort((a, b) => b.hourlyRate - a.hourlyRate);
    } else if (sortBy === 'experience') {
      all.sort((a, b) => b.experience - a.experience);
    } else if (sortBy === 'distance' && userLoc) {
      all.sort((a, b) => {
        const distA = calculateDistance(userLoc.lat, userLoc.lng, a.lat, a.lng);
        const distB = calculateDistance(userLoc.lat, userLoc.lng, b.lat, b.lng);
        return distA - distB;
      });
    }

    setSpecialists(all);
    setLoading(false);
  };

  const toggleFavorite = async (specialistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setCardLoading(prev => [...prev, specialistId]);
    
    const newFavorites = favorites.includes(specialistId)
      ? favorites.filter(id => id !== specialistId)
      : [...favorites, specialistId];
    
    setFavorites(newFavorites);
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    
    setTimeout(() => {
      setCardLoading(prev => prev.filter(id => id !== specialistId));
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, filter: activeCategory });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setAvailabilityFilter("all");
    setSortBy('rating');
    setPriceRange({ min: 0, max: 10000 });
    setSearchParams({});
  };

  const getAvailabilityColor = (status: AvailabilityStatus) => {
    switch(status) {
      case 'available': return 'border-green-500';
      case 'busy': return 'border-red-500';
      case 'unavailable': return 'border-yellow-500';
    }
  };

  const getDistance = (lat: number, lng: number) => {
    if (!userLoc) return null;
    return calculateDistance(userLoc.lat, userLoc.lng, lat, lng);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
      
      <header className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 pb-6 sm:pb-8 border-b border-zinc-900">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-3 sm:space-y-4">
             <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                {specialists.length} Specialists in Vector Range
             </div>
             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter">
               Search <span className="text-blue-500">Curators</span>
             </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex-1 lg:w-96 relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${loading ? 'text-blue-500 animate-spin' : 'text-gray-500'}`} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or specific task..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 sm:py-4 pl-11 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </form>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isFilterOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-zinc-600'}`}
            >
              <Filter className="w-4 h-4" /> 
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {isFilterOpen && (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 w-full">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Category Protocol</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Plumbing', 'Mechanical', 'Electrical', 'Automation', 'Aesthetics', 'Architecture'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setSearchParams({ q: searchQuery, filter: cat });
                      }}
                      className={`px-3 sm:px-4 lg:px-6 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-800 text-gray-500 hover:border-zinc-600'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <div className="pt-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Availability Status</span>
                  <div className="flex flex-wrap gap-2">
                    {[{val: 'all', label: 'All'}, {val: 'available', label: 'Available'}, {val: 'busy', label: 'Busy'}, {val: 'unavailable', label: 'Not Available'}].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setAvailabilityFilter(opt.val)}
                        className={`px-3 sm:px-4 lg:px-6 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${availabilityFilter === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-800 text-gray-500 hover:border-zinc-600'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Sort By</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {val: 'rating', label: 'Rating', icon: Star},
                      {val: 'price-low', label: 'Price: Low', icon: DollarSign},
                      {val: 'price-high', label: 'Price: High', icon: TrendingUp},
                      {val: 'distance', label: 'Distance', icon: MapPin},
                      {val: 'experience', label: 'Experience', icon: Award}
                    ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setSortBy(opt.val as SortOption)}
                        className={`px-3 sm:px-4 lg:px-6 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${sortBy === opt.val ? 'bg-blue-600 border-blue-600 text-white' : 'border-zinc-800 text-gray-500 hover:border-zinc-600'}`}
                      >
                        <opt.icon className="w-3 h-3" /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Price Range (₹/hr)</span>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="number" 
                      value={priceRange.min} 
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Min"
                    />
                    <span className="text-gray-600">-</span>
                    <input 
                      type="number" 
                      value={priceRange.max} 
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={clearFilters}
                className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap"
              >
                <X className="w-3 h-3" /> RESET ALL
              </button>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Processing Intent...</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="mt-8 sm:mt-12">
          <MapView 
            specialists={specialists} 
            userLoc={userLoc} 
            getAvailabilityColor={getAvailabilityColor}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-12">
          {specialists.length > 0 ? specialists.map(specialist => {
            const distance = getDistance(specialist.lat, specialist.lng);
            const isFavorite = favorites.includes(specialist.id);
            const isLoading = cardLoading.includes(specialist.id);
            
            return (
            <Link key={specialist.id} to={`/profile/${specialist.id}`} className="bg-zinc-900/30 border border-zinc-800 p-5 sm:p-6 lg:p-8 rounded-3xl sm:rounded-[32px] group hover:border-blue-500/40 transition-all flex flex-col h-full relative">
              <button
                onClick={(e) => toggleFavorite(specialist.id, e)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${isFavorite ? 'bg-red-500 text-white' : 'bg-zinc-800 text-gray-400 hover:text-red-500'}`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />}
              </button>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3 sm:gap-4 items-center">
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-4 ${getAvailabilityColor(specialist.availability)}`}>
                      <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                      specialist.availability === 'available' ? 'bg-green-500' :
                      specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-base sm:text-lg leading-none mb-1 truncate">{specialist.name}</h4>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{specialist.category}</span>
                  </div>
                </div>
                {distance && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase bg-black/40 px-2 py-1 rounded flex-shrink-0">
                    <MapPin className="w-3 h-3" /> {formatDistance(distance)}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-6 sm:mb-8 leading-relaxed flex-1">
                {specialist.description}
              </p>

              <div className="mb-4">
                <VerificationBadges specialist={specialist} size="sm" />
              </div>

              <div className="flex justify-between items-end pt-4 sm:pt-6 border-t border-zinc-800 mt-auto">
                 <div>
                    <span className="block text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-1">Standard Rate</span>
                    <span className="text-lg sm:text-xl font-black">₹{specialist.hourlyRate}</span>
                 </div>
                 <div className="text-right space-y-1">
                    <div className="flex items-center gap-1 text-sm font-bold justify-end">
                      <Star className="w-3 h-3 fill-blue-500 text-blue-500" /> {specialist.rating}
                    </div>
                    <span className="block text-[8px] text-gray-600 font-bold uppercase tracking-widest">{specialist.projects} Projects</span>
                 </div>
              </div>
            </Link>
          )}) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">No Specialists Found in Current Vector</p>
              <button onClick={clearFilters} className="text-blue-500 font-black tracking-widest text-[10px] uppercase">Expand Search Range</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
