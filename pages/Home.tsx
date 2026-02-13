
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Star, Shield, Zap, Award, ArrowLeft, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';

export default function Home() {
  const [query, setQuery] = useState("");
  const [specialistCount, setSpecialistCount] = useState(12);
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    DB.getSpecialists().then(specialists => setSpecialistCount(specialists.length));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/listing?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/listing');
    }
  };

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>
        
        {/* Floating Service Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] animate-orbit-1">
            <div className="w-16 h-16 bg-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🔧</span>
            </div>
          </div>
          <div className="absolute top-[20%] right-[10%] animate-orbit-2">
            <div className="w-20 h-20 bg-purple-600/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">⚡</span>
            </div>
          </div>
          <div className="absolute bottom-[15%] left-[15%] animate-orbit-3">
            <div className="w-14 h-14 bg-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-xl">🎨</span>
            </div>
          </div>
          <div className="absolute top-[50%] right-[5%] animate-orbit-4">
            <div className="w-18 h-18 bg-yellow-600/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🔨</span>
            </div>
          </div>
          <div className="absolute bottom-[25%] right-[20%] animate-orbit-5">
            <div className="w-16 h-16 bg-red-600/10 backdrop-blur-sm border border-red-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">💧</span>
            </div>
          </div>
          <div className="absolute top-[35%] left-[8%] animate-orbit-6">
            <div className="w-12 h-12 bg-indigo-600/10 backdrop-blur-sm border border-indigo-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-xl">📐</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10 py-12 sm:py-20">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 lg:space-y-12">
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] sm:text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Exquisite Craftsmanship Only
             </div>
             
             <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-none italic px-4">
                ELEVATED<br/>
                <span className="text-blue-500 font-normal serif">Lifestyles</span>
             </h1>

             <form onSubmit={handleSearch} className="max-w-2xl w-full relative group px-4">
                <Search className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Plumbers, Artisans, Names..."
                    className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl py-4 sm:py-5 lg:py-6 pl-12 sm:pl-14 lg:pl-16 pr-20 sm:pr-28 text-base sm:text-lg lg:text-xl focus:outline-none focus:border-blue-500/50 transition-all shadow-2xl"
                />
                <button type="submit" className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 bg-blue-600 rounded-full font-bold text-xs sm:text-sm hover:bg-blue-500 transition-colors">
                    DISCOVER
                </button>
             </form>

             {!user && (
               <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4">
                  <Link to="/signup" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-blue-600 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-blue-600/30 text-center">Sign up</Link>
                  <Link to="/login" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 border border-zinc-800 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest hover:bg-zinc-900 transition-all text-center">Login</Link>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* Featured Sectors - Redesigned */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter mb-3">Why Choose <span className="text-blue-500">Servizo</span></h2>
          <p className="text-gray-500 text-sm sm:text-base">Premium service marketplace for discerning clients</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative bg-gradient-to-br from-blue-600/5 to-blue-600/0 border border-zinc-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="text-blue-500 w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Verified Artisans</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Every specialist undergoes rigorous background checks, skill verification, and insurance validation before joining our platform.</p>
                  <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:gap-3 transition-all">
                    Join as Artisan <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
            </div>
            <div className="relative bg-gradient-to-br from-purple-600/5 to-purple-600/0 border border-zinc-800 p-8 rounded-3xl hover:border-purple-500/50 transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="text-purple-500 w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Real-Time Tracking</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Monitor your service professional's location in real-time with live routing, ETA updates, and instant communication channels.</p>
                  <Link to="/listing" className="inline-flex items-center gap-2 text-sm font-bold text-purple-500 hover:gap-3 transition-all">
                    Browse Services <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
            </div>
            <div className="relative bg-gradient-to-br from-green-600/5 to-green-600/0 border border-zinc-800 p-8 rounded-3xl hover:border-green-500/50 transition-all group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all"></div>
                <div className="relative">
                  <div className="w-14 h-14 bg-green-600/10 border border-green-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Award className="text-green-500 w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Quality Guaranteed</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Photo evidence system, detailed analytics, and comprehensive review system ensure accountability and excellence in every job.</p>
                  <Link to="/booking-history" className="inline-flex items-center gap-2 text-sm font-bold text-green-500 hover:gap-3 transition-all">
                    View Analytics <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
            </div>
        </div>
      </section>

      {/* Stats Section - Redesigned */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-zinc-900/50 to-zinc-900/20 border border-zinc-800 rounded-3xl p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-5xl font-black text-white mb-2">{specialistCount}+</div>
              <div className="text-sm text-gray-400 font-medium">Elite Specialists</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/10 border border-green-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-5xl font-black text-white mb-2">98%</div>
              <div className="text-sm text-gray-400 font-medium">Success Rate</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/10 border border-purple-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-5xl font-black text-white mb-2">24/7</div>
              <div className="text-sm text-gray-400 font-medium">Support Available</div>
            </div>
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600/10 border border-yellow-500/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-5xl font-black text-white mb-2">5K+</div>
              <div className="text-sm text-gray-400 font-medium">Projects Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Redesigned */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">How It <span className="text-blue-500">Works</span></h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto">Three simple steps to connect with verified professionals</p>
        </div>
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all group">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform">1</div>
                </div>
                <div className="pt-8">
                  <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-black mb-3">Search & Filter</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Browse verified specialists by category, location, rating, and availability. Use advanced filters to find the perfect match.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all group">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform">2</div>
                </div>
                <div className="pt-8">
                  <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-black mb-3">Book Instantly</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Review profiles, credentials, and past work. Book regular or emergency services with instant confirmation and real-time tracking.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all group">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-600/50 group-hover:scale-110 transition-transform">3</div>
                </div>
                <div className="pt-8">
                  <div className="w-12 h-12 bg-green-600/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-black mb-3">Track & Review</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">Monitor progress with photo evidence, live location tracking, and direct messaging. Rate your experience when complete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories - Redesigned */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">Service <span className="text-blue-500">Categories</span></h2>
          <p className="text-gray-400 text-base">Expert professionals across all major service sectors</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {name: 'Architecture', icon: '📐', color: 'blue'},
            {name: 'Plumbing', icon: '💧', color: 'cyan'},
            {name: 'Mechanical', icon: '🔧', color: 'orange'},
            {name: 'Aesthetics', icon: '🎨', color: 'pink'},
            {name: 'Electrical', icon: '⚡', color: 'yellow'},
            {name: 'Automation', icon: '🤖', color: 'purple'}
          ].map(cat => (
            <Link key={cat.name} to={`/listing?filter=${cat.name}`} className="group relative bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 text-center hover:border-blue-500/50 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-transparent transition-all"></div>
              <div className="relative">
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div className="text-sm font-bold mb-1">{cat.name}</div>
                <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">Explore →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA - Redesigned */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Join 5,000+ Happy Customers
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter">Ready to Experience<br/>Premium Service?</h2>
            <p className="text-blue-100 text-base max-w-2xl mx-auto">Connect with verified professionals in minutes. Real-time tracking, quality guaranteed, and 24/7 support.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/listing" className="group px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2">
                Browse Specialists
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/signup" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
