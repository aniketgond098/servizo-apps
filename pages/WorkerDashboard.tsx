
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, Booking, Message, User } from '../types';
import {
  Save, Star, Activity, Zap, TrendingUp, DollarSign, MessageCircle,
  Camera, Plus, Trash2, Send, IndianRupee, ChevronDown, Clock, X,
  CalendarClock, CheckCircle2, AlertCircle, Loader2, LayoutDashboard,
  Briefcase, BarChart2, Mail, User as UserIcon, ChevronRight, FileText
} from 'lucide-react';
import { PhotoGallery } from '../components/PhotoGallery';
import { EBill } from '../components/EBill';
const ImageCropper = React.lazy(() => import('../components/ImageCropper'));

type Tab = 'overview' | 'bookings' | 'earnings' | 'messages';
type BookingFilter = 'new' | 'active' | 'pending' | 'completed' | 'cancelled';

export default function WorkerDashboard() {
  const user = AuthService.getCurrentUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<Specialist>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharingLocation, setSharingLocation] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const [chargeDesc, setChargeDesc] = useState<Record<string, string>>({});
  const [chargeAmt, setChargeAmt] = useState<Record<string, string>>({});
  const [chargeLoading, setChargeLoading] = useState<Record<string, boolean>>({});
  const [submitLoading, setSubmitLoading] = useState<Record<string, boolean>>({});
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [cancelActionLoading, setCancelActionLoading] = useState<Record<string, boolean>>({});
  const [acceptLoading, setAcceptLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('new');
  const [billBooking, setBillBooking] = useState<Booking | null>(null);
  const [billUser, setBillUser] = useState<User | null>(null);

  // Availability window state
  const [showWindowPicker, setShowWindowPicker] = useState(false);
  const [windowFrom, setWindowFrom] = useState('');
  const [windowUntil, setWindowUntil] = useState('');
  const [windowSaving, setWindowSaving] = useState(false);
  const autoStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setRawAvatarImage(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const handleAvatarCropDone = async (cropped: string) => {
      const updated = { ...profile, avatar: cropped } as Specialist;
      setProfile(updated);
      setRawAvatarImage(null);
      if (updated.id) await DB.updateSpecialist(updated);
    };

  useEffect(() => {
    if (!user || user.role !== 'worker') { navigate('/login', { replace: true }); return; }
    let unsubSpecialist: (() => void) | null = null;

    const loadData = async () => {
      const freshUser = await DB.getUserById(user.id);
      if (freshUser) {
        AuthService.updateSession(freshUser);
        if (!freshUser.verificationStatus || freshUser.verificationStatus === 'rejected' || freshUser.verificationStatus === 'pending') {
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

      setProfile(sp);
      if (sp.busyFrom) setWindowFrom(toLocalInput(sp.busyFrom));
      if (sp.busyUntil) setWindowUntil(toLocalInput(sp.busyUntil));

      unsubSpecialist = DB.onSpecialist(sp.id, (updated) => {
        setProfile(updated);
        scheduleAutoStatus(updated.busyFrom ?? null, updated.busyUntil ?? null, updated.id);
      });

      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user.id));
      const [allMsgs, allUsers] = await Promise.all([DB.getMessages(), DB.getUsers()]);
      const msgs = allMsgs.filter(m => m.receiverId === user.id);
      setMessages(msgs);
      const userMap = new Map(allUsers.map(u => [u.id, u.name]));
      const names: Record<string, string> = {};
      for (const msg of msgs) {
        if (!names[msg.senderId]) names[msg.senderId] = userMap.get(msg.senderId) || 'User';
      }
      setSenderNames(names);
    };
    loadData();

    return () => {
      unsubSpecialist?.();
      if (autoStatusTimerRef.current) clearTimeout(autoStatusTimerRef.current);
    };
  }, [navigate]);

  const handleSave = async () => { if (profile.id) { await DB.updateSpecialist(profile as Specialist); setIsEditing(false); } };

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const scheduleAutoStatus = (busyFrom: string | null, busyUntil: string | null, spId: string) => {
    if (autoStatusTimerRef.current) clearTimeout(autoStatusTimerRef.current);
    if (!busyUntil) return;
    const msUntilEnd = new Date(busyUntil).getTime() - Date.now();
    if (msUntilEnd <= 0) { DB.setAvailabilityWindow(spId, null, null); return; }
    autoStatusTimerRef.current = setTimeout(() => { DB.setAvailabilityWindow(spId, null, null); }, msUntilEnd);
  };

  const handleSaveWindow = async () => {
    if (!profile.id || !windowFrom || !windowUntil) return;
    if (new Date(windowFrom) >= new Date(windowUntil)) { alert('"Available from" must be before "Available until".'); return; }
    setWindowSaving(true);
    try {
      await DB.setAvailabilityWindow(profile.id, new Date(windowFrom).toISOString(), new Date(windowUntil).toISOString());
      setShowWindowPicker(false);
    } finally { setWindowSaving(false); }
  };

  const handleClearWindow = async () => {
    if (!profile.id) return;
    await DB.setAvailabilityWindow(profile.id, null, null);
    setWindowFrom(''); setWindowUntil('');
  };

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

  const handleAddCharge = async (bookingId: string) => {
    const desc = chargeDesc[bookingId]?.trim();
    const amt = parseFloat(chargeAmt[bookingId]);
    if (!desc || !amt || amt <= 0) return;
    setChargeLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.addExtraCharge(bookingId, desc, amt);
      setChargeDesc(p => ({ ...p, [bookingId]: '' }));
      setChargeAmt(p => ({ ...p, [bookingId]: '' }));
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setChargeLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleRemoveCharge = async (bookingId: string, chargeId: string) => {
    await DB.removeExtraCharge(bookingId, chargeId);
    setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
  };

  const handleSubmitForPayment = async (bookingId: string) => {
    setSubmitLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.submitForPayment(bookingId);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setSubmitLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleStatusChange = async (status: 'available' | 'busy' | 'unavailable') => {
    if (profile.id) {
      const updated = { ...profile, availability: status } as Specialist;
      await DB.updateSpecialist(updated);
      setProfile(updated);
    }
    setStatusDropdownOpen(false);
  };

  const handleApproveCancellation = async (bookingId: string) => {
    setCancelActionLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.approveCancellation(bookingId);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setCancelActionLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleRejectCancellation = async (bookingId: string) => {
    setCancelActionLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.rejectCancellation(bookingId);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setCancelActionLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setAcceptLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.acceptBooking(bookingId);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setAcceptLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setAcceptLoading(p => ({ ...p, [bookingId]: true }));
    try {
      await DB.rejectBooking(bookingId);
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally { setAcceptLoading(p => ({ ...p, [bookingId]: false })); }
  };

  const handleViewBill = async (booking: Booking) => {
    const u = await DB.getUserById(booking.userId);
    if (u) setBillUser(u);
    setBillBooking(booking);
  };

  const statusConfig = {
    available: { label: 'Available', dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    busy: { label: 'Busy', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    unavailable: { label: 'Unavailable', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  };
  const currentStatus = statusConfig[profile.availability || 'available'];

  const filteredBookings = myBookings.filter(b => {
    if (bookingFilter === 'new') return b.status === 'pending_worker_acceptance';
    if (bookingFilter === 'active') return b.status === 'active' || b.status === 'cancellation_pending';
    if (bookingFilter === 'pending') return b.status === 'pending_payment';
    if (bookingFilter === 'completed') return b.status === 'completed';
    if (bookingFilter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings', icon: <Briefcase className="w-4 h-4" />, count: myBookings.filter(b => b.status === 'pending_worker_acceptance' || b.status === 'active' || b.status === 'cancellation_pending').length || undefined },
    { id: 'earnings', label: 'Earnings', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <Mail className="w-4 h-4" />, count: messages.filter(m => !m.read).length || undefined },
  ];

  if (!user) return null;
  if (!profile || !profile.id) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#4169E1] animate-spin" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  );

  const activeCount = myBookings.filter(b => b.status === 'active').length;
  const completedCount = myBookings.filter(b => b.status === 'completed').length;
  const totalEarnings = myBookings.reduce((sum, b) => sum + b.totalValue, 0);
  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Top identity + availability bar ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0 w-14 h-14 group">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  profile.availability === 'available' ? 'ring-2 ring-green-400' :
                  profile.availability === 'busy' ? 'ring-2 ring-red-400' : 'ring-2 ring-gray-300'
                }`}>
                  <img src={profile.avatar} className="w-14 h-14 rounded-full object-cover" alt={profile.name} />
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-[#4169E1] rounded-full flex items-center justify-center shadow-md border border-white hover:bg-blue-600 transition-colors"
                  title="Change profile photo"
                >
                  <Camera className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h2>
              <p className="text-sm text-[#4169E1] font-medium truncate">{profile.title}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{profile.rating}</span>
                <span className="text-xs text-gray-400">{profile.projects} jobs</span>
              </div>
            </div>
          </div>

          {/* Availability controls — always visible, right side on desktop, below on mobile */}
          <div className="flex flex-col sm:items-end gap-2 sm:min-w-[220px]">
            {/* Status dropdown */}
            <div className="relative w-full sm:w-52">
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border ${currentStatus.border} ${currentStatus.bg} transition-all`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot} ${profile.availability === 'available' ? 'animate-pulse' : ''}`} />
                  <span className={`text-sm font-semibold ${currentStatus.text}`}>{currentStatus.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 ${currentStatus.text} transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    {(Object.entries(statusConfig) as [string, typeof currentStatus][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(key as 'available' | 'busy' | 'unavailable')}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${profile.availability === key ? 'bg-gray-50' : ''}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                        {profile.availability === key && <span className="ml-auto text-xs text-gray-400">Current</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Availability window */}
            {profile.busyUntil && new Date(profile.busyUntil) > new Date() ? (
              <div className="w-full sm:w-52 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium leading-tight">
                      Until {new Date(profile.busyUntil!).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={handleClearWindow} className="p-0.5 text-amber-500 hover:text-amber-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowWindowPicker(true)}
                className="w-full sm:w-52 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-[#4169E1] hover:text-[#4169E1] text-xs font-medium transition-colors"
              >
                <Clock className="w-3.5 h-3.5" /> Set Availability Window
              </button>
            )}
          </div>
        </div>

        {/* ── Stat cards row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active Jobs', value: activeCount, color: 'text-green-600', bg: 'bg-green-50', icon: <Activity className="w-4 h-4 text-green-500" /> },
            { label: 'Completed', value: completedCount, color: 'text-[#4169E1]', bg: 'bg-blue-50', icon: <CheckCircle2 className="w-4 h-4 text-[#4169E1]" /> },
            { label: 'Earnings', value: `₹${totalEarnings.toLocaleString()}`, color: 'text-gray-900', bg: 'bg-gray-50', icon: <IndianRupee className="w-4 h-4 text-gray-500" /> },
            { label: 'Unread Msgs', value: unreadCount, color: 'text-purple-600', bg: 'bg-purple-50', icon: <MessageCircle className="w-4 h-4 text-purple-500" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg} flex-shrink-0`}>{stat.icon}</div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-400 font-medium">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color} truncate`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#4169E1] text-[#4169E1] bg-blue-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#4169E1] text-white rounded-full text-[10px] font-bold leading-none">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Profile card */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Profile Information</h3>
                    <button
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors bg-gray-900 text-white hover:bg-gray-700"
                    >
                      {isEditing ? <><Save className="w-3.5 h-3.5" /> Save</> : <><Zap className="w-3.5 h-3.5" /> Edit Profile</>}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Title</label>
                      <input disabled={!isEditing} value={profile.title || ''} onChange={e => setProfile({ ...profile, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category</label>
                      <select disabled={!isEditing} value={profile.category || 'Mechanical'} onChange={e => setProfile({ ...profile, category: e.target.value as ServiceCategory })}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]">
                        <option>Architecture</option><option>Plumbing</option><option>Mechanical</option><option>Aesthetics</option><option>Electrical</option><option>Automation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Visit Rate (₹)</label>
                      <input type="number" disabled={!isEditing} value={profile.hourlyRate || 1500} onChange={e => setProfile({ ...profile, hourlyRate: Number(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Location</label>
                      <input disabled={!isEditing} value={profile.location || ''} onChange={e => setProfile({ ...profile, location: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                    </div>
                    <div className="col-span-full">
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                      <textarea disabled={!isEditing} rows={3} value={profile.description || ''} onChange={e => setProfile({ ...profile, description: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1] resize-none" />
                    </div>
                  </div>
                </div>

                {/* Quick nav cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { tab: 'bookings' as Tab, label: 'View Bookings', sub: `${myBookings.length} total`, icon: <Briefcase className="w-5 h-5 text-[#4169E1]" />, bg: 'bg-blue-50' },
                    { tab: 'earnings' as Tab, label: 'Earnings Report', sub: `₹${totalEarnings.toLocaleString()} earned`, icon: <BarChart2 className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
                    { tab: 'messages' as Tab, label: 'Messages', sub: `${unreadCount} unread`, icon: <Mail className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
                  ].map(item => (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#4169E1]/30 hover:shadow-sm transition-all text-left group"
                    >
                      <div className={`p-2.5 rounded-xl ${item.bg}`}>{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#4169E1] transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── BOOKINGS TAB ── */}
            {activeTab === 'bookings' && (
              <div>
                {/* Sub-filter pills */}
                <div className="flex gap-2 flex-wrap mb-5">
                    {([
                      { key: 'new', label: 'New Requests', count: myBookings.filter(b => b.status === 'pending_worker_acceptance').length },
                      { key: 'active', label: 'Active', count: myBookings.filter(b => b.status === 'active' || b.status === 'cancellation_pending').length },
                      { key: 'pending', label: 'Awaiting Payment', count: myBookings.filter(b => b.status === 'pending_payment').length },
                    { key: 'completed', label: 'Completed', count: myBookings.filter(b => b.status === 'completed').length },
                    { key: 'cancelled', label: 'Cancelled', count: myBookings.filter(b => b.status === 'cancelled').length },
                  ] as { key: BookingFilter; label: string; count: number }[]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setBookingFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        bookingFilter === f.key
                          ? 'bg-[#4169E1] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {f.label} {f.count > 0 && <span className={`ml-1 ${bookingFilter === f.key ? 'opacity-75' : 'opacity-60'}`}>({f.count})</span>}
                    </button>
                  ))}
                </div>

                {/* Location sharing button for active bookings */}
                {bookingFilter === 'active' && myBookings.filter(b => b.status === 'active').length > 0 && (
                  <button
                    onClick={startLocationSharing} disabled={sharingLocation}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm mb-4 flex items-center justify-center gap-2 transition-all ${sharingLocation ? 'bg-green-500 text-white' : 'bg-[#4169E1] text-white hover:bg-blue-600'}`}
                  >
                    {sharingLocation
                      ? <><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Sharing Live Location</>
                      : 'Start Location Sharing'}
                  </button>
                )}

                {filteredBookings.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBookings.map(booking => {
                      const extraTotal = (booking.extraCharges || []).reduce((s, c) => s + c.amount, 0);
                      const grandTotal = booking.totalValue + extraTotal;
                      return (
                        <div key={booking.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          {/* Booking header */}
                          <div className="flex justify-between items-center p-4 bg-gray-50/60">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                booking.status === 'active' ? 'bg-green-500 animate-pulse' :
                                booking.status === 'pending_payment' ? 'bg-amber-500 animate-pulse' :
                                booking.status === 'cancellation_pending' ? 'bg-orange-500 animate-pulse' :
                                booking.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                              }`} />
                              <div>
                                <p className="text-sm font-bold text-gray-900">Booking #{booking.id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">₹{grandTotal.toLocaleString()}</p>
                              {extraTotal > 0 && <p className="text-[10px] text-gray-400">+₹{extraTotal} extra</p>}
                            </div>
                          </div>

                          {/* Status badge row */}
                          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              booking.status === 'active' ? 'bg-green-50 text-green-700' :
                              booking.status === 'pending_payment' ? 'bg-amber-50 text-amber-700' :
                              booking.status === 'cancellation_pending' ? 'bg-orange-50 text-orange-700' :
                              booking.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {booking.status === 'pending_payment' ? 'Awaiting Payment' :
                               booking.status === 'cancellation_pending' ? 'Cancel Requested' :
                               booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            {booking.completedAt && (
                              <span className="text-xs text-gray-400">Completed {new Date(booking.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            )}
                          </div>

                            {/* New booking request — accept or reject */}
                            {booking.status === 'pending_worker_acceptance' && (
                              <div className="p-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                                    <h4 className="text-sm font-bold text-blue-800">New Booking Request</h4>
                                  </div>
                                  <p className="text-xs text-blue-700">A customer has requested your services. Accept to confirm the booking or decline to reject it.</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAcceptBooking(booking.id)}
                                      disabled={!!acceptLoading[booking.id]}
                                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                      {acceptLoading[booking.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRejectBooking(booking.id)}
                                      disabled={!!acceptLoading[booking.id]}
                                      className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                      {acceptLoading[booking.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Decline'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Extra charges — active only */}
                            {booking.status === 'active' && (
                            <div className="p-4 space-y-3">
                              <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5" /> Extra Charges
                              </h4>
                              {(booking.extraCharges || []).length > 0 && (
                                <div className="space-y-2">
                                  {booking.extraCharges!.map(charge => (
                                    <div key={charge.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                      <div>
                                        <p className="text-sm text-gray-900 font-medium">{charge.description}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(charge.addedAt).toLocaleTimeString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">+₹{charge.amount}</span>
                                        <button onClick={() => handleRemoveCharge(booking.id, charge.id)} className="p-1 text-red-400 hover:text-red-600 rounded transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <input
                                  placeholder="Description"
                                  value={chargeDesc[booking.id] || ''}
                                  onChange={e => setChargeDesc(p => ({ ...p, [booking.id]: e.target.value }))}
                                  className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                                />
                                <input
                                  type="number" placeholder="₹"
                                  value={chargeAmt[booking.id] || ''}
                                  onChange={e => setChargeAmt(p => ({ ...p, [booking.id]: e.target.value }))}
                                  className="w-24 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                                />
                                <button
                                  onClick={() => handleAddCharge(booking.id)}
                                  disabled={chargeLoading[booking.id]}
                                  className="px-3 py-2 bg-[#4169E1] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                  {chargeLoading[booking.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </button>
                              </div>
                              <button
                                onClick={() => handleSubmitForPayment(booking.id)}
                                disabled={submitLoading[booking.id]}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {submitLoading[booking.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Complete & Send for Payment
                              </button>
                            </div>
                          )}

                          {/* Awaiting payment */}
                          {booking.status === 'pending_payment' && (
                            <div className="p-4">
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
                                <p className="text-xs text-amber-700">Waiting for customer to review and make payment.</p>
                              </div>
                            </div>
                          )}

                          {/* Cancellation request */}
                          {booking.status === 'cancellation_pending' && (
                            <div className="p-4">
                              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                  <h4 className="text-sm font-bold text-orange-800">Cancellation Requested</h4>
                                </div>
                                {booking.cancellationReason && (
                                  <div className="bg-white/70 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Reason</p>
                                    <p className="text-xs text-gray-700">{booking.cancellationReason}</p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveCancellation(booking.id)}
                                    disabled={!!cancelActionLoading[booking.id]}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                                  >
                                    {cancelActionLoading[booking.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve Cancel'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectCancellation(booking.id)}
                                    disabled={!!cancelActionLoading[booking.id]}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  >
                                    {cancelActionLoading[booking.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reject'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                            {/* Photo gallery for active bookings */}
                            {booking.status === 'active' && (
                              <div className="px-4 pb-4">
                                <PhotoGallery bookingId={booking.id} beforePhotos={booking.beforePhotos} afterPhotos={booking.afterPhotos} problemPhotos={booking.problemPhotos} canUpload={true} uploadType="before" />
                              </div>
                            )}

                            {/* View bill for completed bookings */}
                            {booking.status === 'completed' && (
                              <div className="px-4 pb-4">
                                <button
                                  onClick={() => handleViewBill(booking)}
                                  className="w-full py-2.5 bg-[#4169E1] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" /> View Receipt / E-Bill
                                </button>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-14">
                    <Briefcase className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No {bookingFilter} bookings</p>
                  </div>
                )}
              </div>
            )}

            {/* ── EARNINGS TAB ── */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-500 font-medium mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-[#4169E1]">₹{totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium mb-1">Jobs Done</p>
                    <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                  </div>
                </div>

                {/* Monthly chart */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Monthly Overview</h4>
                  <div className="space-y-3">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => {
                      const earnings = Math.floor(Math.random() * 50000) + 10000;
                      const pct = (earnings / 60000) * 100;
                      return (
                        <div key={month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-8 flex-shrink-0">{month}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-[#4169E1] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-20 text-right flex-shrink-0">₹{earnings.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Projected (×6)</p>
                  <p className="text-xl font-bold text-[#4169E1]">₹{(totalEarnings * 6).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* ── MESSAGES TAB ── */}
            {activeTab === 'messages' && (
              <div>
                {messages.length > 0 ? (
                  <div className="space-y-2">
                    {messages.map(msg => (
                      <Link
                        key={msg.id}
                        to={`/chat/${msg.senderId}`}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#4169E1]/40 hover:bg-blue-50/30 transition-all"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {(senderNames[msg.senderId] || 'U').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-semibold text-gray-900">{senderNames[msg.senderId] || 'User'}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                        </div>
                        {!msg.read && (
                          <span className="w-2 h-2 bg-[#4169E1] rounded-full flex-shrink-0" />
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-14">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Availability window picker modal */}
      {showWindowPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowWindowPicker(false)} />
          <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#4169E1]" />
                <h3 className="text-base font-bold text-gray-900">Set Availability Window</h3>
              </div>
              <button onClick={() => setShowWindowPicker(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Available From</label>
                <input type="datetime-local" value={windowFrom} onChange={e => setWindowFrom(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#4169E1]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Available Until</label>
                <input type="datetime-local" value={windowUntil} onChange={e => setWindowUntil(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#4169E1]" />
              </div>
              <p className="text-xs text-gray-400">Status will auto-switch to <strong>Busy</strong> outside this window and back to <strong>Available</strong> when active.</p>
              <button
                onClick={handleSaveWindow}
                disabled={!windowFrom || !windowUntil || windowSaving}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {windowSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                Save Window
              </button>
            </div>
          </div>
        </>
      )}

      {rawAvatarImage && (
        <React.Suspense fallback={null}>
          <ImageCropper
            imageSrc={rawAvatarImage}
            onCropDone={handleAvatarCropDone}
            onCancel={() => setRawAvatarImage(null)}
          />
        </React.Suspense>
        )}
      </div>

      {/* E-Bill Modal */}
      {billBooking && profile.id && billUser && (
        <EBill
          booking={billBooking}
          specialist={profile as Specialist}
          user={billUser}
          onClose={() => { setBillBooking(null); setBillUser(null); }}
        />
      )}
    </div>
  );
}
