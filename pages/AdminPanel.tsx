import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, User, ArrowLeft, Users, Briefcase, Calendar, Trash2, Edit, Shield } from 'lucide-react';
import { DB } from '../services/db';
import type { VerificationRequest, User as UserType, Specialist, Booking } from '../types';

type TabType = 'verifications' | 'users' | 'specialists' | 'bookings';

export default function AdminPanel({ currentUser }: { currentUser: any }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('verifications');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    const [reqData, userData, specData, bookData] = await Promise.all([
      DB.getVerificationRequests(),
      DB.getUsers(),
      DB.getSpecialists(),
      DB.getBookings()
    ]);
    setRequests(reqData);
    setUsers(userData);
    setSpecialists(specData);
    setBookings(bookData);
  };

  const handleApprove = async (requestId: string) => {
    await DB.approveVerification(requestId, currentUser.id);
    loadAllData();
  };

  const handleReject = async (requestId: string) => {
    await DB.rejectVerification(requestId, currentUser.id);
    loadAllData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const userDoc = await DB.getUserById(userId);
      if (userDoc) {
        await DB.updateUser({ ...userDoc, email: `deleted_${userId}@deleted.com` });
        loadAllData();
      }
    }
  };

  const handleDeleteSpecialist = async (specialistId: string) => {
    if (confirm('Are you sure you want to delete this specialist?')) {
      await DB.deleteSpecialist(specialistId);
      loadAllData();
    }
  };

  const handleUpdateUser = async () => {
    if (editingUser) {
      await DB.updateUser(editingUser);
      setEditingUser(null);
      loadAllData();
    }
  };

  const handleUpdateSpecialist = async () => {
    if (editingSpecialist) {
      await DB.updateSpecialist(editingSpecialist);
      setEditingSpecialist(null);
      loadAllData();
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Cancel this booking?')) {
      await DB.updateBookingStatus(bookingId, 'cancelled');
      loadAllData();
    }
  };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  if (!currentUser || currentUser.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-primary pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <button 
          onClick={() => navigate(-1)} 
          className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </button>

        <div className="py-8 sm:py-12 border-b border-zinc-900">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic">ADMIN<span className="text-red-500">PANEL</span></h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">Full System Control</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-6 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setActiveTab('verifications')} className={`px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap flex items-center gap-2 ${activeTab === 'verifications' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Verifications</span><span className="sm:hidden">Verify</span> ({requests.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap flex items-center gap-2 ${activeTab === 'users' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Users className="w-3 h-3 sm:w-4 sm:h-4" /> Users ({users.length})
          </button>
          <button onClick={() => setActiveTab('specialists')} className={`px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap flex items-center gap-2 ${activeTab === 'specialists' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Specialists</span><span className="sm:hidden">Specs</span> ({specialists.length})
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-red-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> Bookings ({bookings.length})
          </button>
        </div>

        {/* Verifications Tab */}
        {activeTab === 'verifications' && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 sm:px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase whitespace-nowrap ${filter === f ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  {f} ({requests.filter(r => f === 'all' || r.status === f).length})
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-12 text-center">
                  <p className="text-gray-400">No {filter !== 'all' ? filter : ''} requests</p>
                </div>
              ) : (
                filteredRequests.map(request => {
                  const user = users.find(u => u.id === request.userId);
                  return (
                    <div key={request.id} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                      <div className="flex flex-col gap-4 sm:gap-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-base sm:text-lg truncate">{user?.name || 'Unknown'}</h3>
                              <p className="text-xs sm:text-sm text-gray-400 truncate">{user?.email}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          {request.status !== 'pending' && (
                            <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap ${request.status === 'approved' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
                              {request.status.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-zinc-800 rounded-xl sm:rounded-2xl">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                            <span className="font-bold text-xs sm:text-sm truncate">{request.aadhaarUrl}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-zinc-800 rounded-xl sm:rounded-2xl">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                            <span className="font-bold text-xs sm:text-sm truncate">{request.panUrl}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-zinc-800 rounded-xl sm:rounded-2xl">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                            <span className="font-bold text-xs sm:text-sm truncate">{request.cvUrl}</span>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => handleApprove(request.id)} className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-green-500 transition-all">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Approve
                            </button>
                            <button onClick={() => handleReject(request.id)} className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-red-500 transition-all">
                              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-600/20 text-red-500' : user.role === 'worker' ? 'bg-blue-600/20 text-blue-500' : 'bg-green-600/20 text-green-500'}`}>
                          {user.role}
                        </span>
                        {user.verificationStatus && (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${user.verificationStatus === 'approved' ? 'bg-green-600/20 text-green-500' : user.verificationStatus === 'pending' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-red-600/20 text-red-500'}`}>
                            {user.verificationStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingUser(user)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-600 rounded-lg hover:bg-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specialists Tab */}
        {activeTab === 'specialists' && (
          <div className="space-y-4">
            {specialists.map(spec => (
              <div key={spec.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={spec.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={spec.name} />
                    <div>
                      <h3 className="font-bold text-lg">{spec.name}</h3>
                      <p className="text-sm text-blue-500">{spec.category}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>⭐ {spec.rating}</span>
                        <span>₹{spec.hourlyRate}/hr</span>
                        <span>{spec.projects} projects</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingSpecialist(spec)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteSpecialist(spec.id)} className="p-2 bg-red-600 rounded-lg hover:bg-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {bookings.map(booking => {
              const specialist = specialists.find(s => s.id === booking.specialistId);
              const user = users.find(u => u.id === booking.userId);
              return (
                <div key={booking.id} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{booking.id}</h3>
                        {booking.isEmergency && <span className="px-2 py-0.5 bg-red-600 rounded text-xs font-bold">EMERGENCY</span>}
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${booking.status === 'active' ? 'bg-green-600/20 text-green-500' : booking.status === 'completed' ? 'bg-blue-600/20 text-blue-500' : 'bg-red-600/20 text-red-500'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Client: {user?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">Worker: {specialist?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-400">Amount: ₹{booking.totalValue}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(booking.createdAt).toLocaleString()}</p>
                    </div>
                    {booking.status === 'active' && (
                      <button onClick={() => handleCancelBooking(booking.id)} className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-all font-bold text-sm">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full space-y-6">
              <h3 className="text-2xl font-black">Edit User</h3>
              <div className="space-y-4">
                <input value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Name" />
                <input value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Email" />
                <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm">
                  <option value="user">User</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateUser} className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all">Save</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 px-6 py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Specialist Modal */}
        {editingSpecialist && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black">Edit Specialist</h3>
              <div className="space-y-4">
                <input value={editingSpecialist.name} onChange={(e) => setEditingSpecialist({...editingSpecialist, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Name" />
                <input value={editingSpecialist.title} onChange={(e) => setEditingSpecialist({...editingSpecialist, title: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Title" />
                <input type="number" value={editingSpecialist.hourlyRate} onChange={(e) => setEditingSpecialist({...editingSpecialist, hourlyRate: Number(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Hourly Rate" />
                <input type="number" step="0.01" value={editingSpecialist.rating} onChange={(e) => setEditingSpecialist({...editingSpecialist, rating: Number(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm" placeholder="Rating" />
                <select value={editingSpecialist.availability} onChange={(e) => setEditingSpecialist({...editingSpecialist, availability: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm">
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateSpecialist} className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-all">Save</button>
                <button onClick={() => setEditingSpecialist(null)} className="flex-1 px-6 py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
