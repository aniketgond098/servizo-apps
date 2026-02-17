import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Specialist, Booking, User, Review, Message, MessageAttachment, VerificationRequest, Notification, Call, IceCandidate } from '../types';

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
      const specialistsRef = collection(db, 'specialists');
      const snapshot = await getDocs(specialistsRef);
      
      if (snapshot.empty) {
        for (const specialist of INITIAL_SPECIALISTS) {
          await setDoc(doc(db, 'specialists', specialist.id), specialist);
        }
      }

      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      if (usersSnapshot.empty) {
        const demoUsers: User[] = [
          {
            id: 'ADMIN-001',
            email: 'admin@servizo.in',
            password: 'admin',
            name: 'System Administrator',
            role: 'admin',
            avatar: 'https://i.pravatar.cc/150?u=admin',
            createdAt: new Date().toISOString(),
            favorites: [],
            theme: 'dark'
          },
          {
            id: 'WORKER-001',
            email: 'worker@servizo.in',
            password: 'worker123',
            name: 'Demo Worker',
            role: 'worker',
            avatar: 'https://i.pravatar.cc/150?u=worker',
            createdAt: new Date().toISOString(),
            favorites: [],
            theme: 'dark'
          },
          {
            id: 'USER-001',
            email: 'user@servizo.in',
            password: 'user123',
            name: 'Demo User',
            role: 'user',
            avatar: 'https://i.pravatar.cc/150?u=user',
            createdAt: new Date().toISOString(),
            favorites: [],
            theme: 'dark'
          }
        ];
        
        for (const user of demoUsers) {
          await setDoc(doc(db, 'users', user.id), user);
        }
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
        status: 'active'
      };
      await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
      
      // Get specialist and user info
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      const user = await this.getUserById(booking.userId);
      
      // Notify worker
      if (specialist?.userId) {
        await this.createNotification({
          userId: specialist.userId,
          type: 'booking',
          title: 'New Booking Received',
          message: `${user?.name || 'A user'} has booked your services.`,
          link: '/worker-dashboard',
          bookingId: newBooking.id
        });
      }
      
      // Notify user
      await this.createNotification({
        userId: booking.userId,
        type: 'booking',
        title: 'Booking Confirmed',
        message: `Your booking with ${specialist?.name || 'specialist'} has been confirmed.`,
        link: '/booking',
        bookingId: newBooking.id
      });
      
      return newBooking;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  static async createEmergencyBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'isEmergency' | 'emergencyMultiplier' | 'totalValue'>, baseRate: number): Promise<Booking> {
    try {
      const emergencyMultiplier = 1.2;
      const newBooking: Booking = {
        ...booking,
        id: `EMG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        status: 'active',
        isEmergency: true,
        emergencyMultiplier,
        totalValue: Math.round(baseRate * emergencyMultiplier)
      };
      await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
      
      // Get specialist and user info
      const specialists = await this.getSpecialists();
      const specialist = specialists.find(s => s.id === booking.specialistId);
      const user = await this.getUserById(booking.userId);
      
      // Notify worker with emergency priority
      if (specialist?.userId) {
        await this.createNotification({
          userId: specialist.userId,
          type: 'emergency_booking',
          title: '🚨 EMERGENCY Booking',
          message: `URGENT: ${user?.name || 'A user'} needs immediate assistance!`,
          link: '/worker-dashboard',
          bookingId: newBooking.id
        });
      }
      
      // Notify user
      await this.createNotification({
        userId: booking.userId,
        type: 'emergency_booking',
        title: 'Emergency Booking Confirmed',
        message: `Your emergency booking with ${specialist?.name || 'specialist'} has been confirmed. Help is on the way!`,
        link: '/booking',
        bookingId: newBooking.id
      });
      
      return newBooking;
    } catch (error) {
      console.error('Create emergency booking error:', error);
      throw error;
    }
  }

  static async getActiveBooking(userId?: string): Promise<Booking | null> {
    try {
      const bookings = await this.getBookings();
      if (userId) return bookings.find(b => b.userId === userId && b.status === 'active') || null;
      return bookings.find(b => b.status === 'active') || null;
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
      const messages = await this.getMessages();
      return messages.filter(m => 
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      console.error('Get conversation error:', error);
      return [];
    }
  }

  static async sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> {
    try {
      const newMessage: Message = {
        ...message,
        id: `MSG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        read: false,
        messageType: message.messageType || 'text',
          ...(message.attachment ? { attachment: message.attachment } : {})
        };
        await setDoc(doc(db, 'messages', newMessage.id), newMessage);
      
      // Get sender info
      const sender = await this.getUserById(message.senderId);
      
      // Notify receiver about new message
      await this.createNotification({
        userId: message.receiverId,
        type: 'message',
        title: 'New Message',
        message: `${sender?.name || 'Someone'} sent you a message.`,
        link: `/chat/${message.senderId}`
      });
      
      return newMessage;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  static async markMessagesAsRead(userId: string, otherUserId: string) {
    try {
      const messages = await this.getMessages();
      const updates = messages
        .filter(m => m.senderId === otherUserId && m.receiverId === userId && !m.read)
        .map(m => updateDoc(doc(db, 'messages', m.id), { read: true }));
      await Promise.all(updates);
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const messages = await this.getMessages();
      return messages.filter(m => m.receiverId === userId && !m.read).length;
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
      const snapshot = await getDocs(collection(db, 'notifications'));
      const notifications = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as Notification))
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return notifications;
    } catch (error) {
      console.error('Get notifications error:', error);
      return [];
    }
  }

  static async getUnreadNotifications(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(n => !n.read).length;
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
    // Simulate upload - in production, use Firebase Storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    return onSnapshot(collection(db, 'calls'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const call = change.doc.data() as Call;
          if (call.receiverId === userId && call.status === 'ringing') {
            callback(call);
          }
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