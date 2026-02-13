# Emergency Hire Feature

## Overview
The Emergency Hire feature allows users to book workers with priority dispatch for urgent situations. Emergency bookings come with a 20% surcharge but guarantee immediate response and faster service.

## Key Features

### 1. **Priority Dispatch**
- Workers are notified immediately with emergency priority
- Faster response time compared to regular bookings
- Visual indicators throughout the booking flow

### 2. **Price Surcharge**
- Emergency bookings cost 20% more than regular bookings
- Calculated automatically: `Emergency Price = Base Rate × 1.2`
- Clearly displayed to users before booking

### 3. **Visual Indicators**
- Red/orange gradient styling for emergency bookings
- Alert triangle icon instead of standard shield icon
- Animated pulse effects to indicate urgency
- "EMERGENCY" badge on booking details

## Implementation Details

### Type Changes (`types.ts`)
```typescript
export interface Booking {
  // ... existing fields
  isEmergency?: boolean;           // Marks booking as emergency
  emergencyMultiplier?: number;    // Stores the multiplier (1.5)
}
```

### Database Service (`services/db.ts`)
New method added:
```typescript
static async createEmergencyBooking(
  booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'isEmergency' | 'emergencyMultiplier' | 'totalValue'>,
  baseRate: number
): Promise<Booking>
```

Features:
- Generates booking ID with "EMG-" prefix
- Applies 1.2x multiplier to base rate
- Sets `isEmergency: true` flag
- Calculates and stores total value

### Profile Page (`pages/Profile.tsx`)
**Emergency Hire Button:**
- Positioned above regular booking button
- Red/orange gradient with pulsing animation
- Shows "+20%" surcharge clearly
- Always available (not dependent on availability status)

**Information Box:**
- Explains emergency hire feature
- Shows surcharge percentage
- Describes priority response benefit

### Booking Page (`pages/Booking.tsx`)
**Emergency Indicators:**
- Header badge shows "EMERGENCY" instead of version
- Red color scheme throughout
- Alert triangle icon
- Price shows "+20%" badge
- Status messages reflect emergency priority
- "Emergency Dispatch" instead of "Vector Optimization"

## User Flow

1. **User visits specialist profile**
2. **Sees two booking options:**
   - Regular booking (standard rate)
   - Emergency hire (+20% surcharge)
3. **Clicks "EMERGENCY HIRE (+20%)"**
4. **System creates emergency booking:**
   - Calculates 1.2x price
   - Sets emergency flags
   - Generates EMG- prefixed ID
5. **Redirects to booking page with emergency styling**
6. **Worker receives priority notification**

## Benefits

### For Users:
- Immediate response for urgent situations
- Priority service guarantee
- Clear pricing transparency
- Peace of mind during emergencies

### For Workers:
- Higher earnings for urgent jobs
- Clear emergency indicators
- Ability to prioritize critical work

### For Platform:
- Additional revenue stream
- Better service differentiation
- Improved user satisfaction

## Future Enhancements

1. **Dynamic Pricing:**
   - Adjust multiplier based on time of day
   - Weekend/holiday surcharges
   - Distance-based pricing

2. **Worker Preferences:**
   - Allow workers to opt-in/out of emergency calls
   - Set custom emergency rates
   - Emergency availability hours

3. **Notifications:**
   - SMS alerts for emergency bookings
   - Push notifications with priority
   - Real-time status updates

4. **Analytics:**
   - Track emergency booking patterns
   - Monitor response times
   - Measure customer satisfaction

## Testing

To test the emergency hire feature:

1. Login as a regular user (not worker/admin)
2. Navigate to any specialist profile
3. Click "EMERGENCY HIRE (+50%)" button
4. Verify price calculation (should be 1.5x base rate)
5. Check booking page shows emergency styling
6. Verify booking ID starts with "EMG-"
7. Confirm all emergency indicators are visible

## Configuration

Current settings (can be modified in `services/db.ts`):
- Emergency multiplier: `1.2` (20% surcharge)
- Booking ID prefix: `EMG-`
- Visual theme: Red/orange gradient

To change the surcharge percentage, modify the `emergencyMultiplier` constant in the `createEmergencyBooking` method.
