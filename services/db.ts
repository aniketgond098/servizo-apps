import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Specialist, Booking, User, Review, Message, MessageAttachment, VerificationRequest, Notification, Call, IceCandidate, ExtraCharge, CallFeedback } from '../types';
import { seedNewWorkers } from './seedWorkers';
import { buildBillHTML } from '../utils/generateBill';

const INITIAL_SPECIALISTS: Specialist[] = [
  {
    id: 'rajesh-k',
    name: 'Rajesh Kumar',
    title: 'Principal Systems Architect',
    category: 'Automation',
    description: 'Specializing in next-gen industrial infrastructure and home automation.',
    tags: ['Sustainable', 'Luxe', 'Vastu'],
    hourlyRate: 2500,
    rating: 4.98,
    experience: 12,
    projects: 2400,
    location: 'Bandra West, Mumbai',
    lat: 19.0544,
    lng: 72.8402,
    avatar: 'https://i.pravatar.cc/150?u=rajesh',
    skills: ['IoT', 'Solar', 'HVAC'],
    credentials: ['IIT Bombay', 'Licensed EE'],
    availability: 'available',
    verified: true,
    backgroundChecked: true,
    topRated: true,
    fastResponder: true,
    insuranceVerified: true
  },
  {
    id: 'priya-s',
    name: 'Priya Sharma',
    title: 'Master Mechanic & Restoration',
    category: 'Mechanical',
    description: 'Expert in high-end luxury vehicle maintenance and mechanical engineering.',
    tags: ['Automotive', 'Precision'],
    hourlyRate: 1800,
    rating: 4.92,
    experience: 9,
    projects: 850,
    location: 'Worli, Mumbai',
    lat: 19.0176,
    lng: 72.8161,
    avatar: 'https://i.pravatar.cc/150?u=priya',
    skills: ['Engine Tuning', 'Restoration'],
    credentials: ['ASE Certified', 'Luxury Brand Master'],
    availability: 'busy',
    verified: true,
    backgroundChecked: true,
    topRated: true
  }
];

export class DB {
  static async init() {
    try {
      // Run both flag checks in parallel — 2 reads total, no full collection scans
      const [initFlag, seedFlag] = await Promise.all([
        getDoc(doc(db, '_meta', 'appInit')),
        getDoc(doc(db, '_meta', 'workerSeedV2')),
      ]);

      if (!initFlag.exists()) {
        const specialistWrites = INITIAL_SPECIALISTS.map(s =>
          setDoc(doc(db, 'specialists', s.id), s)
        );
        const demoUsers: User[] = [
          { id: 'ADMIN-001', email: 'admin@servizo.in', password: 'admin', name: 'System Administrator', role: 'admin', avatar: 'https://i.pravatar.cc/150?u=admin', createdAt: new Date().toISOString(), favorites: [], theme: 'dark' },
          { id: 'WORKER-001', email: 'worker@servizo.in', password: 'worker123', name: 'Demo Worker', role: 'worker', avatar: 'https://i.pravatar.cc/150?u=worker', createdAt: new Date().toISOString(), favorites: [], theme: 'dark' },
          { id: 'USER-001', email: 'user@servizo.in', password: 'user123', name: 'Demo User', role: 'user', avatar: 'https://i.pravatar.cc/150?u=user', createdAt: new Date().toISOString(), favorites: [], theme: 'dark' },
        ];
        const userWrites = demoUsers.map(u => setDoc(doc(db, 'users', u.id), u));
        await Promise.all([...specialistWrites, ...userWrites]);
        await setDoc(doc(db, '_meta', 'appInit'), { seededAt: new Date().toISOString() });
      }

      if (!seedFlag.exists()) {
        await seedNewWorkers();
        await setDoc(doc(db, '_meta', 'workerSeedV2'), { seededAt: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  static async getSpecialists(): Promise<Specialist[]> {
    try {
      const snapshot = await getDocs(collection(db, 'specialists'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Specialist));
    } catch (error) {
      console.error('Get specialists error:', error);
      return [];
    }
  }

  static async updateSpecialist(specialist: Specialist) {
    try {
      await setDoc(doc(db, 'specialists', specialist.id), specialist);
    } catch (error) {
      console.error('Update specialist error:', error);
    }
  }

  // Real-time listener for a single specialist document
  static onSpecialist(id: string, callback: (specialist: Specialist) => void): () => void {
    return onSnapshot(doc(db, 'specialists', id), (snap) => {
      if (snap.exists()) callback({ ...snap.data(), id: snap.id } as Specialist);
    }, (err) => console.error('onSpecialist error:', err));
  }

  // Set a busy window: marks the worker busy from `from` to `until` (ISO strings)
  // Pass null/null to clear the window and restore availability
  static async setAvailabilityWindow(
    specialistId: string,
    from: string | null,
    until: string | null
  ) {
    try {
      const now = new Date();
      const isBusy = from && until && new Date(from) <= now && now < new Date(until);
      const newStatus = isBusy ? 'busy' : 'available';
      await updateDoc(doc(db, 'specialists', specialistId), {
        busyFrom: from ?? null,
        busyUntil: until ?? null,
        availability: newStatus,
      });
      // If the worker just became available, fire notifications to watchers
      if (newStatus === 'available') {
        const snap = await getDoc(doc(db, 'specialists', specialistId));
        const name = snap.exists() ? (snap.data().name as string) : 'Your worker';
        await this.notifyAvailabilityWatchers(specialistId, name);
      }
    } catch (error) {
      console.error('setAvailabilityWindow error:', error);
    }
  }

  static async deleteSpecialist(id: string) {
    try {
      await deleteDoc(doc(db, 'specialists', id));
    } catch (error) {
      console.error('Delete specialist error:', error);
    }
  }

  static async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  static async saveUser(user: User) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      console.error('Save user error:', error);
    }
  }

  static async getUserById(id: string): Promise<User | undefined> {
    try {
      const docSnap = await getDoc(doc(db, 'users', id));
      return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as User : undefined;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return undefined;
    }
  }

  static async updateUser(user: User) {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      console.error('Update user error:', error);
    }
  }

  static async getBookings(): Promise<Booking[]> {
    try {
      const snapshot = await getDocs(collection(db, 'bookings'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
    } catch (error) {
      console.error('Get bookings error:', error);
      return [];
    }
  }

  static async createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    try {
      const newBooking: Booking = {
          ...booking,
          id: `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          status: 'pending_worker_acceptance'
        };
        await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
        
          // Get specialist and user info in parallel
          const [specialists, user] = await Promise.all([this.getSpecialists(), this.getUserById(booking.userId)]);
          const specialist = specialists.find(s => s.id === booking.specialistId);
          
          // Notify worker of new booking request (not yet confirmed)
          const notifs: Promise<any>[] = [];
          if (specialist?.userId) {
            notifs.push(this.createNotification({
              userId: specialist.userId,
              type: 'booking',
              title: 'New Booking Request',
              message: `${user?.name || 'A user'} has requested your services. Please accept or decline.`,
              link: '/worker-dashboard',
              bookingId: newBooking.id
            }));
          }
          // Notify user that request is pending worker acceptance
          notifs.push(this.createNotification({
            userId: booking.userId,
            type: 'booking',
            title: 'Booking Request Sent',
            message: `Your request has been sent to ${specialist?.name || 'the specialist'}. Waiting for them to accept.`,
            link: '/booking',
            bookingId: newBooking.id
          }));
          await Promise.all(notifs);
      
      return newBooking;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  static async getActiveBooking(userId?: string): Promise<Booking | null> {
    try {
      const constraints = userId
        ? [where('userId', '==', userId), where('status', '==', 'active')]
        : [where('status', '==', 'active')];
      const q = query(collection(db, 'bookings'), ...constraints);
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      return { ...d.data(), id: d.id } as Booking;
    } catch (error) {
      console.error('Get active booking error:', error);
      return null;
    }
  }

  static async updateBookingStatus(id: string, status: 'completed' | 'cancelled') {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      
      // Get booking details
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        const specialists = await this.getSpecialists();
        const specialist = specialists.find(s => s.id === booking.specialistId);

          // Set worker back to available
          if (specialist) {
            await updateDoc(doc(db, 'specialists', specialist.id), { availability: 'available' });
          }
          
          // Notify user about status change
        await this.createNotification({
          userId: booking.userId,
          type: 'booking_status',
          title: `Booking ${status === 'completed' ? 'Completed' : 'Cancelled'}`,
          message: `Your booking with ${specialist?.name || 'specialist'} has been ${status}.`,
          link: '/dashboard',
          bookingId: id
        });
      }
    } catch (error) {
      console.error('Update booking status error:', error);
    }
  }

  static async completeBooking(id: string) {
    try {
      const completedAt = new Date().toISOString();
      await updateDoc(doc(db, 'bookings', id), { status: 'completed', completedAt });
      
      const bookingDoc = await getDoc(doc(db, 'bookings', id));
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        const specialists = await this.getSpecialists();
        const specialist = specialists.find(s => s.id === booking.specialistId);
        
        // Increment specialist's project count and set available
          if (specialist) {
            await updateDoc(doc(db, 'specialists', specialist.id), {
              projects: (specialist.projects || 0) + 1,
              availability: 'available'
            });
          }

        // Notify user: booking completed
        await this.createNotification({
          userId: booking.userId,
          type: 'booking_status',
          title: 'Booking Completed',
          message: `Your booking with ${specialist?.name || 'specialist'} has been marked as completed.`,
          link: '/dashboard',
          bookingId: id
        });

        // Notify user: leave a review
        await this.createNotification({
          userId: booking.userId,
          type: 'review_request',
          title: 'Leave a Review',
          message: `How was your experience with ${specialist?.name || 'the specialist'}? Your feedback helps others.`,
          link: `/review/${id}`,
          bookingId: id
        });

        // Notify worker: job completed
        if (specialist?.userId) {
          await this.createNotification({
            userId: specialist.userId,
            type: 'booking_status',
            title: 'Job Completed',
            message: `Your job for booking ${id} has been marked as completed. Great work!`,
            link: '/worker-dashboard',
            bookingId: id
          });
        }
      }
    } catch (error) {
      console.error('Complete booking error:', error);
    }
  }

  static async getReviewByBookingAndUser(bookingId: string, userId: string): Promise<Review | null> {
    try {
      const reviews = await this.getReviews();
      return reviews.find(r => r.bookingId === bookingId && r.userId === userId) || null;
    } catch (error) {
      console.error('Get review by booking and user error:', error);
      return null;
    }
  }

  static async updateBooking(booking: Booking) {
    try {
      await setDoc(doc(db, 'bookings', booking.id), booking);
    } catch (error) {
      console.error('Update booking error:', error);
    }
  }

  static async getReviews(): Promise<Review[]> {
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
    } catch (error) {
      console.error('Get reviews error:', error);
      return [];
    }
  }

  static async getReviewsBySpecialist(specialistId: string): Promise<Review[]> {
    try {
      const reviews = await this.getReviews();
      return reviews.filter(r => r.specialistId === specialistId);
    } catch (error) {
      console.error('Get reviews by specialist error:', error);
      return [];
    }
  }

  static async createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    try {
      // Enforce one review per user per booking
      const existing = await this.getReviewByBookingAndUser(review.bookingId, review.userId);
      if (existing) {
        throw new Error('You have already reviewed this booking.');
      }

      const newReview: Review = {
        ...review,
        id: `REV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'reviews', newReview.id), newReview);
      
      const specialistReviews = await this.getReviewsBySpecialist(review.specialistId);
      const avgRating = (specialistReviews.reduce((sum, r) => sum + r.rating, 0) + review.rating) / (specialistReviews.length + 1);
      
      const specialistDoc = await getDoc(doc(db, 'specialists', review.specialistId));
      if (specialistDoc.exists()) {
        await updateDoc(doc(db, 'specialists', review.specialistId), {
          rating: Math.round(avgRating * 100) / 100
        });
      }
      
      return newReview;
    } catch (error) {
      console.error('Create review error:', error);
      throw error;
    }
  }

  static async getMessages(): Promise<Message[]> {
    try {
      const snapshot = await getDocs(collection(db, 'messages'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
    } catch (error) {
      console.error('Get messages error:', error);
      return [];
    }
  }

  static async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const [q1, q2] = [
        query(collection(db, 'messages'), where('senderId', '==', userId1), where('receiverId', '==', userId2)),
        query(collection(db, 'messages'), where('senderId', '==', userId2), where('receiverId', '==', userId1)),
      ];
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const messages = [
        ...snap1.docs.map(d => ({ ...d.data(), id: d.id } as Message)),
        ...snap2.docs.map(d => ({ ...d.data(), id: d.id } as Message)),
      ];
      return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Get conversation error:', error);
      return [];
    }
  }

  static async sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'read'>, senderName?: string): Promise<Message> {
    try {
      const newMessage: Message = {
        ...message,
        id: `MSG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        read: false,
        messageType: message.messageType || 'text',
          ...(message.attachment ? { attachment: message.attachment } : {})
        };
      // Fire-and-forget: save message + notification in parallel
      const saveMsg = setDoc(doc(db, 'messages', newMessage.id), newMessage);
      const saveNotif = this.createNotification({
        userId: message.receiverId,
        type: 'message',
        title: 'New Message',
        message: `${senderName || 'Someone'} sent you a message.`,
        link: `/chat/${message.senderId}`
      });
      await Promise.all([saveMsg, saveNotif]);
      return newMessage;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(userId: string, otherUserId: string) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('senderId', '==', otherUserId),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(d => updateDoc(doc(db, 'messages', d.id), { read: true }));
      await Promise.all(updates);
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'messages'),
        where('receiverId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  static async getVerificationRequests(): Promise<VerificationRequest[]> {
    try {
      const snapshot = await getDocs(collection(db, 'verificationRequests'));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as VerificationRequest));
    } catch (error) {
      console.error('Get verification requests error:', error);
      return [];
    }
  }

  static async createVerificationRequest(userId: string, aadhaarUrl: string, panUrl: string, cvUrl: string): Promise<VerificationRequest> {
    try {
      const newRequest: VerificationRequest = {
        id: `VER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        userId,
        aadhaarUrl,
        panUrl,
        cvUrl,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'verificationRequests', newRequest.id), newRequest);
      
      const user = await this.getUserById(userId);
      if (user) {
        await this.updateUser({
          ...user,
          verificationStatus: 'pending',
          aadhaarUrl,
          panUrl
        });
      }
      return newRequest;
    } catch (error) {
      console.error('Create verification request error:', error);
      throw error;
    }
  }

  static async approveVerification(requestId: string, adminId: string) {
    try {
      const requestDoc = await getDoc(doc(db, 'verificationRequests', requestId));
      if (requestDoc.exists()) {
        const request = requestDoc.data() as VerificationRequest;
        await updateDoc(doc(db, 'verificationRequests', requestId), {
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId
        });
        
        const user = await this.getUserById(request.userId);
        if (user) {
          await this.updateUser({ ...user, verificationStatus: 'approved' });
          
          // Notify the worker
          await this.createNotification({
            userId: request.userId,
            type: 'booking_status',
            title: 'Application Approved',
            message: 'Your documents have been verified. You can now create your professional profile and start receiving bookings!',
            link: '/document-upload'
          });
        }
      }
    } catch (error) {
      console.error('Approve verification error:', error);
    }
  }

  static async rejectVerification(requestId: string, adminId: string) {
    try {
      const requestDoc = await getDoc(doc(db, 'verificationRequests', requestId));
      if (requestDoc.exists()) {
        const request = requestDoc.data() as VerificationRequest;
        await updateDoc(doc(db, 'verificationRequests', requestId), {
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId
        });
        
        const user = await this.getUserById(request.userId);
        if (user) {
          await this.updateUser({ ...user, verificationStatus: 'rejected' });
          
          // Notify the worker
          await this.createNotification({
            userId: request.userId,
            type: 'booking_status',
            title: 'Application Rejected',
            message: 'Your document verification was not approved. Please re-upload valid documents to try again.',
            link: '/document-upload'
          });
        }
      }
    } catch (error) {
      console.error('Reject verification error:', error);
    }
  }

  // Notifications
  static async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    try {
      const newNotification: Notification = {
        ...notification,
        id: `NOTIF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        read: false
      };
      await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
      return newNotification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
      return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  }

  static async getUnreadNotifications(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Get unread notifications error:', error);
      return 0;
    }
  }

  static async markNotificationAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }

  static async markAllNotificationsAsRead(userId: string) {
    try {
      const notifications = await this.getNotifications(userId);
      const updates = notifications
        .filter(n => !n.read)
        .map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(updates);
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
    }
  }

  static async updateWorkerLocation(bookingId: string, lat: number, lng: number) {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        workerLat: lat,
        workerLng: lng,
        workerLastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update worker location error:', error);
    }
  }

  // Photo Evidence
  static async uploadPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const isImage = file.type.startsWith('image/');
        resolve(canvas.toDataURL(isImage ? 'image/jpeg' : file.type, 0.7));
      };
      img.onerror = () => {
        // Not an image (e.g. PDF/doc) — fall back to raw base64
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  }

  static async addProblemPhotos(bookingId: string, photos: string[]) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        await updateDoc(doc(db, 'bookings', bookingId), {
          problemPhotos: [...(booking.problemPhotos || []), ...photos]
        });
      }
    } catch (error) {
      console.error('Add problem photos error:', error);
    }
  }

  static async addBeforePhotos(bookingId: string, photos: string[]) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        await updateDoc(doc(db, 'bookings', bookingId), {
          beforePhotos: [...(booking.beforePhotos || []), ...photos]
        });
      }
    } catch (error) {
      console.error('Add before photos error:', error);
    }
  }

    static async addAfterPhotos(bookingId: string, photos: string[]) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (bookingDoc.exists()) {
        const booking = bookingDoc.data() as Booking;
        await updateDoc(doc(db, 'bookings', bookingId), {
          afterPhotos: [...(booking.afterPhotos || []), ...photos]
        });
      }
    } catch (error) {
      console.error('Add after photos error:', error);
    }
  }

  // ─── Call Signaling ───

  static async createCall(call: Omit<Call, 'id' | 'createdAt'>): Promise<Call> {
    try {
      const newCall: Call = {
        ...call,
        id: `CALL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      const data: Record<string, any> = {
        id: newCall.id,
        callerId: newCall.callerId,
        callerName: newCall.callerName,
        receiverId: newCall.receiverId,
        receiverName: newCall.receiverName,
        type: newCall.type,
        status: newCall.status,
        createdAt: newCall.createdAt,
      };
      if (newCall.offer) data.offer = newCall.offer;
      if (newCall.answer) data.answer = newCall.answer;
      await setDoc(doc(db, 'calls', newCall.id), data);
      return newCall;
    } catch (error) {
      console.error('Create call error:', error);
      throw error;
    }
  }

  static async updateCall(callId: string, updates: Partial<Call>) {
    try {
      // Filter out undefined values
      const cleanUpdates: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) cleanUpdates[key] = value;
      }
      await updateDoc(doc(db, 'calls', callId), cleanUpdates);
    } catch (error) {
      console.error('Update call error:', error);
    }
  }

  static async getCall(callId: string): Promise<Call | null> {
    try {
      const snap = await getDoc(doc(db, 'calls', callId));
      return snap.exists() ? (snap.data() as Call) : null;
    } catch (error) {
      console.error('Get call error:', error);
      return null;
    }
  }

  static onCallUpdated(callId: string, callback: (call: Call | null) => void): () => void {
    return onSnapshot(doc(db, 'calls', callId), (snap) => {
      callback(snap.exists() ? (snap.data() as Call) : null);
    });
  }

  static onIncomingCall(userId: string, callback: (call: Call) => void): () => void {
    const q = query(collection(db, 'calls'), where('receiverId', '==', userId), where('status', '==', 'ringing'));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          callback(change.doc.data() as Call);
        }
      });
    });
  }

  static async addIceCandidate(callId: string, fromUserId: string, candidate: RTCIceCandidate) {
    try {
      const id = `ICE-${Math.random().toString(36).substr(2, 12)}`;
      await setDoc(doc(db, 'calls', callId, 'iceCandidates', id), {
        id,
        callId,
        fromUserId,
        candidate: JSON.stringify(candidate.toJSON()),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Add ICE candidate error:', error);
    }
  }

  static onIceCandidates(callId: string, excludeUserId: string, callback: (candidate: RTCIceCandidate) => void): () => void {
    return onSnapshot(collection(db, 'calls', callId, 'iceCandidates'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.fromUserId !== excludeUserId) {
            try {
              const parsed = JSON.parse(data.candidate);
              callback(new RTCIceCandidate(parsed));
            } catch (e) {
              console.error('Failed to parse ICE candidate:', e);
            }
          }
        }
      });
    });
  }

  // ─── Extra Charges & Payment ───

  static async addExtraCharge(bookingId: string, description: string, amount: number): Promise<ExtraCharge> {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) throw new Error('Booking not found');
      const booking = bookingDoc.data() as Booking;
      const charge: ExtraCharge = {
        id: `EC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description,
        amount,
        addedAt: new Date().toISOString()
      };
      const extraCharges = [...(booking.extraCharges || []), charge];
      const finalTotal = booking.totalValue + extraCharges.reduce((sum, c) => sum + c.amount, 0);
      await updateDoc(doc(db, 'bookings', bookingId), { extraCharges, finalTotal });
      return charge;
    } catch (error) {
      console.error('Add extra charge error:', error);
      throw error;
    }
  }

  static async removeExtraCharge(bookingId: string, chargeId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      const extraCharges = (booking.extraCharges || []).filter(c => c.id !== chargeId);
      const finalTotal = booking.totalValue + extraCharges.reduce((sum, c) => sum + c.amount, 0);
      await updateDoc(doc(db, 'bookings', bookingId), { extraCharges, finalTotal });
    } catch (error) {
      console.error('Remove extra charge error:', error);
    }
  }

  static async submitForPayment(bookingId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      const finalTotal = (booking.finalTotal || booking.totalValue);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'pending_payment',
        finalTotal,
        paymentStatus: 'pending'
      });

      // Notify user to approve and pay
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      await this.createNotification({
        userId: booking.userId,
        type: 'booking_status',
        title: 'Payment Required',
        message: `${specialist?.name || 'Worker'} has completed the work. Please review the charges and make payment.`,
        link: '/booking',
        bookingId
      });
    } catch (error) {
      console.error('Submit for payment error:', error);
    }
  }

  static async markBookingPaid(bookingId: string) {
    try {
      const paidAt = new Date().toISOString();
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        paymentStatus: 'paid',
        paidAt,
        completedAt: paidAt
      });

        const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingDoc.exists()) {
          const booking = { ...bookingDoc.data(), id: bookingId, paidAt } as Booking;
          const [specialists, user] = await Promise.all([this.getSpecialists(), this.getUserById(booking.userId)]);
          const specialist = specialists.find(s => s.id === booking.specialistId);

            if (specialist) {
              await updateDoc(doc(db, 'specialists', specialist.id), {
                projects: (specialist.projects || 0) + 1,
                availability: 'available'
              });
            }

            // Generate and save e-bill
            if (specialist && user) {
              const billHtml = buildBillHTML({ booking, specialist, user });
              await this.saveBill(bookingId, billHtml);
            }

            // Notify worker
          if (specialist?.userId) {
            await this.createNotification({
              userId: specialist.userId,
              type: 'booking_status',
              title: 'Payment Received',
              message: `Payment of ₹${booking.finalTotal || booking.totalValue} has been received for booking ${bookingId}.`,
              link: '/worker-dashboard',
              bookingId
            });
          }

          // Notify user: bill ready + leave a review
          await Promise.all([
            this.createNotification({
              userId: booking.userId,
              type: 'booking_status',
              title: 'E-Bill Ready',
              message: `Your e-bill for booking ${bookingId} is ready. Download or email it from your booking page.`,
              link: `/booking`,
              bookingId
            }),
            this.createNotification({
              userId: booking.userId,
              type: 'review_request',
              title: 'Leave a Review',
              message: `How was your experience with ${specialist?.name || 'the specialist'}? Your feedback helps others.`,
              link: `/review/${bookingId}`,
              bookingId
            }),
          ]);
        }
    } catch (error) {
      console.error('Mark booking paid error:', error);
    }
  }

  static async acceptBooking(bookingId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'active' });
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      if (specialist) {
        await updateDoc(doc(db, 'specialists', specialist.id), { availability: 'busy' });
      }
      await this.createNotification({
        userId: booking.userId,
        type: 'booking',
        title: 'Booking Accepted!',
        message: `${specialist?.name || 'The worker'} has accepted your booking and is on the way.`,
        link: '/booking',
        bookingId
      });
    } catch (error) {
      console.error('Accept booking error:', error);
    }
  }

  static async rejectBooking(bookingId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      await this.createNotification({
        userId: booking.userId,
        type: 'booking',
        title: 'Booking Declined',
        message: `${specialist?.name || 'The worker'} is unable to take your booking. Please try another specialist.`,
        link: '/listing',
        bookingId
      });
    } catch (error) {
      console.error('Reject booking error:', error);
    }
  }

  static async requestCancellation(bookingId: string, reason: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancellation_pending',
        cancellationReason: reason,
        cancellationRequestedAt: new Date().toISOString()
      });

      // Notify worker about cancellation request
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      const user = await this.getUserById(booking.userId);
      if (specialist?.userId) {
        await this.createNotification({
          userId: specialist.userId,
          type: 'booking_status',
          title: 'Cancellation Request',
          message: `${user?.name || 'A user'} has requested to cancel booking ${bookingId}. Reason: ${reason}`,
          link: '/worker-dashboard',
          bookingId
        });
      }
    } catch (error) {
      console.error('Request cancellation error:', error);
    }
  }

  static async approveCancellation(bookingId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });

      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);

      // Set worker back to available
      if (specialist) {
        await updateDoc(doc(db, 'specialists', specialist.id), { availability: 'available' });
      }

      await this.createNotification({
        userId: booking.userId,
        type: 'booking_status',
        title: 'Cancellation Approved',
        message: `Your cancellation request for booking ${bookingId} has been approved by ${specialist?.name || 'the worker'}.`,
        link: '/dashboard',
        bookingId
      });
    } catch (error) {
      console.error('Approve cancellation error:', error);
    }
  }

  static async rejectCancellation(bookingId: string) {
    try {
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      if (!bookingDoc.exists()) return;
      const booking = bookingDoc.data() as Booking;
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'active',
        cancellationReason: '',
        cancellationRequestedAt: ''
      });

      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      await this.createNotification({
        userId: booking.userId,
        type: 'booking_status',
        title: 'Cancellation Rejected',
        message: `Your cancellation request for booking ${bookingId} was declined by ${specialist?.name || 'the worker'}. The booking remains active.`,
        link: '/booking',
        bookingId
      });
    } catch (error) {
      console.error('Reject cancellation error:', error);
    }
  }

  static async saveCallFeedback(feedback: Omit<CallFeedback, 'id' | 'createdAt'>) {
    try {
      const ref = doc(collection(db, 'callFeedback'));
      await setDoc(ref, { ...feedback, id: ref.id, createdAt: new Date().toISOString() });
    } catch (error) {
      console.error('Save call feedback error:', error);
    }
  }

  // ─── Real-time message listeners ───

  /**
   * Subscribe to a conversation between two users in real time.
   * Returns an unsubscribe function.
   */
  static onConversation(
    userId1: string,
    userId2: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const q1 = query(
      collection(db, 'messages'),
      where('senderId', '==', userId1),
      where('receiverId', '==', userId2)
    );
    const q2 = query(
      collection(db, 'messages'),
      where('senderId', '==', userId2),
      where('receiverId', '==', userId1)
    );

    // Keep two separate snapshots and merge them
    let snap1Msgs: Message[] = [];
    let snap2Msgs: Message[] = [];

    const merge = () => {
      const all = [...snap1Msgs, ...snap2Msgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      callback(all);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      snap1Msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      merge();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      snap2Msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      merge();
    });

    return () => { unsub1(); unsub2(); };
  }

  /**
   * Subscribe to all messages involving a user in real time.
   * Returns an unsubscribe function.
   */
  static onUserMessages(
    userId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const qSent = query(collection(db, 'messages'), where('senderId', '==', userId));
    const qRecv = query(collection(db, 'messages'), where('receiverId', '==', userId));

    let sentMsgs: Message[] = [];
    let recvMsgs: Message[] = [];

    const merge = () => {
      const seen = new Set<string>();
      const all: Message[] = [];
      for (const m of [...sentMsgs, ...recvMsgs]) {
        if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
      }
      callback(all);
    };

    const unsub1 = onSnapshot(qSent, (snap) => {
      sentMsgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      merge();
    });

    const unsub2 = onSnapshot(qRecv, (snap) => {
      recvMsgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Message));
      merge();
    });

    return () => { unsub1(); unsub2(); };
  }

  // ─── Availability Notify Requests ───

  /**
   * Active client-side watchers: key = `${specialistId}:${userId}`
   * Value = { unsubscribe, prevAvailability }
   * Stored at module level so they survive component re-mounts.
   */
  private static _availWatchers = new Map<string, { unsub: () => void; prevAvail: string }>();

  /**
   * Start a real-time listener on this specialist.
   * The moment `availability` flips to `'available'` (and was not already
   * `'available'` before), fire an in-app notification to `userId` and
   * automatically stop the watcher (one-shot).
   *
   * Safe to call multiple times with the same key — idempotent.
   */
  static startAvailabilityWatcher(specialistId: string, userId: string): void {
    const key = `${specialistId}:${userId}`;
    if (this._availWatchers.has(key)) return; // already watching

    const ref = doc(db, 'specialists', specialistId);

    // State lives outside the callback so there's no timing race with _availWatchers.set
    let isFirst = true;
    let prevAvail = '';

    const unsub = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const current: string = data.availability ?? 'available';

      // First snapshot: just record the current state, don't fire anything
      if (isFirst) {
        isFirst = false;
        prevAvail = current;
        return;
      }

      // Worker just flipped to available from a non-available state
      if (current === 'available' && prevAvail !== 'available') {
        const name: string = data.name ?? 'Your worker';
        try {
          await this.createNotification({
            userId,
            type: 'availability',
            title: `${name} is now available!`,
            message: `${name} is now available for bookings. Tap to book now.`,
            link: `/profile/${specialistId}`,
          });
        } catch (e) {
          console.error('availability notification error:', e);
        }
        // One-shot: stop watching and clean up Firestore record
        this.stopAvailabilityWatcher(specialistId, userId);
        try {
          await deleteDoc(doc(db, 'availabilityNotifyRequests', `AVAIL-${specialistId}-${userId}`));
        } catch (_) { /* ignore */ }
        return;
      }

      prevAvail = current;
    }, (err) => console.error('availability watcher error:', err));

    this._availWatchers.set(key, { unsub, prevAvail: '' });
  }

  /** Stop an active watcher without firing a notification */
  static stopAvailabilityWatcher(specialistId: string, userId: string): void {
    const key = `${specialistId}:${userId}`;
    const entry = this._availWatchers.get(key);
    if (entry) {
      entry.unsub();
      this._availWatchers.delete(key);
    }
  }

  /** Register interest: persist to Firestore AND start real-time watcher */
  static async subscribeAvailabilityNotify(specialistId: string, userId: string): Promise<void> {
    try {
      const id = `AVAIL-${specialistId}-${userId}`;
      await setDoc(doc(db, 'availabilityNotifyRequests', id), {
        id,
        specialistId,
        userId,
        createdAt: new Date().toISOString(),
      });
      this.startAvailabilityWatcher(specialistId, userId);
    } catch (error) {
      console.error('subscribeAvailabilityNotify error:', error);
    }
  }

  /** Remove interest: stop real-time watcher AND delete Firestore record */
  static async unsubscribeAvailabilityNotify(specialistId: string, userId: string): Promise<void> {
    try {
      this.stopAvailabilityWatcher(specialistId, userId);
      const id = `AVAIL-${specialistId}-${userId}`;
      await deleteDoc(doc(db, 'availabilityNotifyRequests', id));
    } catch (error) {
      console.error('unsubscribeAvailabilityNotify error:', error);
    }
  }

  /** Check if a user is already watching a specialist */
  static async isWatchingAvailability(specialistId: string, userId: string): Promise<boolean> {
    try {
      const id = `AVAIL-${specialistId}-${userId}`;
      const snap = await getDoc(doc(db, 'availabilityNotifyRequests', id));
      return snap.exists();
    } catch {
      return false;
    }
  }

  /** @deprecated — kept for back-compat, no longer used for the primary flow */
  static async notifyAvailabilityWatchers(_specialistId: string, _specialistName: string): Promise<void> {
    // Real-time client watchers now handle this. No-op.
  }

  // ─── Bills ───

  static async saveBill(bookingId: string, billHtml: string) {
    try {
      await setDoc(doc(db, 'bills', bookingId), {
        bookingId,
        html: billHtml,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Save bill error:', error);
    }
  }

  static async getBill(bookingId: string): Promise<string | null> {
    try {
      const snap = await getDoc(doc(db, 'bills', bookingId));
      return snap.exists() ? (snap.data().html as string) : null;
    } catch (error) {
      console.error('Get bill error:', error);
      return null;
    }
  }

  static async cleanupCall(callId: string) {
    try {
      // Delete ICE candidates subcollection
      const iceDocs = await getDocs(collection(db, 'calls', callId, 'iceCandidates'));
      for (const iceDoc of iceDocs.docs) {
        await deleteDoc(iceDoc.ref);
      }
      await deleteDoc(doc(db, 'calls', callId));
    } catch (error) {
      console.error('Cleanup call error:', error);
    }
  }
}