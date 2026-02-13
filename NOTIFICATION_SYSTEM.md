# Notification System Documentation

## Overview
A comprehensive notification system that keeps users and workers informed about bookings, messages, and booking status changes in real-time.

## Features

### For Users (Clients)
1. **Booking Confirmations** - Get notified when a booking is confirmed
2. **Emergency Booking Alerts** - Special notifications for emergency bookings
3. **Booking Status Updates** - Notifications when bookings are completed or cancelled
4. **New Messages** - Alerts when workers send messages

### For Workers (Service Providers)
1. **New Booking Alerts** - Get notified when someone books your services
2. **Emergency Booking Alerts** - Priority notifications for emergency bookings
3. **New Messages** - Alerts when clients send messages

## Implementation

### 1. Database Schema

**Notification Type:**
```typescript
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
}

export type NotificationType = 'booking' | 'message' | 'booking_status' | 'emergency_booking';
```

### 2. Database Methods (`services/db.ts`)

**Create Notification:**
```typescript
static async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>)
```

**Get User Notifications:**
```typescript
static async getNotifications(userId: string): Promise<Notification[]>
```

**Get Unread Count:**
```typescript
static async getUnreadNotifications(userId: string): Promise<number>
```

**Mark as Read:**
```typescript
static async markNotificationAsRead(notificationId: string)
static async markAllNotificationsAsRead(userId: string)
```

### 3. Notification Triggers

#### Booking Created (Regular)
- **Worker receives:** "New Booking Received - [User Name] has booked your services."
- **User receives:** "Booking Confirmed - Your booking with [Specialist Name] has been confirmed."

#### Emergency Booking Created
- **Worker receives:** "🚨 EMERGENCY Booking - URGENT: [User Name] needs immediate assistance!"
- **User receives:** "Emergency Booking Confirmed - Your emergency booking with [Specialist Name] has been confirmed. Help is on the way!"

#### Booking Status Changed
- **User receives:** "Booking Completed/Cancelled - Your booking with [Specialist Name] has been completed/cancelled."

#### New Message Sent
- **Receiver gets:** "New Message - [Sender Name] sent you a message."

### 4. UI Components

#### Navbar Bell Icon
- Shows notification count badge
- Red badge with number of unread notifications
- Visible on desktop and mobile
- Clickable to navigate to notifications page

#### Notifications Page (`pages/Notifications.tsx`)
- Lists all notifications (newest first)
- Unread notifications highlighted with blue border
- Different icons for different notification types:
  - 💬 Green for messages
  - 📅 Blue for bookings
  - ⚠️ Red for emergency bookings
  - ✓ Purple for booking status
- "Mark All Read" button
- Individual "Mark as Read" button (X icon)
- "View Details" link for each notification
- Empty state with call-to-action

## Notification Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `message` | MessageCircle | Green | New message received |
| `booking` | Calendar | Blue | New booking created |
| `emergency_booking` | AlertTriangle | Red | Emergency booking created |
| `booking_status` | CheckCircle | Purple | Booking completed/cancelled |

## User Experience Flow

### For Users:
1. User books a service
2. Receives instant notification: "Booking Confirmed"
3. Bell icon shows badge (1)
4. Can click bell to view details
5. When booking completes, receives: "Booking Completed"
6. Can mark notifications as read

### For Workers:
1. User books their service
2. Worker receives instant notification: "New Booking Received"
3. Bell icon shows badge (1)
4. If emergency: Special red alert with 🚨
5. Can click to view booking details
6. When user messages, receives: "New Message"

## Navigation Links

Each notification includes a link to relevant page:
- **Booking notifications** → `/booking` or `/worker-dashboard`
- **Message notifications** → `/chat/[userId]`
- **Status notifications** → `/dashboard`

## Visual Design

### Unread Notifications:
- Blue border (`border-blue-500/40`)
- Blue background tint (`bg-blue-500/5`)
- Blue icon background (`bg-blue-600/20`)

### Read Notifications:
- Gray border (`border-zinc-800`)
- Standard background
- Gray icon background (`bg-zinc-800`)

### Badge Counts:
- Red background for notification count
- Green background for message count
- Positioned top-right of icon
- Shows actual count number

## Code Examples

### Creating a Notification:
```typescript
await DB.createNotification({
  userId: 'USER-123',
  type: 'booking',
  title: 'Booking Confirmed',
  message: 'Your booking with John Doe has been confirmed.',
  link: '/booking',
  bookingId: 'BK-ABC123'
});
```

### Getting Unread Count:
```typescript
const count = await DB.getUnreadNotifications(currentUser.id);
setNotificationCount(count);
```

### Marking as Read:
```typescript
await DB.markNotificationAsRead(notificationId);
// or
await DB.markAllNotificationsAsRead(userId);
```

## Integration Points

### 1. Booking Creation (`createBooking`)
- Notifies worker about new booking
- Notifies user about confirmation

### 2. Emergency Booking (`createEmergencyBooking`)
- Sends priority notification to worker
- Sends confirmation to user

### 3. Booking Status Update (`updateBookingStatus`)
- Notifies user when booking is completed/cancelled

### 4. Message Sending (`sendMessage`)
- Notifies receiver about new message

### 5. Navbar (`App.tsx`)
- Displays notification count
- Updates on location change
- Shows bell icon with badge

## Testing

### Test Scenarios:

1. **Regular Booking:**
   - Create booking as user
   - Check worker receives notification
   - Check user receives confirmation
   - Verify bell badge updates

2. **Emergency Booking:**
   - Create emergency booking
   - Verify worker gets priority alert
   - Check for 🚨 emoji in title
   - Verify higher urgency styling

3. **Messages:**
   - Send message to another user
   - Verify receiver gets notification
   - Check link navigates to chat
   - Verify badge count

4. **Booking Completion:**
   - Complete a booking
   - Verify user gets status notification
   - Check notification details

5. **Mark as Read:**
   - Click individual notification X
   - Verify it marks as read
   - Click "Mark All Read"
   - Verify all marked as read
   - Check badge count updates

## Future Enhancements

1. **Push Notifications:**
   - Browser push notifications
   - Mobile app notifications
   - Email notifications

2. **Notification Preferences:**
   - Allow users to customize notification types
   - Mute specific notification categories
   - Set quiet hours

3. **Real-time Updates:**
   - WebSocket integration
   - Live notification updates without refresh
   - Instant badge count updates

4. **Notification Sounds:**
   - Audio alerts for new notifications
   - Different sounds for different types
   - Volume control

5. **Notification History:**
   - Archive old notifications
   - Search notifications
   - Filter by type/date

6. **Rich Notifications:**
   - Show user avatars
   - Preview message content
   - Quick actions (reply, accept, etc.)

## Performance Considerations

- Notifications loaded on page navigation
- Unread count cached in state
- Efficient Firebase queries with filters
- Pagination for large notification lists (future)

## Security

- Users can only see their own notifications
- Notifications filtered by userId
- No sensitive data in notification messages
- Links validated before navigation

## Accessibility

- Clear notification titles
- Descriptive messages
- Keyboard navigation support
- Screen reader friendly
- High contrast for unread items
- Icon + text for clarity
