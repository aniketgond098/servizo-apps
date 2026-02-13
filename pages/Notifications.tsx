import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, MessageCircle, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { AuthService } from '../services/auth';
import { DB } from '../services/db';
import { Notification } from '../types';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = AuthService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    const notifs = await DB.getNotifications(currentUser.id);
    setNotifications(notifs);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await DB.markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    await DB.markAllNotificationsAsRead(currentUser.id);
    loadNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'emergency_booking':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'booking_status':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="fixed top-20 left-4 sm:left-6 z-40 p-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full hover:bg-zinc-800 transition-all group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <div className="pt-8 sm:pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
              <span className="text-blue-500">Notifications</span>
            </h1>
          </div>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all"
            >
              Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-zinc-900/30 border rounded-2xl p-6 transition-all ${
                  notif.read ? 'border-zinc-800' : 'border-blue-500/40 bg-blue-500/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.read ? 'bg-zinc-800' : 'bg-blue-600/20'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base">{notif.title}</h3>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1 hover:bg-zinc-800 rounded-full transition-all"
                          title="Mark as read"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No notifications yet</p>
            <Link to="/listing" className="inline-block mt-4 px-6 py-3 bg-blue-600 rounded-full text-sm font-bold hover:bg-blue-500 transition-all">
              Browse Specialists
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
