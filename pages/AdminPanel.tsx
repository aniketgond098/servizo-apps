import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, User, Users, Briefcase, Calendar, Trash2, Edit, Shield, Eye, X, Download, Image, File, CheckCircle2 } from 'lucide-react';
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
  const [viewingDoc, setViewingDoc] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') { navigate('/', { replace: true }); return; }
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
const [reqData, userData, specData, bookData] = await Promise.all([DB.getVerificationRequests(), DB.getUsers(), DB.getSpecialists(), DB.getBookings()]);
      setRequests(reqData); setUsers(userData); setSpecialists(specData);
      setBookings(bookData.sort((a, b) => {
      const statusOrder: Record<string, number> = { active: 0, cancellation_pending: 1, pending_payment: 2, pending: 3, completed: 4, cancelled: 5 };
      const sa = statusOrder[a.status] ?? 5;
      const sb = statusOrder[b.status] ?? 5;
      if (sa !== sb) return sa - sb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }));
  };

  const handleApprove = async (requestId: string) => { await DB.approveVerification(requestId, currentUser.id); loadAllData(); };
  const handleReject = async (requestId: string) => { await DB.rejectVerification(requestId, currentUser.id); loadAllData(); };
  const handleDeleteUser = async (userId: string) => { if (confirm('Delete this user?')) { const u = await DB.getUserById(userId); if (u) { await DB.updateUser({ ...u, email: `deleted_${userId}@deleted.com` }); loadAllData(); } } };
  const handleDeleteSpecialist = async (id: string) => { if (confirm('Delete this specialist?')) { await DB.deleteSpecialist(id); loadAllData(); } };
  const handleUpdateUser = async () => { if (editingUser) { await DB.updateUser(editingUser); setEditingUser(null); loadAllData(); } };
  const handleUpdateSpecialist = async () => { if (editingSpecialist) { await DB.updateSpecialist(editingSpecialist); setEditingSpecialist(null); loadAllData(); } };
  const handleCancelBooking = async (id: string) => { if (confirm('Cancel this booking?')) { await DB.updateBookingStatus(id, 'cancelled'); loadAllData(); } };
  const handleCompleteBooking = async (id: string) => { if (confirm('Mark this booking as completed? The user will be notified to leave a review.')) { await DB.completeBooking(id); loadAllData(); } };

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  if (!currentUser || currentUser.role !== 'admin') return null;

  const tabs = [
    { id: 'verifications' as TabType, label: 'Verifications', icon: Shield, count: requests.length },
    { id: 'users' as TabType, label: 'Users', icon: Users, count: users.length },
    { id: 'specialists' as TabType, label: 'Specialists', icon: Briefcase, count: specialists.length },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar, count: bookings.length },
  ];

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#000000]">Admin Panel</h1>
                <p className="text-sm text-gray-500 mt-1">Manage users, specialists, and bookings</p>
              </div>
          </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-[#000000] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Verifications */}
        {activeTab === 'verifications' && (
          <>
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === f ? 'bg-[#4169E1] text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                  {f} ({requests.filter(r => f === 'all' || r.status === f).length})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-12 text-center"><p className="text-gray-400 text-sm">No {filter !== 'all' ? filter : ''} requests</p></div>
              ) : filteredRequests.map(request => {
                const user = users.find(u => u.id === request.userId);
                return (
                  <div key={request.id} className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center text-white font-medium">{user?.name?.charAt(0) || 'U'}</div>
                        <div>
                          <h3 className="font-semibold text-[#000000]">{user?.name || 'Unknown'}</h3>
                          <p className="text-xs text-gray-400">{user?.email} · {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {request.status !== 'pending' && (
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${request.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{request.status}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        {[{ label: 'Aadhaar', value: request.aadhaarUrl, color: 'blue' }, { label: 'PAN', value: request.panUrl, color: 'purple' }, { label: 'CV', value: request.cvUrl, color: 'green' }].map(doc => {
                          const isDataUrl = doc.value && doc.value.startsWith('data:');
                          const isImage = isDataUrl && doc.value.startsWith('data:image');
                          const isPdf = isDataUrl && doc.value.startsWith('data:application/pdf');
                          const hasData = doc.value && doc.value.length > 0;
                          return (
                            <div key={doc.label} className="relative group">
                              {isImage ? (
                                <button
                                  onClick={() => setViewingDoc({ url: doc.value, label: doc.label })}
                                  className="w-full aspect-video sm:aspect-[4/3] rounded-lg border border-gray-200 overflow-hidden hover:border-blue-400 transition-colors relative cursor-pointer"
                                >
                                  <img src={doc.value} alt={doc.label} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-${doc.color}-600`}>{doc.label}</span>
                                </button>
                              ) : isPdf ? (
                                <button
                                  onClick={() => {
                                    const w = window.open();
                                    if (w) { w.document.write(`<iframe src="${doc.value}" style="width:100%;height:100%;border:none"></iframe>`); }
                                  }}
                                  className="w-full aspect-video sm:aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-blue-400 transition-colors cursor-pointer"
                                >
                                  <File className={`w-8 h-8 text-${doc.color}-600`} />
                                  <span className="text-xs font-semibold text-gray-600">{doc.label} (PDF)</span>
                                  <span className="text-[10px] text-blue-600 font-medium">Click to view</span>
                                </button>
                              ) : hasData ? (
                                <div className="w-full aspect-video sm:aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
                                  <FileText className={`w-8 h-8 text-${doc.color}-600`} />
                                  <span className="text-xs font-semibold text-gray-600">{doc.label}</span>
                                  <span className="text-[10px] text-gray-400 truncate max-w-[90%]">{doc.value.substring(0, 30)}...</span>
                                </div>
                              ) : (
                                <div className="w-full aspect-video sm:aspect-[4/3] rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1">
                                  <FileText className="w-6 h-6 text-gray-300" />
                                  <span className="text-[10px] text-gray-400">{doc.label}</span>
                                  <span className="text-[10px] text-gray-300">Not provided</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(request.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(request.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center text-white font-medium">{user.name.charAt(0)}</div>
                  <div>
                    <h3 className="font-semibold text-[#000000] text-sm">{user.name}</h3>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${user.role === 'admin' ? 'bg-red-50 text-red-500' : user.role === 'worker' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{user.role}</span>
                      {user.verificationStatus && <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${user.verificationStatus === 'approved' ? 'bg-green-50 text-green-600' : user.verificationStatus === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>{user.verificationStatus}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser(user)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specialists */}
        {activeTab === 'specialists' && (
          <div className="space-y-3">
            {specialists.map(spec => (
              <div key={spec.id} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={spec.avatar} className="w-12 h-12 rounded-full object-cover" alt={spec.name} />
                  <div>
                    <h3 className="font-semibold text-[#000000]">{spec.name}</h3>
                    <p className="text-xs text-[#4169E1] font-medium">{spec.category}</p>
                    <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                      <span>Rating: {spec.rating}</span><span>₹{spec.hourlyRate}/visit</span><span>{spec.projects} projects</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingSpecialist(spec)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteSpecialist(spec.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.map(booking => {
              const specialist = specialists.find(s => s.id === booking.specialistId);
              const user = users.find(u => u.id === booking.userId);
              return (
                <div key={booking.id} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#000000] text-sm">{booking.id}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${booking.status === 'active' ? 'bg-green-50 text-green-600' : booking.status === 'cancellation_pending' ? 'bg-orange-50 text-orange-600' : booking.status === 'pending_payment' ? 'bg-amber-50 text-amber-600' : booking.status === 'completed' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>{booking.status === 'cancellation_pending' ? 'Cancel Requested' : booking.status === 'pending_payment' ? 'Awaiting Payment' : booking.status}</span>
                      </div>
                    <p className="text-xs text-gray-400">Client: {user?.name || 'Unknown'} · Worker: {specialist?.name || 'Unknown'} · ₹{booking.totalValue}</p>
                    <p className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleString()}</p>
                    {booking.status === 'cancellation_pending' && booking.cancellationReason && (
                      <p className="text-xs text-orange-600 mt-1">Cancel reason: {booking.cancellationReason}</p>
                    )}
                  </div>
                  {booking.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleCompleteBooking(booking.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button onClick={() => handleCancelBooking(booking.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">Cancel</button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
              <h3 className="text-xl font-bold text-[#000000]">Edit User</h3>
              <input value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Name" />
              <input value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Email" />
              <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm">
                <option value="user">User</option><option value="worker">Worker</option><option value="admin">Admin</option>
              </select>
              <div className="flex gap-3">
                <button onClick={handleUpdateUser} className="flex-1 px-4 py-2.5 bg-[#000000] text-white rounded-lg font-semibold text-sm">Save</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

          {/* Edit Specialist Modal */}
            {editingSpecialist && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-[#000000]">Edit Specialist</h3>
                <input value={editingSpecialist.name} onChange={(e) => setEditingSpecialist({...editingSpecialist, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Name" />
                <input value={editingSpecialist.title} onChange={(e) => setEditingSpecialist({...editingSpecialist, title: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Title" />
                <input type="number" value={editingSpecialist.hourlyRate} onChange={(e) => setEditingSpecialist({...editingSpecialist, hourlyRate: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Rate" />
                <input type="number" step="0.01" value={editingSpecialist.rating} onChange={(e) => setEditingSpecialist({...editingSpecialist, rating: Number(e.target.value)})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm" placeholder="Rating" />
                <select value={editingSpecialist.availability} onChange={(e) => setEditingSpecialist({...editingSpecialist, availability: e.target.value as any})} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm">
                  <option value="available">Available</option><option value="busy">Busy</option><option value="unavailable">Unavailable</option>
                </select>
                <div className="flex gap-3">
                  <button onClick={handleUpdateSpecialist} className="flex-1 px-4 py-2.5 bg-[#000000] text-white rounded-lg font-semibold text-sm">Save</button>
                  <button onClick={() => setEditingSpecialist(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Document Viewer Modal */}
          {viewingDoc && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1100] flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
              <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-lg">{viewingDoc.label} Document</h3>
                  <div className="flex items-center gap-2">
                    <a
                      href={viewingDoc.url}
                      download={`${viewingDoc.label.toLowerCase()}_document`}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </a>
                    <button onClick={() => setViewingDoc(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl overflow-hidden">
                  {viewingDoc.url.startsWith('data:application/pdf') ? (
                    <iframe src={viewingDoc.url} className="w-full h-[80vh]" />
                  ) : (
                    <img src={viewingDoc.url} alt={viewingDoc.label} className="w-full h-auto max-h-[80vh] object-contain" />
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
