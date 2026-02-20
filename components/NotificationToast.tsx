import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AuthService } from '../services/auth';
import type { Notification as AppNotification } from '../types';
import { Bell, X, AlertTriangle, CheckCircle, Info, Calendar, Star, CreditCard, ShieldCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typeIcons: Record<string, React.ReactNode> = {
  booking: <Calendar className="w-5 h-5 text-blue-500" />,
  payment: <CreditCard className="w-5 h-5 text-green-500" />,
  review: <Star className="w-5 h-5 text-yellow-500" />,
  review_request: <Star className="w-5 h-5 text-amber-500" />,
  verification: <ShieldCheck className="w-5 h-5 text-purple-500" />,
  cancellation: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  booking_status: <CheckCircle className="w-5 h-5 text-purple-500" />,
  system: <Info className="w-5 h-5 text-gray-500" />,
  emergency: <AlertTriangle className="w-5 h-5 text-red-500" />,
  emergency_booking: <AlertTriangle className="w-5 h-5 text-red-500" />,
  message: <MessageCircle className="w-5 h-5 text-emerald-500" />,
};

interface ToastItem {
  notification: AppNotification;
  removing: boolean;
}

export default function NotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Use a ref so the onSnapshot callback always has the latest seen IDs
  // without causing the listener to re-subscribe on every change.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
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
    // Mark as removing to trigger slide-out animation
    setToasts(prev => prev.map(t => t.notification.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.notification.id !== id));
    }, 350);
  }, []);

  useEffect(() => {
    requestBrowserPermission();

    const user = AuthService.getCurrentUser();
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initialLoadDoneRef.current) {
        // On initial load, seed seen IDs from existing unread notifications
        snapshot.docs.forEach(doc => seenIdsRef.current.add(doc.id));
        initialLoadDoneRef.current = true;
        return;
      }

      // Only show toasts for docs that were added (not modified/removed)
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !seenIdsRef.current.has(change.doc.id)) {
          const notif = { ...change.doc.data(), id: change.doc.id } as AppNotification;
          seenIdsRef.current.add(notif.id);

          showBrowserNotification(notif);
          setToasts(prev => [...prev, { notification: notif, removing: false }]);

          // Auto-dismiss after 6 seconds
          setTimeout(() => dismissToast(notif.id), 6000);
        }
      });
    });

    return () => unsubscribe();
  // Only run once on mount — refs don't need to be deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToastClick = (notif: AppNotification) => {
    dismissToast(notif.id);
    if (notif.link) navigate(notif.link);
    else navigate('/notifications');
  };

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(calc(100% + 1rem)); opacity: 0; }
          to   { transform: translateX(0);               opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0);               opacity: 1; }
          to   { transform: translateX(calc(100% + 1rem)); opacity: 0; }
        }
        .toast-enter {
          animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .toast-exit {
          animation: toastSlideOut 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
      `}</style>
      <div className="fixed top-20 right-4 z-[2000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(({ notification, removing }) => (
          <div
            key={notification.id}
            onClick={() => handleToastClick(notification)}
            className={`pointer-events-auto cursor-pointer bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 ${removing ? 'toast-exit' : 'toast-enter'}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                {typeIcons[notification.type] || <Bell className="w-5 h-5 text-[#000000]" />}
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
      </div>
    </>
  );
}
