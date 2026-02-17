import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const OTP_EXPIRY_MINUTES = 5;

export class SMSService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async isPhoneAlreadyUsed(phoneNumber: string, currentUserId?: string): Promise<boolean> {
    const phone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone), where('phoneVerified', '==', true));
    const snapshot = await getDocs(q);

    // If any verified user has this phone and it's not the current user, it's taken
    return snapshot.docs.some(d => d.id !== currentUserId);
  }

  static async sendOTP(phoneNumber: string, currentUserId?: string): Promise<void> {
    const phone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');

    if (phone.length !== 10) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }

    // Check if phone is already registered to another user
    const taken = await this.isPhoneAlreadyUsed(phone, currentUserId);
    if (taken) {
      throw new Error('This phone number is already registered to another account.');
    }

    const otp = this.generateOTP();

    // Clean up old OTPs for this phone
    try {
      const otpRef = collection(db, 'phone_otps');
      const q = query(otpRef, where('phone', '==', phone));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'phone_otps', d.id)));
      await Promise.all(deletePromises);
    } catch (e) {
      console.error('Error cleaning old OTPs:', e);
    }

    // Store OTP in Firestore
    await addDoc(collection(db, 'phone_otps'), {
      phone,
      otp,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)),
    });

    // Simulated SMS — show OTP via alert (replace with real SMS provider later)
    console.log(`[Servizo] OTP for +91 ${phone}: ${otp}`);
    alert(`Your Servizo OTP is: ${otp}\n\n(This is a simulated SMS. In production, this will be sent via real SMS.)`);
  }

  static async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    const phone = phoneNumber.replace(/\D/g, '').replace(/^0+/, '');

    const otpRef = collection(db, 'phone_otps');
    const q = query(otpRef, where('phone', '==', phone));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No OTP found. Please request a new code.');
    }

    const otpDoc = snapshot.docs[0];
    const otpData = otpDoc.data();

    // Check expiry
    const expiresAt = otpData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      await deleteDoc(doc(db, 'phone_otps', otpDoc.id));
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check code
    if (otpData.otp !== code) {
      throw new Error('Invalid OTP. Please try again.');
    }

    // Valid - clean up
    await deleteDoc(doc(db, 'phone_otps', otpDoc.id));
    return true;
  }

  static cleanup(): void {
    // No cleanup needed for Firestore-based approach
  }
}
