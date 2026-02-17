
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, User as UserIcon, LogOut, Home as HomeIcon, Grid3X3, MessageCircle, Heart, ChevronDown } from 'lucide-react';
import { ServizoIcon } from './components/Logo';
import Home from './pages/Home';
import Listing from './pages/Listing';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import VerifyPhone from './pages/VerifyPhone';
import UserDashboard from './pages/UserDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminPanel from './pages/AdminPanel';
import DocumentUpload from './pages/DocumentUpload';
import Chat from './pages/Chat';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import CreateProfile from './pages/CreateProfile';
import BookingHistory from './pages/BookingHistory';
import ReviewPage from './pages/ReviewPage';
import IncomingCall from './components/IncomingCall';
import NotificationToast from './components/NotificationToast';
import { AuthService } from './services/auth';
import { User } from './types';
import { useTheme } from './contexts/ThemeContext';
import { DB } from './services/db';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      DB.getUnreadNotifications(currentUser.id).then(count => setNotificationCount(count));
    }
  }, [location]);

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    navigate('/');
  };

  const handleQuickAdminLogin = () => {
    const adminUser: User = {
      id: 'ADMIN-001',
      email: 'admin@servizo.in',
      name: 'System Administrator',
      role: 'admin',
      avatar: 'https://i.pravatar.cc/150?u=admin',
      createdAt: new Date().toISOString(),
      favorites: [],
      theme: 'dark'
    };
    localStorage.setItem('prolux_session', JSON.stringify(adminUser));
    setUser(adminUser);
    navigate('/admin', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
<nav className={`fixed top-0 w-full z-[1000] transition-all duration-200 bg-white ${
          scrolled ? 'shadow-md' : 'border-b border-gray-100'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <ServizoIcon size={32} />
              <span className="text-lg font-bold tracking-tight text-[#1a2b49]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Servizo</span>
            </Link>

          {/* Center: Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive('/') ? 'text-[#1a2b49] font-semibold' : 'text-gray-500 hover:text-[#1a2b49]'
            }`}>
              Browse Categories
            </Link>
            <button
              onClick={() => {
                if (location.pathname === '/') {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/');
                  setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
              }}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors text-gray-500 hover:text-[#1a2b49]"
            >
              How It Works
            </button>
            <Link to="/listing" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              false ? 'text-[#1a2b49] font-semibold' : 'text-gray-500 hover:text-[#1a2b49]'
            }`}>
              Top Pros
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive('/admin') ? 'text-red-600 font-semibold' : 'text-red-500 hover:text-red-600'
              }`}>
                Admin
              </Link>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button onClick={handleQuickAdminLogin} className="hidden md:block text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded transition-colors">
                  Demo
                </button>
                <Link to="/signup" className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-[#1a2b49] border border-[#1a2b49] rounded-lg hover:bg-gray-50 transition-colors">
                  Become a Pro
                </Link>
                <Link to="/login" className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#1a2b49] transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="hidden md:inline-flex px-5 py-2.5 bg-[#1a2b49] text-white rounded-lg text-sm font-semibold hover:bg-[#0f1d35] transition-colors">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/notifications" className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500" title="Notifications">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notificationCount}</span>
                  )}
                </Link>
                <Link to="/favorites" className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500" title="Favorites">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/messages" className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500" title="Messages">
                  <MessageCircle className="w-5 h-5" />
                </Link>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <Link 
                  to={user.role === 'worker' ? '/worker-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:shadow-md transition-all"
                >
                  <Menu className="w-4 h-4 text-gray-500" />
                  <div className="w-7 h-7 rounded-full bg-[#1a2b49] flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{user.name.charAt(0)}</span>
                  </div>
                </Link>
                <button onClick={handleLogout} className="p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
<div className="fixed inset-0 z-[1100] bg-black/30" onClick={() => setMobileMenuOpen(false)} />
            <div className="md:hidden fixed top-0 left-0 w-72 h-full z-[1200] bg-white shadow-2xl animate-fadeIn overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <ServizoIcon size={28} />
                  <span className="text-lg font-bold text-[#1a2b49]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Servizo</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <HomeIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Home</span>
              </Link>
              <Link to="/listing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Search className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Browse Services</span>
              </Link>

              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors">
                  <Grid3X3 className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Admin Panel</span>
                </Link>
              )}

              {user && (
                <>
                  <div className="h-px bg-gray-100 my-2"></div>
                  <Link 
                    to={user.role === 'worker' ? '/worker-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Dashboard</span>
                  </Link>
                  <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Notifications</span>
                    {notificationCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">{notificationCount}</span>
                    )}
                  </Link>
                  <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Saved</span>
                  </Link>
                  <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Messages</span>
                  </Link>
                </>
              )}

              <div className="h-px bg-gray-100 my-2"></div>

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a2b49] flex items-center justify-center">
                      <span className="text-white font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors w-full text-left">
                    <LogOut className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-medium text-red-600">Log out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 bg-[#1a2b49] text-white rounded-xl text-sm font-semibold hover:bg-[#0f1d35] transition-colors">
                    Sign up
                  </Link>
                </div>
              )}
              </div>
            </div>
          </>
          )}
          </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around h-14">
          <Link to="/" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isActive('/') ? 'text-[#1a2b49]' : 'text-gray-400'}`}>
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/listing" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isActive('/listing') ? 'text-[#1a2b49]' : 'text-gray-400'}`}>
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </Link>
          {user ? (
            <>
              <Link to="/favorites" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isActive('/favorites') ? 'text-[#1a2b49]' : 'text-gray-400'}`}>
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium">Saved</span>
              </Link>
              <Link to="/messages" className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${isActive('/messages') ? 'text-[#1a2b49]' : 'text-gray-400'}`}>
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] font-medium">Inbox</span>
              </Link>
              <Link 
                to={user.role === 'worker' ? '/worker-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} 
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  isActive('/dashboard') || isActive('/worker-dashboard') || isActive('/admin') ? 'text-[#1a2b49]' : 'text-gray-400'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium">Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isActive('/login') ? 'text-[#1a2b49]' : 'text-gray-400'}`}>
                <UserIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium">Log in</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    setCurrentUser(AuthService.getCurrentUser());
  }, [location]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="pt-16 pb-16 md:pb-0 min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing" element={<Listing />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-phone" element={<VerifyPhone />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/admin" element={<AdminPanel currentUser={currentUser} />} />
          <Route path="/document-upload" element={<DocumentUpload currentUser={currentUser} />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/create-profile" element={<CreateProfile />} />
            <Route path="/booking-history" element={<BookingHistory />} />
            <Route path="/review/:bookingId" element={<ReviewPage />} />
        </Routes>
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden md:block border-t border-gray-200 bg-[#1a2b49] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-8">
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <ServizoIcon size={32} />
                  <span className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Servizo</span>
                </div>
              <p className="text-sm text-gray-300 leading-relaxed">Connecting people with the best local professionals for all their home and personal needs.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">About Us</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">How It Works</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Careers</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Press</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Help Center</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Safety</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Servizo Pro</p>
                <p className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors">Community</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-gray-300 mb-3">Get the latest tips and service discounts.</p>
              <div className="flex">
                <input type="email" placeholder="Email address" className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/40" />
                <button className="px-4 py-2 bg-[#1a73e8] text-white text-sm font-semibold rounded-r-lg hover:bg-blue-600 transition-colors">Join</button>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">&copy; 2026 Servizo Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
        <IncomingCall />
        <NotificationToast />
        </div>
    );
  }

export default function App() {
    return (
      <Router>
        <AppContent />
      </Router>
    );
  }
