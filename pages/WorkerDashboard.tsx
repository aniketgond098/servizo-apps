
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, Booking, Message } from '../types';
import { Save, Star, Activity, Zap, TrendingUp, DollarSign, MessageCircle } from 'lucide-react';
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
    if (!user || user.role !== 'worker') { navigate('/login', { replace: true }); return; }
    const loadData = async () => {
      // Refresh user data from DB to get latest verificationStatus
      const freshUser = await DB.getUserById(user.id);
      if (freshUser) {
        AuthService.updateSession(freshUser);
        if (!freshUser.verificationStatus || freshUser.verificationStatus === 'rejected') {
          navigate('/document-upload', { replace: true }); return;
        }
        if (freshUser.verificationStatus === 'pending') {
          navigate('/document-upload', { replace: true }); return;
        }
      } else {
        if (!user.verificationStatus || user.verificationStatus === 'rejected' || user.verificationStatus === 'pending') {
          navigate('/document-upload', { replace: true }); return;
        }
      }
      const specialists = await DB.getSpecialists();
      let sp = specialists.find(s => s.userId === user.id);
      if (!sp) { navigate('/create-profile', { replace: true }); return; }
      if (sp) setProfile(sp);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user.id));
      setMessages((await DB.getMessages()).filter(m => m.receiverId === user.id));
    };
    loadData();
  }, [navigate]);

  const handleSave = async () => { if (profile.id) { await DB.updateSpecialist(profile as Specialist); setIsEditing(false); } };

  const startLocationSharing = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setSharingLocation(true);
    navigator.geolocation.watchPosition(
      async (position) => {
        const activeBooking = myBookings.find(b => b.status === 'active');
        if (activeBooking) await DB.updateWorkerLocation(activeBooking.id, position.coords.latitude, position.coords.longitude);
      },
      () => setSharingLocation(false),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  };

  if (!user) return null;
  if (!profile || !profile.id) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading profile...</p></div>;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2b49]">Worker Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your profile and bookings</p>
          </div>
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-5 py-2.5 bg-[#1a2b49] text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#0f1d35] transition-colors">
            {isEditing ? <Save className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Form */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#1a2b49] mb-5">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Title</label>
                  <input disabled={!isEditing} value={profile.title || ''} onChange={e => setProfile({...profile, title: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#1a73e8]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category</label>
                  <select disabled={!isEditing} value={profile.category || 'Mechanical'} onChange={e => setProfile({...profile, category: e.target.value as ServiceCategory})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#1a73e8]">
                    <option>Architecture</option><option>Plumbing</option><option>Mechanical</option><option>Aesthetics</option><option>Electrical</option><option>Automation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Hourly Rate (₹)</label>
                  <input type="number" disabled={!isEditing} value={profile.hourlyRate || 1500} onChange={e => setProfile({...profile, hourlyRate: Number(e.target.value)})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#1a73e8]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Location</label>
                  <input disabled={!isEditing} value={profile.location || ''} onChange={e => setProfile({...profile, location: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#1a73e8]" />
                </div>
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                  <textarea disabled={!isEditing} rows={3} value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#1a73e8]" />
                </div>
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#1a2b49] mb-5">My Bookings ({myBookings.length})</h3>
              {myBookings.filter(b => b.status === 'active').length > 0 && (
                <button onClick={startLocationSharing} disabled={sharingLocation}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm mb-4 flex items-center justify-center gap-2 transition-all ${sharingLocation ? 'bg-green-500 text-white' : 'bg-[#1a73e8] text-white hover:bg-blue-600'}`}>
                  {sharingLocation ? <><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Sharing Live Location</> : 'Start Location Sharing'}
                </button>
              )}
              {myBookings.length > 0 ? (
                <div className="space-y-3">
                  {myBookings.map(booking => {
                    const client = DB.getUserById(booking.userId);
                    return (
                      <div key={booking.id} className="space-y-3">
                        <div className="border border-gray-100 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${booking.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                              <span className="text-sm font-semibold text-[#1a2b49]">{client?.name || 'Client'}</span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString()} · {booking.status}</p>
                          </div>
                          <span className="text-lg font-bold text-[#1a2b49]">₹{booking.totalValue}</span>
                        </div>
                        {booking.status === 'active' && (
                          <PhotoGallery bookingId={booking.id} beforePhotos={booking.beforePhotos} afterPhotos={booking.afterPhotos} problemPhotos={booking.problemPhotos} canUpload={true} uploadType="before" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No bookings yet</p>
                </div>
              )}
            </div>

            {/* Earnings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1a2b49]">Earnings Overview</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => {
                  const earnings = Math.floor(Math.random() * 50000) + 10000;
                  return (
                    <div key={month} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{month}</span>
                        <span className="font-semibold text-[#1a2b49]">₹{earnings.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#1a73e8] h-full rounded-full" style={{ width: `${(earnings / 60000) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total This Year</p>
                  <p className="text-2xl font-bold text-[#1a73e8]">₹{(myBookings.reduce((sum, b) => sum + b.totalValue, 0) * 6).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-[#1a73e8]" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1a2b49]">Messages ({messages.length})</h3>
                <MessageCircle className="w-5 h-5 text-[#1a73e8]" />
              </div>
              {messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map(msg => {
                    const sender = DB.getUserById(msg.senderId);
                    return (
                      <Link key={msg.id} to={`/chat/${msg.senderId}`} className="border border-gray-100 rounded-lg p-4 flex items-start gap-3 hover:border-[#1a73e8] transition-all block">
                        <div className="w-9 h-9 rounded-full bg-[#1a2b49] flex items-center justify-center text-sm font-medium text-white flex-shrink-0">{sender?.name?.charAt(0) || 'U'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-semibold text-[#1a2b49]">{sender?.name || 'User'}</span>
                            <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                          {!msg.read && <span className="inline-block mt-1 px-2 py-0.5 bg-[#1a73e8] text-white rounded text-[10px] font-semibold">NEW</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No messages yet</p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-[#1a73e8]">
                <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
              </div>
              <h4 className="text-xl font-bold text-[#1a2b49]">{profile.name}</h4>
              <p className="text-xs text-[#1a73e8] font-medium">{profile.title}</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-xl font-bold text-[#1a2b49]">{profile.rating}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Tasks</p>
                  <p className="text-xl font-bold text-[#1a2b49]">{profile.projects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#1a2b49] mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Active Bookings</span>
                  <span className="text-sm font-bold text-green-600">{myBookings.filter(b => b.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="text-sm font-bold text-[#1a2b49]">{myBookings.filter(b => b.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Earnings</span>
                  <span className="text-sm font-bold text-[#1a73e8]">₹{myBookings.reduce((sum, b) => sum + b.totalValue, 0)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
