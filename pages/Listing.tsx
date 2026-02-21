
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, Loader2, X, List, Map as MapIcon, Heart, DollarSign, TrendingUp, Award, ChevronDown, Sparkles, Zap } from 'lucide-react';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, AvailabilityStatus, SortOption, PriceRange } from '../types';
import { parseSearchIntent, getAISuggestions } from '../services/ai';
const MapView = React.lazy(() => import('../components/MapView').then(m => ({ default: m.MapView })));
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
  const [sortBy, setSortBy] = useState<SortOption>('response');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000 });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cardLoading, setCardLoading] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiTip, setAiTip] = useState('');
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    performSearch(searchParams.get('q') || "", searchParams.get('filter') || "All");
    
    if (currentUser) {
      setFavorites(currentUser.favorites || []);
    }
    
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => { if (!cancelled) setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => {}
    );
    return () => { cancelled = true; };
  }, [searchParams, availabilityFilter, sortBy, priceRange]);

  const performSearch = async (query: string, category: string) => {
    setLoading(true);
    // Fetch specialists and users in parallel (two requests total, not N+1)
    const [all_raw, users] = await Promise.all([DB.getSpecialists(), DB.getUsers()]);
    const userMap = new Map(users.map(u => [u.id, u]));

    // Filter only approved workers — no extra network calls
    let all = all_raw.filter(s => {
      if (!s.userId) return true;
      const user = userMap.get(s.userId);
      return !user || user.verificationStatus === 'approved';
    });
    
    if (category !== 'All') {
      all = all.filter(s => s.category === category);
    }
    if (availabilityFilter !== 'all') {
      all = all.filter(s => s.availability === availabilityFilter);
    }
    all = all.filter(s => s.hourlyRate >= priceRange.min && s.hourlyRate <= priceRange.max);
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      all = all.filter(s => 
        s.name.toLowerCase().includes(lowerQuery) || 
        s.title.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery)
      );
    }
    if (sortBy === 'rating') all.sort((a, b) => b.rating - a.rating);
      else if (sortBy === 'price-low') all.sort((a, b) => a.hourlyRate - b.hourlyRate);
      else if (sortBy === 'price-high') all.sort((a, b) => b.hourlyRate - a.hourlyRate);
      else if (sortBy === 'experience') all.sort((a, b) => b.experience - a.experience);
      else if (sortBy === 'response') all.sort((a, b) => (b.responseRate ?? 100) - (a.responseRate ?? 100));
      else if (sortBy === 'distance' && userLoc) {
        all.sort((a, b) => calculateDistance(userLoc.lat, userLoc.lng, a.lat, a.lng) - calculateDistance(userLoc.lat, userLoc.lng, b.lat, b.lng));
      }

    setSpecialists(all);
    setLoading(false);
  };

  const toggleFavorite = async (specialistId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) { navigate('/login'); return; }
    setCardLoading(prev => [...prev, specialistId]);
    const newFavorites = favorites.includes(specialistId)
      ? favorites.filter(id => id !== specialistId)
      : [...favorites, specialistId];
    setFavorites(newFavorites);
    const updatedUser = { ...currentUser, favorites: newFavorites };
    await DB.updateUser(updatedUser);
    AuthService.updateSession(updatedUser);
    setTimeout(() => setCardLoading(prev => prev.filter(id => id !== specialistId)), 300);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setAiTip('');
    if (searchQuery.trim()) {
      setAiLoading(true);
      const intent = await parseSearchIntent(searchQuery);
      setAiLoading(false);
      if (intent.urgency === 'high') {
        setAiTip('Sounds urgent! We\'ve prioritized available specialists for you.');
      }
      const newParams: any = { q: intent.query };
      if (intent.category) newParams.filter = intent.category;
      else newParams.filter = activeCategory;
      setSearchParams(newParams);
      if (intent.category) setActiveCategory(intent.category);
    } else {
      setSearchParams({ q: searchQuery, filter: activeCategory });
    }
  };

  const handleQueryChange = async (val: string) => {
    setSearchQuery(val);
    setAiTip('');
    if (val.trim().length >= 3) {
      const suggestions = await getAISuggestions(val);
      setAiSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("All");
    setAvailabilityFilter("all");
    setSortBy('response');
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

  const categories = ['All', 'Plumbing', 'Mechanical', 'Electrical', 'Automation', 'Aesthetics', 'Architecture'];

  const visibleSpecialists = (!showAllWorkers && userLoc)
    ? specialists.filter(s => calculateDistance(userLoc.lat, userLoc.lng, s.lat, s.lng) <= 5)
    : specialists;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">Find Specialists</h1>
                <p className="text-sm text-gray-500 mt-1">{visibleSpecialists.length} professionals available</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#000000]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-[#000000]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => aiSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Describe what you need in plain English..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4169E1]/20 focus:border-[#4169E1] transition-all"
              />
              {/* AI Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#4169E1]" />
                    <span className="text-[10px] font-semibold text-[#4169E1] uppercase tracking-wide">AI Suggestions</span>
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <button key={i} type="button" onMouseDown={() => { setSearchQuery(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#4169E1] transition-colors flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-gray-300" /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#4169E1] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-70">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">AI Search</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${isFilterOpen ? 'bg-[#000000] border-[#000000] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <Filter className="w-4 h-4" /> 
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>

          {/* AI Tip Banner */}
          {aiTip && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl animate-fadeIn">
              <Zap className="w-4 h-4 text-[#4169E1] flex-shrink-0" />
              <p className="text-sm text-[#4169E1] font-medium">{aiTip}</p>
              <button onClick={() => setAiTip('')} className="ml-auto text-blue-300 hover:text-blue-500"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchParams({ q: searchQuery, filter: cat });
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-[#000000] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {isFilterOpen && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Availability</label>
                  <div className="flex flex-wrap gap-2">
                    {[{val: 'all', label: 'All'}, {val: 'available', label: 'Available'}, {val: 'busy', label: 'Busy'}, {val: 'unavailable', label: 'Unavailable'}].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setAvailabilityFilter(opt.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${availabilityFilter === opt.val ? 'bg-[#4169E1] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Sort By</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {val: 'response', label: 'Response Rate'},
                        {val: 'rating', label: 'Rating'},
                        {val: 'price-low', label: 'Price: Low'},
                        {val: 'price-high', label: 'Price: High'},
                        {val: 'distance', label: 'Distance'},
                        {val: 'experience', label: 'Experience'}
                      ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setSortBy(opt.val as SortOption)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === opt.val ? 'bg-[#4169E1] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Price Range (₹/visit)</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="number" 
                      value={priceRange.min} 
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4169E1]"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                      type="number" 
                      value={priceRange.max} 
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4169E1]"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <button onClick={clearFilters} className="text-xs font-semibold text-[#4169E1] hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Reset All Filters
                </button>
              </div>
            </div>
          )}
          {/* Distance Filter Banner */}
          {userLoc && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl mt-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4169E1] flex-shrink-0" />
                <p className="text-sm text-[#4169E1] font-medium">
                  {showAllWorkers ? 'Showing all workers regardless of location' : 'Showing workers within 5 km of you'}
                </p>
              </div>
              <button
                onClick={() => setShowAllWorkers(prev => !prev)}
                className="text-xs font-semibold text-[#4169E1] underline hover:text-blue-800 whitespace-nowrap ml-4"
              >
                {showAllWorkers ? 'Show nearby only' : 'Show all workers'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#4169E1] animate-spin" />
            <p className="text-sm text-gray-500">Searching specialists...</p>
          </div>
        ) : viewMode === 'map' ? (
          <React.Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#4169E1] animate-spin" /></div>}>
              <MapView 
                specialists={visibleSpecialists} 
                userLoc={userLoc} 
                getAvailabilityColor={getAvailabilityColor}
              />
          </React.Suspense>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleSpecialists.length > 0 ? visibleSpecialists.map(specialist => {
              const distance = getDistance(specialist.lat, specialist.lng);
              const isFavorite = favorites.includes(specialist.id);
              const isLoading = cardLoading.includes(specialist.id);
              
              return (
              <Link key={specialist.id} to={`/profile/${specialist.id}`} className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:shadow-lg hover:border-gray-200 transition-all flex flex-col h-full relative">
                {/* Card Header with Avatar */}
                <div className="p-5">
                  <button
                    onClick={(e) => toggleFavorite(specialist.id, e)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-all z-10 ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-300 hover:text-red-400'}`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />}
                  </button>
                  
                    <div className="flex gap-3 items-center mb-4">
                      <div className="relative flex-shrink-0">
                        <div className={`w-[60px] h-[60px] rounded-full flex items-center justify-center ${
                          specialist.availability === 'available' ? 'bg-green-500' :
                          specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          <div className="w-[54px] h-[54px] rounded-full bg-white flex items-center justify-center">
                            <img src={specialist.avatar} alt={specialist.name} className="w-[48px] h-[48px] rounded-full object-cover" />
                          </div>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          specialist.availability === 'available' ? 'bg-green-500' :
                          specialist.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#000000] truncate">{specialist.name}</h4>
                      <span className="text-xs font-medium text-[#4169E1]">{specialist.category}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                    {specialist.description}
                  </p>

                    <div className="mb-3">
                      <VerificationBadges specialist={specialist} size="sm" />
                    </div>

                    {specialist.totalRequests != null && specialist.totalRequests > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (specialist.responseRate ?? 100) >= 80 ? 'bg-green-50 text-green-700' :
                          (specialist.responseRate ?? 100) >= 50 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-600'
                        }`}>
                          <TrendingUp className="w-2.5 h-2.5" />
                          {specialist.responseRate ?? 100}% response rate
                        </div>
                      </div>
                    )}

                  {distance && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <MapPin className="w-3 h-3" /> {formatDistance(distance)}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100 mt-auto bg-gray-50/50">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">From</span>
                    <p className="text-lg font-bold text-[#000000]">₹{specialist.hourlyRate}<span className="text-xs font-normal text-gray-400">/visit</span></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-[#000000]">{specialist.rating}</span>
                    <span className="text-xs text-gray-400">({specialist.projects})</span>
                  </div>
                </div>
              </Link>
            )}) : (
              <div className="col-span-full py-20 text-center space-y-3">
                  <p className="text-gray-500 text-sm">
                    {!showAllWorkers && userLoc ? 'No specialists found within 5 km.' : 'No specialists found matching your criteria.'}
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    {!showAllWorkers && userLoc && (
                      <button onClick={() => setShowAllWorkers(true)} className="text-[#4169E1] font-semibold text-sm hover:underline">Show all workers</button>
                    )}
                    <button onClick={clearFilters} className="text-[#4169E1] font-semibold text-sm hover:underline">Clear all filters</button>
                  </div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
