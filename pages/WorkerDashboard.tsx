
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, Booking, Message } from '../types';
import { Shield, Save, Star, Activity, MapPin, Zap, ArrowLeft, TrendingUp, DollarSign, MessageCircle } from 'lucide-react';
import { PhotoGallery } from '../components/PhotoGallery';

export default function WorkerDashboard() {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<Specialist>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharingLocation, setSharingLocation] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'worker') {
      navigate('/login', { replace: true });
      return;
    }
    
    if (!user.verificationStatus || user.verificationStatus === 'rejected') {
      navigate('/document-upload', { replace: true });
      return;
    }
    
    if (user.verificationStatus === 'pending') {
      navigate('/document-upload', { replace: true });
      return;
    }
    
    const loadData = async () => {
      const specialists = await DB.getSpecialists();
      let sp = specialists.find(s => s.userId === user.id);
      
      if (!sp && user.verificationStatus === 'approved') {
        navigate('/create-profile', { replace: true });
        return;
      }
      
      if (sp) setProfile(sp);
      
      const bookings = (await DB.getBookings()).filter(b => b.specialistId === user.id);
      setMyBookings(bookings);
      
      const allMessages = (await DB.getMessages()).filter(m => m.receiverId === user.id);
      setMessages(allMessages);
    };
    loadData();
  }, [navigate]);

  const handleSave = async () => {
    if (profile.id) {
      await DB.updateSpecialist(profile as Specialist);
      setIsEditing(false);
    }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setSharingLocation(true);
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Update location for active bookings
        const activeBooking = myBookings.find(b => b.status === 'active');
        if (activeBooking) {
          await DB.updateWorkerLocation(activeBooking.id, latitude, longitude);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setSharingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    // Store watchId to stop later if needed
    return () => navigator.geolocation.clearWatch(watchId);
  };

  if (!user) return null;

  if (!profile || !profile.id) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>
      
      <header className="py-8 sm:py-12 border-b border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic">ARTISAN<span className="text-blue-500">BASE</span></h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Operational Identity Management</p>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-6 sm:px-8 py-3 bg-blue-600 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {isEditing ? 'SAVE' : 'EDIT'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 mt-8 sm:mt-12">
        <div className="lg:col-span-8 space-y-8 sm:space-y-12">
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
            <h3 className="text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-gray-500 uppercase">Profile Core</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Professional Title</label>
                <input 
                  disabled={!isEditing}
                  value={profile.title || ''} onChange={e => setProfile({...profile, title: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm disabled:opacity-50 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Sector Category</label>
                <select 
                  disabled={!isEditing}
                  value={profile.category || 'Mechanical'} onChange={e => setProfile({...profile, category: e.target.value as ServiceCategory})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm disabled:opacity-50 focus:border-blue-500 outline-none"
                >
                  <option>Architecture</option>
                  <option>Plumbing</option>
                  <option>Mechanical</option>
                  <option>Aesthetics</option>
                  <option>Electrical</option>
                  <option>Automation</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Hourly Rate (₹)</label>
                <input 
                  type="number" disabled={!isEditing}
                  value={profile.hourlyRate || 1500} onChange={e => setProfile({...profile, hourlyRate: Number(e.target.value)})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm disabled:opacity-50 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Location Hub</label>
                <input 
                  disabled={!isEditing}
                  value={profile.location || ''} onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm disabled:opacity-50 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2 col-span-full">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Mission Statement / Description</label>
                <textarea 
                  disabled={!isEditing} rows={4}
                  value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})}
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 sm:p-4 text-sm disabled:opacity-50 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </section>
          
          {/* Bookings Section */}
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-10 space-y-6">
            <h3 className="text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-gray-500 uppercase">My Bookings ({myBookings.length})</h3>
            {myBookings.filter(b => b.status === 'active').length > 0 && (
              <button
                onClick={startLocationSharing}
                disabled={sharingLocation}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  sharingLocation ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {sharingLocation ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Sharing Live Location
                  </>
                ) : (
                  'Start Location Sharing'
                )}
              </button>
            )}
            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map(booking => {
                  const client = DB.getUserById(booking.userId);
                  return (
                    <div key={booking.id} className="space-y-4">
                      <div className="bg-black/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-2 h-2 rounded-full ${booking.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="text-sm font-bold">{client?.name || 'Client'}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                            {new Date(booking.createdAt).toLocaleDateString()} • {booking.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black">₹{booking.totalValue}</span>
                        </div>
                      </div>
                      {booking.status === 'active' && (
                        <PhotoGallery
                          bookingId={booking.id}
                          beforePhotos={booking.beforePhotos}
                          afterPhotos={booking.afterPhotos}
                          problemPhotos={booking.problemPhotos}
                          canUpload={true}
                          uploadType="before"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest">No bookings yet</p>
              </div>
            )}
          </section>
          
          {/* Earnings Chart */}
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-gray-500 uppercase">Earnings Overview</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                const earnings = Math.floor(Math.random() * 50000) + 10000;
                const percentage = (earnings / 60000) * 100;
                return (
                  <div key={month} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-bold">{month}</span>
                      <span className="font-black">₹{earnings.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total This Year</p>
                <p className="text-3xl font-black text-blue-500">₹{(myBookings.reduce((sum, b) => sum + b.totalValue, 0) * 6).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-600/10 rounded-2xl">
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </section>
          
          {/* Messages Section */}
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-[0.3em] sm:tracking-[0.4em] text-gray-500 uppercase">Messages ({messages.length})</h3>
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map(msg => {
                  const sender = DB.getUserById(msg.senderId);
                  return (
                    <Link key={msg.id} to={`/chat/${msg.senderId}`} className="bg-black/40 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex items-start gap-4 hover:border-blue-500/40 transition-all">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {sender?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold">{sender?.name || 'User'}</span>
                          <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{msg.content}</p>
                        {!msg.read && <span className="inline-block mt-2 px-2 py-1 bg-blue-600 rounded text-[10px] font-bold">NEW</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-10">
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 text-center space-y-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl sm:rounded-[32px] overflow-hidden mx-auto border-2 border-blue-500/50">
              <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
            </div>
            <div>
              <h4 className="text-xl sm:text-2xl font-black">{profile.name}</h4>
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{profile.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <div className="p-3 sm:p-4 bg-black rounded-2xl border border-zinc-800">
                  <span className="text-[8px] text-gray-500 block uppercase tracking-widest">Rating</span>
                  <span className="text-lg sm:text-xl font-black">{profile.rating}</span>
               </div>
               <div className="p-3 sm:p-4 bg-black rounded-2xl border border-zinc-800">
                  <span className="text-[8px] text-gray-500 block uppercase tracking-widest">Tasks</span>
                  <span className="text-lg sm:text-xl font-black">{profile.projects}</span>
               </div>
            </div>
          </section>
          
          <section className="bg-zinc-900/30 border border-zinc-800 rounded-3xl sm:rounded-[40px] p-6 sm:p-8 space-y-4">
            <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Active Bookings</span>
                <span className="text-sm font-black text-green-500">{myBookings.filter(b => b.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Completed</span>
                <span className="text-sm font-black">{myBookings.filter(b => b.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total Earnings</span>
                <span className="text-sm font-black text-blue-500">₹{myBookings.reduce((sum, b) => sum + b.totalValue, 0)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
