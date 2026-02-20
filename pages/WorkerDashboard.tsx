
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Specialist, ServiceCategory, Booking, Message } from '../types';
import { Save, Star, Activity, Zap, TrendingUp, DollarSign, MessageCircle, Camera, Plus, Trash2, Send, IndianRupee, ChevronDown, Clock, X, CalendarClock } from 'lucide-react';
import { PhotoGallery } from '../components/PhotoGallery';
const ImageCropper = React.lazy(() => import('../components/ImageCropper'));

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

  useEffect(() => {
    if (!user || user.role !== 'worker') { navigate('/login', { replace: true }); return; }
    let unsubSpecialist: (() => void) | null = null;

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

      setProfile(sp);
      // Pre-fill window picker from saved values
      if (sp.busyFrom) setWindowFrom(toLocalInput(sp.busyFrom));
      if (sp.busyUntil) setWindowUntil(toLocalInput(sp.busyUntil));

      // Subscribe to real-time specialist updates
      unsubSpecialist = DB.onSpecialist(sp.id, (updated) => {
        setProfile(updated);
        scheduleAutoStatus(updated.busyFrom ?? null, updated.busyUntil ?? null, updated.id);
      });

      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user.id));
      // Resolve sender names for messages
      const [allMsgs, allUsers] = await Promise.all([DB.getMessages(), DB.getUsers()]);
      const msgs = allMsgs.filter(m => m.receiverId === user.id);
      setMessages(msgs);
      const userMap = new Map(allUsers.map(u => [u.id, u.name]));
      const names: Record<string, string> = {};
      for (const msg of msgs) {
        if (!names[msg.senderId]) {
          names[msg.senderId] = userMap.get(msg.senderId) || 'User';
        }
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

  // Convert ISO string → local datetime-local input value
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Schedule a timer to flip status back to 'available' when busyUntil arrives
  const scheduleAutoStatus = (busyFrom: string | null, busyUntil: string | null, spId: string) => {
    if (autoStatusTimerRef.current) clearTimeout(autoStatusTimerRef.current);
    if (!busyUntil) return;
    const msUntilEnd = new Date(busyUntil).getTime() - Date.now();
    if (msUntilEnd <= 0) {
      // Window already passed — clear it now
      DB.setAvailabilityWindow(spId, null, null);
      return;
    }
    autoStatusTimerRef.current = setTimeout(() => {
      DB.setAvailabilityWindow(spId, null, null);
    }, msUntilEnd);
  };

  const handleSaveWindow = async () => {
    if (!profile.id || !windowFrom || !windowUntil) return;
    if (new Date(windowFrom) >= new Date(windowUntil)) {
      alert('"Available from" must be before "Available until".');
      return;
    }
    setWindowSaving(true);
    try {
      await DB.setAvailabilityWindow(profile.id, new Date(windowFrom).toISOString(), new Date(windowUntil).toISOString());
      setShowWindowPicker(false);
    } finally {
      setWindowSaving(false);
    }
  };

  const handleClearWindow = async () => {
    if (!profile.id) return;
    await DB.setAvailabilityWindow(profile.id, null, null);
    setWindowFrom('');
    setWindowUntil('');
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
      // Refresh bookings
      setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
    } finally {
      setChargeLoading(p => ({ ...p, [bookingId]: false }));
    }
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
    } finally {
      setSubmitLoading(p => ({ ...p, [bookingId]: false }));
    }
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
      } finally {
        setCancelActionLoading(p => ({ ...p, [bookingId]: false }));
      }
    };

    const handleRejectCancellation = async (bookingId: string) => {
      setCancelActionLoading(p => ({ ...p, [bookingId]: true }));
      try {
        await DB.rejectCancellation(bookingId);
        setMyBookings((await DB.getBookings()).filter(b => b.specialistId === user!.id));
      } finally {
        setCancelActionLoading(p => ({ ...p, [bookingId]: false }));
      }
    };

    const statusConfig = {
      available: { label: 'Available', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      busy: { label: 'Busy', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      unavailable: { label: 'Unavailable', color: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    };
    const currentStatus = statusConfig[profile.availability || 'available'];

    if (!user) return null;
  if (!profile || !profile.id) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading profile...</p></div>;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">Worker Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your profile and bookings</p>
          </div>
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="px-5 py-2.5 bg-[#000000] text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#1a1a1a] transition-colors">
            {isEditing ? <Save className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Form */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#000000] mb-5">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Title</label>
                  <input disabled={!isEditing} value={profile.title || ''} onChange={e => setProfile({...profile, title: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Category</label>
                  <select disabled={!isEditing} value={profile.category || 'Mechanical'} onChange={e => setProfile({...profile, category: e.target.value as ServiceCategory})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]">
                    <option>Architecture</option><option>Plumbing</option><option>Mechanical</option><option>Aesthetics</option><option>Electrical</option><option>Automation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Hourly Rate (₹)</label>
                  <input type="number" disabled={!isEditing} value={profile.hourlyRate || 1500} onChange={e => setProfile({...profile, hourlyRate: Number(e.target.value)})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Location</label>
                  <input disabled={!isEditing} value={profile.location || ''} onChange={e => setProfile({...profile, location: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                </div>
                <div className="col-span-full">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                  <textarea disabled={!isEditing} rows={3} value={profile.description || ''} onChange={e => setProfile({...profile, description: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:border-[#4169E1]" />
                </div>
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#000000] mb-5">My Bookings ({myBookings.length})</h3>
              {myBookings.filter(b => b.status === 'active').length > 0 && (
                <button onClick={startLocationSharing} disabled={sharingLocation}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm mb-4 flex items-center justify-center gap-2 transition-all ${sharingLocation ? 'bg-green-500 text-white' : 'bg-[#4169E1] text-white hover:bg-blue-600'}`}>
                  {sharingLocation ? <><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Sharing Live Location</> : 'Start Location Sharing'}
                </button>
              )}
              {myBookings.length > 0 ? (
                <div className="space-y-3">
                  {myBookings.map(booking => {
                    const extraTotal = (booking.extraCharges || []).reduce((s, c) => s + c.amount, 0);
                    const grandTotal = booking.totalValue + extraTotal;
                    return (
                      <div key={booking.id} className="space-y-3">
                        <div className="border border-gray-100 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${booking.status === 'active' ? 'bg-green-500 animate-pulse' : booking.status === 'pending_payment' ? 'bg-amber-500 animate-pulse' : booking.status === 'cancellation_pending' ? 'bg-orange-500 animate-pulse' : booking.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm font-semibold text-[#000000]">Booking {booking.id}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${booking.status === 'active' ? 'bg-green-50 text-green-600' : booking.status === 'pending_payment' ? 'bg-amber-50 text-amber-600' : booking.status === 'cancellation_pending' ? 'bg-orange-50 text-orange-600' : booking.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
                                  {booking.status === 'pending_payment' ? 'Awaiting Payment' : booking.status === 'cancellation_pending' ? 'Cancel Requested' : booking.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {new Date(booking.createdAt).toLocaleDateString()}
                                {booking.completedAt && ` · Completed ${new Date(booking.completedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-[#000000]">₹{grandTotal}</span>
                              {extraTotal > 0 && <p className="text-[10px] text-gray-400">Base ₹{booking.totalValue} + Extra ₹{extraTotal}</p>}
                            </div>
                          </div>

                          {/* Extra Charges Section - only for active bookings */}
                          {booking.status === 'active' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h4 className="text-xs font-semibold text-[#000000] mb-3 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5" /> Extra Charges
                              </h4>

                              {/* Existing charges */}
                              {(booking.extraCharges || []).length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {booking.extraCharges!.map(charge => (
                                    <div key={charge.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                      <div>
                                        <p className="text-sm text-[#000000] font-medium">{charge.description}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(charge.addedAt).toLocaleTimeString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#000000]">+₹{charge.amount}</span>
                                        <button onClick={() => handleRemoveCharge(booking.id, charge.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add new charge */}
                              <div className="flex gap-2">
                                <input
                                  placeholder="Description (e.g. replaced part)"
                                  value={chargeDesc[booking.id] || ''}
                                  onChange={e => setChargeDesc(p => ({ ...p, [booking.id]: e.target.value }))}
                                  className="flex-1 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                                />
                                <input
                                  type="number"
                                  placeholder="₹ Amount"
                                  value={chargeAmt[booking.id] || ''}
                                  onChange={e => setChargeAmt(p => ({ ...p, [booking.id]: e.target.value }))}
                                  className="w-28 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                                />
                                <button
                                  onClick={() => handleAddCharge(booking.id)}
                                  disabled={chargeLoading[booking.id]}
                                  className="px-3 py-2 bg-[#4169E1] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Submit for payment */}
                              <button
                                onClick={() => handleSubmitForPayment(booking.id)}
                                disabled={submitLoading[booking.id]}
                                className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {submitLoading[booking.id] ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                                Complete & Send for Payment
                              </button>
                            </div>
                          )}

                          {/* Pending payment status */}
                          {booking.status === 'pending_payment' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <p className="text-xs text-amber-700">Waiting for customer to review charges and make payment.</p>
                              </div>
                            </div>
                          )}

                          {/* Cancellation Request */}
                          {booking.status === 'cancellation_pending' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                                  <h4 className="text-sm font-bold text-orange-800">Cancellation Request</h4>
                                </div>
                                {booking.cancellationReason && (
                                  <div className="bg-white/60 rounded-lg p-3">
                                    <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Reason</p>
                                    <p className="text-xs text-gray-700">{booking.cancellationReason}</p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveCancellation(booking.id)}
                                    disabled={!!cancelActionLoading[booking.id]}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
                                  >
                                    {cancelActionLoading[booking.id] ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Approve Cancel'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectCancellation(booking.id)}
                                    disabled={!!cancelActionLoading[booking.id]}
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                  >
                                    {cancelActionLoading[booking.id] ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : 'Reject'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
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
                <h3 className="text-base font-bold text-[#000000]">Earnings Overview</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => {
                  const earnings = Math.floor(Math.random() * 50000) + 10000;
                  return (
                    <div key={month} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{month}</span>
                        <span className="font-semibold text-[#000000]">₹{earnings.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-[#4169E1] h-full rounded-full" style={{ width: `${(earnings / 60000) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total This Year</p>
                  <p className="text-2xl font-bold text-[#4169E1]">₹{(myBookings.reduce((sum, b) => sum + b.totalValue, 0) * 6).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-[#4169E1]" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#000000]">Messages ({messages.length})</h3>
                <MessageCircle className="w-5 h-5 text-[#4169E1]" />
              </div>
              {messages.length > 0 ? (
                <div className="space-y-3">
                    {messages.map(msg => {
                      return (
                        <Link key={msg.id} to={`/chat/${msg.senderId}`} className="border border-gray-100 rounded-lg p-4 flex items-start gap-3 hover:border-[#4169E1] transition-all block">
                          <div className="w-9 h-9 rounded-full bg-[#000000] flex items-center justify-center text-sm font-medium text-white flex-shrink-0">{(senderNames[msg.senderId] || 'U').charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-semibold text-[#000000]">{senderNames[msg.senderId] || 'User'}</span>
                            <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                          {!msg.read && <span className="inline-block mt-1 px-2 py-0.5 bg-[#4169E1] text-white rounded text-[10px] font-semibold">NEW</span>}
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
                <div 
                    className={`relative w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ${isEditing ? 'cursor-pointer group' : ''}`}
                    onClick={() => isEditing && avatarInputRef.current?.click()}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      profile.availability === 'available' ? 'bg-green-500' :
                      profile.availability === 'busy' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center">
                        <img src={profile.avatar} className="w-16 h-16 rounded-full object-cover" alt={profile.name} />
                      </div>
                    </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                {isEditing && <p className="text-[10px] text-[#4169E1] mb-2 cursor-pointer hover:underline" onClick={() => avatarInputRef.current?.click()}>Change Photo</p>}
                <h4 className="text-xl font-bold text-[#000000]">{profile.name}</h4>
                <p className="text-xs text-[#4169E1] font-medium">{profile.title}</p>

                  {/* Status Toggle */}
                  <div className="relative mt-4">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border ${currentStatus.border} ${currentStatus.bg} transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.color} ${profile.availability === 'available' ? 'animate-pulse' : ''}`} />
                        <span className={`text-sm font-semibold ${currentStatus.text}`}>{currentStatus.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ${currentStatus.text} transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {statusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                          {(Object.entries(statusConfig) as [string, typeof currentStatus][]).map(([key, cfg]) => (
                            <button
                              key={key}
                              onClick={() => handleStatusChange(key as 'available' | 'busy' | 'unavailable')}
                              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${profile.availability === key ? 'bg-gray-50' : ''}`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                              <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
                              {profile.availability === key && <span className="ml-auto text-xs text-gray-400">Current</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Availability Window */}
                  <div className="mt-3">
                    {profile.busyUntil && new Date(profile.busyUntil) > new Date() ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">Availability Window Set</span>
                          </div>
                          <button onClick={handleClearWindow} className="p-0.5 text-amber-500 hover:text-amber-700 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                          <p className="text-[11px] text-amber-600">
                          Available{' '}
                          {profile.busyFrom ? new Date(profile.busyFrom).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          {' → '}
                          {new Date(profile.busyUntil!).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowWindowPicker(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-[#4169E1] hover:text-[#4169E1] text-xs font-medium transition-colors"
                      >
                          <Clock className="w-3.5 h-3.5" /> Set Availability Window
                      </button>
                    )}
                  </div>

                  {/* Busy Window Picker modal */}
                  {showWindowPicker && (
                    <>
                      <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowWindowPicker(false)} />
                      <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-96 bg-white rounded-2xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-[#4169E1]" />
                              <h3 className="text-base font-bold text-[#000000]">Set Availability Window</h3>
                          </div>
                          <button onClick={() => setShowWindowPicker(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Available From</label>
                            <input
                              type="datetime-local"
                              value={windowFrom}
                              onChange={e => setWindowFrom(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                            />
                          </div>
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Available Until</label>
                            <input
                              type="datetime-local"
                              value={windowUntil}
                              onChange={e => setWindowUntil(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#4169E1]"
                            />
                          </div>
                            <p className="text-xs text-gray-400">Your status will automatically switch to <strong>Busy</strong> outside this window and back to <strong>Available</strong> when the window is active.</p>
                          <button
                            onClick={handleSaveWindow}
                            disabled={!windowFrom || !windowUntil || windowSaving}
                            className="w-full py-3 bg-[#000000] text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                          >
                            {windowSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                            Save Window
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-xl font-bold text-[#000000]">{profile.rating}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400">Tasks</p>
                  <p className="text-xl font-bold text-[#000000]">{profile.projects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#000000] mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Active Bookings</span>
                  <span className="text-sm font-bold text-green-600">{myBookings.filter(b => b.status === 'active').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="text-sm font-bold text-[#000000]">{myBookings.filter(b => b.status === 'completed').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Earnings</span>
                  <span className="text-sm font-bold text-[#4169E1]">₹{myBookings.reduce((sum, b) => sum + b.totalValue, 0)}</span>
                </div>
              </div>
            </div>
          </aside>
          </div>
        </div>

        {rawAvatarImage && (
          <React.Suspense fallback={null}>
            <ImageCropper
              imageSrc={rawAvatarImage}
              onCropDone={(cropped) => { setProfile({ ...profile, avatar: cropped }); setRawAvatarImage(null); }}
              onCancel={() => setRawAvatarImage(null)}
            />
          </React.Suspense>
        )}
      </div>
  );
}
