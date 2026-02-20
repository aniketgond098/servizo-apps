
export type ServiceCategory = 'Architecture' | 'Plumbing' | 'Mechanical' | 'Aesthetics' | 'Electrical' | 'Automation';
export type UserRole = 'user' | 'worker' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';
export type Theme = 'light' | 'dark';
export type SortOption = 'rating' | 'price-low' | 'price-high' | 'distance' | 'experience' | 'response';

export interface User {
  id: string;
  email: string;
  password?: string; // Only for local mock auth
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  favorites?: string[]; // Specialist IDs
  theme?: Theme;
  verificationStatus?: VerificationStatus;
  aadhaarUrl?: string;
  panUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface Specialist {
  id: string;
  userId?: string; // Link to a worker user account
  name: string;
  title: string;
  category: ServiceCategory;
  description: string;
  tags: string[];
  hourlyRate: number;
  rating: number;
  experience: number;
  projects: number;
  location: string;
  lat: number;
  lng: number;
  avatar: string;
  skills: string[];
  credentials: string[];
  availability: AvailabilityStatus;
  busyFrom?: string;   // ISO datetime string
  busyUntil?: string;  // ISO datetime string
  verified?: boolean;
  backgroundChecked?: boolean;
  insuranceVerified?: boolean;
  topRated?: boolean;
  fastResponder?: boolean;
  responseRate?: number;   // 0-100 percentage
  totalRequests?: number;  // total booking requests received
}

export interface ExtraCharge {
  id: string;
  description: string;
  amount: number;
  addedAt: string;
}

export interface Booking {
  id: string;
  specialistId: string;
  userId: string; // The user who hired
  userLat: number;
  userLng: number;
  status: 'pending_worker_acceptance' | 'active' | 'pending_payment' | 'completed' | 'cancelled' | 'cancellation_pending';
  startTime: string;
  createdAt: string;
  totalValue: number;
  serviceAddress?: string;
  scheduledDate?: string;
  reviewed?: boolean;
  completedAt?: string;
  workerLat?: number;
  workerLng?: number;
  workerLastUpdate?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  problemPhotos?: string[];
  extraCharges?: ExtraCharge[];
  finalTotal?: number;
  paymentStatus?: 'pending' | 'paid';
  paidAt?: string;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
}

export interface SearchIntent {
  category?: ServiceCategory;
  query: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface Review {
  id: string;
  bookingId: string;
  specialistId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'document';

export interface MessageAttachment {
  type: 'image' | 'document';
  url: string;
  name: string;
  size?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  messageType?: MessageType;
  attachment?: MessageAttachment;
}

export type NotificationType = 'booking' | 'message' | 'booking_status' | 'push' | 'review_request' | 'availability';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  bookingId?: string;
  pushSent?: boolean;
}

export type CallStatus = 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected';

export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'voice' | 'video';
  status: CallStatus;
  createdAt: string;
  answeredAt?: string;
  endedAt?: string;
  offer?: string; // SDP offer (JSON stringified)
  answer?: string; // SDP answer (JSON stringified)
}

export interface IceCandidate {
  id: string;
  callId: string;
  fromUserId: string;
  candidate: string; // JSON stringified RTCIceCandidate
  createdAt: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  aadhaarUrl: string;
  panUrl: string;
  cvUrl: string;
  status: VerificationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CallFeedback {
  id: string;
  callId: string;
  fromUserId: string;
  toUserId: string;
  toUserName: string;
  callType: 'voice' | 'video';
  callDuration: number; // seconds
  overallRating: number; // 1-5
  languageRating: number; // 1-5
  behaviourRating: number; // 1-5
  wouldRecommend: boolean;
  comment: string;
  createdAt: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  favoriteCategory: ServiceCategory;
  completedBookings: number;
  cancelledBookings: number;
  monthlySpending: { month: string; amount: number }[];
}

export interface WorkerAnalytics {
  totalEarnings: number;
  totalBookings: number;
  averageRating: number;
  completionRate: number;
  responseTime: number;
  monthlyEarnings: { month: string; amount: number }[];
}
