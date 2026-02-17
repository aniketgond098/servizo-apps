
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Shield, CheckCircle, Wrench, Paintbrush, Plug, Bot, Droplets, Ruler, FileCheck, UserCheck, ShieldCheck, MessageSquareWarning, Lock, Eye } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import HeroToolsAnimation from '../components/HeroToolsAnimation';

export default function Home() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
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

  const categories = [
    { name: 'Plumbing', icon: Droplets, count: '240+', color: 'bg-blue-50 text-blue-600' },
    { name: 'Aesthetics', icon: Paintbrush, count: '150+', color: 'bg-pink-50 text-pink-600' },
    { name: 'Mechanical', icon: Wrench, count: '310+', color: 'bg-orange-50 text-orange-600' },
    { name: 'Electrical', icon: Plug, count: '180+', color: 'bg-yellow-50 text-yellow-700' },
    { name: 'Architecture', icon: Ruler, count: '120+', color: 'bg-indigo-50 text-indigo-600' },
    { name: 'Automation', icon: Bot, count: '200+', color: 'bg-purple-50 text-purple-600' },
  ];

  const safetyFeatures = [
    {
      icon: FileCheck,
      title: 'Document Verified',
      description: 'Every service worker submits Aadhaar, PAN, and a CV. Our team manually reviews each application before approval.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: UserCheck,
      title: 'Admin-Approved Profiles',
      description: 'No one goes live without admin verification. We reject unqualified or suspicious applicants to protect you.',
      color: 'bg-green-50 text-green-600',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Reviews Only',
      description: 'Reviews can only be left after a completed booking. No fake reviews, no manipulation — just honest feedback.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: MessageSquareWarning,
      title: 'In-App Communication',
      description: 'Chat, voice, and video calls happen inside Servizo. No need to share personal numbers with strangers.',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'All transactions are handled through the platform. Your financial details stay protected at every step.',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      icon: Eye,
      title: 'Transparent Pricing',
      description: 'See rates upfront on every profile. No hidden charges, no surprise fees after the job is done.',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative bg-white pt-8 sm:pt-12 pb-16 sm:pb-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
            <span className="text-xs font-semibold text-[#1a73e8] uppercase tracking-wide">Trusted by 50,000+ users</span>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1a2b49] leading-[1.1] tracking-tight">
                    Find the perfect professional for{' '}
                    <span className="inline-flex items-center">
                      <span className="text-[#1a73e8]">any task.</span>
                      {/* Mobile-only inline animation right after "any task." */}
                        <span className="lg:hidden inline-block relative ml-2" style={{ width: 72, height: 72, verticalAlign: 'middle', overflow: 'visible', position: 'relative', top: 6 }}>
                        <HeroToolsAnimation variant="mobile" />
                      </span>
                    </span>
                  </h1>
                  <p className="text-gray-700 text-base sm:text-lg max-w-lg leading-relaxed">
                    Discover top-rated experts for plumbing, makeup, cleaning, and more in your neighborhood. Quality guaranteed.
                  </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch bg-white border border-gray-200 rounded-xl sm:rounded-full shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 sm:py-0 flex-1 border-b sm:border-b-0 sm:border-r border-gray-200">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 sm:py-0 flex-1 border-b sm:border-b-0 sm:border-r border-gray-200">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location"
                    className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                <button type="submit" className="px-6 py-3 sm:py-3.5 bg-[#1a2b49] text-white text-sm font-semibold sm:rounded-full hover:bg-[#0f1d35] transition-colors flex-shrink-0">
                  Search Now
                </button>
              </form>

              {/* Popular tags */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">Popular:</span>
                {['Plumbing', 'House Cleaning', 'Handyman'].map(tag => (
                  <Link key={tag} to={`/listing?q=${tag}`} className="text-gray-600 hover:text-[#1a73e8] transition-colors underline underline-offset-2">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

              {/* Right: Tool Animation — desktop/tablet only */}
                <div className="relative hidden lg:flex items-center justify-center h-[500px]">
                  <HeroToolsAnimation variant="desktop" />
                </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="bg-gray-50 py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b49] mb-2">Featured Categories</h2>
              <p className="text-gray-500 text-sm sm:text-base">Explore high-quality services by category</p>
            </div>
            <Link to="/listing" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-[#1a73e8] hover:underline">
              View All Categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.name}
                to={`/listing?filter=${cat.name}`}
                className="bg-white rounded-xl border border-gray-100 p-5 text-center hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                <div className={`w-14 h-14 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-[#1a2b49] mb-1">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.count} Pros</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b49] mb-3">Simple, Fast, and Secure</h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto mb-14">
            Get your project started in just three easy steps. We handle the hard part so you can focus on the results.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] border-t-2 border-dashed border-gray-200"></div>

            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-[#1a2b49] rounded-full flex items-center justify-center mb-5 shadow-lg relative z-10">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2b49] mb-2">1. Search for a service</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">Tell us what you need and where. We'll show you the best pros for the job.</p>
            </div>
            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-[#1a73e8] rounded-full flex items-center justify-center mb-5 shadow-lg relative z-10">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2b49] mb-2">2. Compare Quotes</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">Review profiles, ratings, and quotes. Message professionals directly through our platform.</p>
            </div>
            <div className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-[#1a2b49] rounded-full flex items-center justify-center mb-5 shadow-lg relative z-10">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2b49] mb-2">3. Book & Pay</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">Schedule your appointment and pay securely. Your satisfaction is our priority.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="bg-white py-16 sm:py-20 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full mb-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Your Safety Comes First</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b49] mb-3">How Servizo Keeps You Safe</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
              We go beyond just connecting you with professionals. Every layer of Servizo is built to ensure trust, transparency, and accountability.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {safetyFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1a2b49] mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-gray-50 py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2b49]">Ready to get started?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Join thousands of satisfied customers. Find and book trusted professionals in minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/listing" className="px-8 py-3.5 bg-[#1a2b49] text-white rounded-lg text-sm font-semibold hover:bg-[#0f1d35] transition-colors inline-flex items-center justify-center gap-2">
                Browse Specialists <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/signup" className="px-8 py-3.5 border border-[#1a2b49] text-[#1a2b49] rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                Sign Up Free
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
