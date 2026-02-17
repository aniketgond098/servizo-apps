import React, { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthService } from '../services/auth';
import type { Notification as AppNotification } from '../types';
import { Bell, X, AlertTriangle, CheckCircle, Info, Calendar, Star, CreditCard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, React.ReactNode> = {
  booking: <Calendar className="w-5 h-5 text-blue-500" />,
  payment: <CreditCard className="w-5 h-5 text-green-500" />,
  review: <Star className="w-5 h-5 text-yellow-500" />,
  verification: <ShieldCheck className="w-5 h-5 text-purple-500" />,
  cancellation: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  system: <Info className="w-5 h-5 text-gray-500" />,
  emergency: <AlertTriangle className="w-5 h-5 text-red-500" />,
};

interface ToastItem {
  notification: AppNotification;
  visible: boolean;
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const requestBrowserPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showBrowserNotification = useCallback((notif: AppNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotif = new window.Notification(notif.title, {
        body: notif.message,
        icon: '/favicon.ico',
        tag: notif.id,
        requireInteraction: false,
      });
      browserNotif.onclick = () => {
        window.focus();
        if (notif.link) navigate(notif.link);
        else navigate('/notifications');
        browserNotif.close();
      };
    }
  }, [navigate]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.notification.id === id ? { ...t, visible: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.notification.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    requestBrowserPermission();

    const user = AuthService.getCurrentUser();
    if (!user) return;

    // Track initial load to avoid toasting existing notifications
    let initialLoad = true;

    const unsubscribe = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const userNotifs = snapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id } as AppNotification))
          .filter(n => n.userId === user.id && !n.read)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (initialLoad) {
          // On initial load, just mark existing IDs as seen
          setSeenIds(new Set(userNotifs.map(n => n.id)));
          initialLoad = false;
          return;
        }

        // Find new notifications we haven't seen
        const newNotifs = userNotifs.filter(n => !seenIds.has(n.id));

        if (newNotifs.length > 0) {
          setSeenIds(prev => {
            const next = new Set(prev);
            newNotifs.forEach(n => next.add(n.id));
            return next;
          });

          // Show toast + browser notification for each new one
          newNotifs.forEach(notif => {
            showBrowserNotification(notif);
            setToasts(prev => [...prev, { notification: notif, visible: true }]);

            // Auto-dismiss after 6 seconds
            setTimeout(() => dismissToast(notif.id), 6000);
          });
        }
      }
    );

    return () => unsubscribe();
  }, [requestBrowserPermission, showBrowserNotification, dismissToast, seenIds]);

  const handleToastClick = (notif: AppNotification) => {
    dismissToast(notif.id);
    if (notif.link) navigate(notif.link);
    else navigate('/notifications');
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[2000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(({ notification, visible }) => (
        <div
          key={notification.id}
          onClick={() => handleToastClick(notification)}
          className={`pointer-events-auto cursor-pointer bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3 transition-all duration-300 ease-out ${
            visible
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
          }`}
          style={{
            animation: visible ? 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : undefined,
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              {typeIcons[notification.type] || <Bell className="w-5 h-5 text-[#1a2b49]" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
            <p className="text-[10px] text-gray-400 mt-1">Just now</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(notification.id);
            }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
