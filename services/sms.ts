import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface OTPRecord {
  phone: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
}

export class SMSService {
  static async sendOTP(phoneNumber: string): Promise<string> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const now = Date.now();
      
      // Store OTP in Firestore
      await addDoc(collection(db, 'otps'), {
        phone: phoneNumber,
        otp,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000 // 10 minutes
      });

      // In production, send SMS via Twilio/AWS SNS here
      console.log(`OTP for ${phoneNumber}: ${otp}`);
      
      return otp;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  static async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'otps'),
        where('phone', '==', phoneNumber),
        where('otp', '==', code)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return false;
      }

      const otpDoc = snapshot.docs[0];
      const data = otpDoc.data() as OTPRecord;
      
      // Check if expired
      if (Date.now() > data.expiresAt) {
        await deleteDoc(doc(db, 'otps', otpDoc.id));
        return false;
      }

      // Delete used OTP
      await deleteDoc(doc(db, 'otps', otpDoc.id));
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  static cleanup(): void {
    // No cleanup needed for this implementation
  }
}
