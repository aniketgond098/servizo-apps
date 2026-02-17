import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, MessageCircle, Calendar, AlertTriangle, CheckCircle, X, BellOff, Sparkles } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Notification } from '../types';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    setNotifications(await DB.getNotifications(currentUser.id));
    setLoading(false);
  };

  const handleMarkAsRead = async (id: string) => { await DB.markNotificationAsRead(id); loadNotifications(); };
  const handleMarkAllAsRead = async () => { if (!currentUser) return; await DB.markAllNotificationsAsRead(currentUser.id); loadNotifications(); };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-5 h-5" />;
      case 'booking': return <Calendar className="w-5 h-5" />;
      case 'emergency_booking': return <AlertTriangle className="w-5 h-5" />;
      case 'booking_status': return <CheckCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getIconStyle = (type: string, read: boolean) => {
    if (read) return 'bg-gray-100 text-gray-400';
    switch (type) {
      case 'message': return 'bg-emerald-50 text-emerald-600';
      case 'booking': return 'bg-blue-50 text-[#1a73e8]';
      case 'emergency_booking': return 'bg-red-50 text-red-500';
      case 'booking_status': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#1a2b49]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1a2b49]">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="px-4 py-2 bg-[#1a2b49] text-white rounded-lg text-xs font-semibold hover:bg-[#0f1d35] transition-colors">
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        {notifications.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-[#1a2b49] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-[#1a2b49] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  filter === 'unread' ? 'bg-white/20 text-white' : 'bg-[#1a73e8] text-white'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#1a2b49] rounded-full animate-spin"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-1">
            {filteredNotifications.map((notif, idx) => (
              <div
                key={notif.id}
                className={`group relative flex items-start gap-3.5 p-4 rounded-xl transition-all cursor-default ${
                  notif.read
                    ? 'hover:bg-gray-50'
                    : 'bg-blue-50/40 hover:bg-blue-50/60'
                }`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Unread indicator */}
                {!notif.read && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#1a73e8]"></div>
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle(notif.type, notif.read)}`}>
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`text-sm leading-snug ${notif.read ? 'font-medium text-gray-600' : 'font-semibold text-[#1a2b49]'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white rounded-lg transition-all flex-shrink-0"
                        title="Mark as read"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-gray-400 font-medium">{formatTime(notif.createdAt)}</span>
                    {notif.link && (
                      <Link to={notif.link} className="text-[11px] font-semibold text-[#1a73e8] hover:underline">
                        View Details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <BellOff className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-[#1a2b49] mb-1">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-gray-400 mb-5 text-center max-w-xs">
              {filter === 'unread'
                ? "You've read all your notifications"
                : "When you receive bookings, messages, or updates they'll appear here"}
            </p>
            {filter === 'unread' ? (
              <button onClick={() => setFilter('all')} className="px-5 py-2.5 bg-gray-100 text-[#1a2b49] rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                View All Notifications
              </button>
            ) : (
              <Link to="/listing" className="px-5 py-2.5 bg-[#1a2b49] text-white rounded-lg text-xs font-semibold hover:bg-[#0f1d35] transition-colors inline-block">
                Browse Specialists
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
