
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Search, Bell, Globe, Shield, Menu, X, Star, Zap, User as UserIcon, LogOut, Settings, LayoutDashboard, Sun, Moon, Home as HomeIcon, List, MessageCircle, Heart, HelpCircle } from 'lucide-react';
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
import { AuthService } from './services/auth';
import { User } from './types';
import { Logo, LoadingSpinner } from './components/Logo';
import { useTheme } from './contexts/ThemeContext';
import { AnimatedBackground } from './components/AnimatedBackground';
import { DB } from './services/db';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const [navSearch, setNavSearch] = useState("");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    setMobileMenuOpen(false);
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    
    // Load notification count
    if (currentUser) {
      DB.getUnreadNotifications(currentUser.id).then(count => setNotificationCount(count));
    }
    
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
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

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/listing?q=${encodeURIComponent(navSearch)}`);
      setNavSearch("");
    }
  };

  return (
    <>
      {loading && <LoadingSpinner />}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-black/90 backdrop-blur-md py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-lg sm:text-xl font-bold tracking-tighter">SERVI<span className="text-blue-500">ZO</span></span>
            </Link>
          
            <div className="hidden md:flex items-center gap-6">
              <Link to="/listing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">DIRECTORY</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-bold text-red-500 hover:text-red-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> ADMIN
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className="p-2 hover:bg-zinc-900 rounded-full text-gray-400 hover:text-blue-500 transition-all">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!user && (
              <button onClick={handleQuickAdminLogin} className="hidden md:block px-3 py-1.5 bg-red-600/20 border border-red-500/40 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-600/30 transition-all">
                ADMIN
              </button>
            )}
            {!user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold tracking-widest text-gray-400 hover:text-white">LOGIN</Link>
                <Link to="/signup" className="px-6 py-2 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-500 transition-all">SIGNUP</Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/notifications" className="p-2 hover:bg-zinc-900 rounded-full text-gray-400 hover:text-blue-500 transition-all relative" title="Notifications">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notificationCount}</span>
                  )}
                </Link>
                <Link to="/favorites" className="p-2 hover:bg-zinc-900 rounded-full text-gray-400 hover:text-red-500 transition-all" title="Favorites">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/messages" className="p-2 hover:bg-zinc-900 rounded-full text-gray-400 hover:text-green-500 transition-all relative" title="Messages">
                  <MessageCircle className="w-5 h-5" />
                  {DB.getUnreadCount(user.id) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{DB.getUnreadCount(user.id)}</span>
                  )}
                </Link>
                <Link 
                  to={user.role === 'worker' ? '/worker-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} 
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full hover:border-blue-500 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">{user.name.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 hover:bg-zinc-900 rounded-full text-gray-500 hover:text-red-500 transition-all">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg border-t border-zinc-800 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-2">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500/40 transition-all">
                  <HomeIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-bold">Home</span>
                </Link>
                <Link to="/listing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-blue-500/40 transition-all">
                  <List className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-bold">Browse</span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold text-red-500">ADMIN PANEL</span>
                  </Link>
                )}
                
                {user && (
                  <>
                    <Link 
                      to={user.role === 'worker' ? '/worker-dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all"
                    >
                      <LayoutDashboard className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-bold">Dashboard</span>
                    </Link>
                    <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all">
                      <Bell className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-bold">Notifications</span>
                      {notificationCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{notificationCount}</span>
                      )}
                    </Link>
                    <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-bold">Favorites</span>
                    </Link>
                    <Link to="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-bold">Messages</span>
                      {DB.getUnreadCount(user.id) > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">{DB.getUnreadCount(user.id)}</span>
                      )}
                    </Link>
                  </>
                )}
              </div>

              {/* User Section */}
              {user ? (
                <div className="pt-4 mt-4 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">{user.role}</p>
                    </div>
                  </div>
                  <button onClick={toggleTheme} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all w-full">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    <span className="text-sm font-bold">Toggle Theme</span>
                  </button>
                  <button className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all w-full">
                    <HelpCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-bold">Help & Support</span>
                  </button>
                  <button onClick={handleLogout} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-red-900/20 transition-all w-full text-red-500">
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-bold">LOGOUT</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-zinc-800 space-y-3">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 border border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-900 transition-all">
                    LOGIN
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-6 py-3 bg-blue-600 rounded-xl text-sm font-bold hover:bg-blue-500 transition-all">
                    SIGN UP
                  </Link>
                  <button onClick={toggleTheme} className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900 transition-all w-full">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    <span className="text-sm font-bold">Toggle Theme</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
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
    <div className="min-h-screen bg-[#050505] text-white relative">
      <AnimatedBackground />
      <Navbar />
      <main className="pt-24 min-h-[calc(100vh-100px)]">
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
        </Routes>
      </main>
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
