import emailjs from '@emailjs/browser';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface EmailOTPRecord {
  email: string;
  otp: string;
  createdAt: number;
  expiresAt: number;
}

export class EmailService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(email: string, name: string): Promise<void> {
    const otp = this.generateOTP();
    const now = Date.now();

    // Clean up any previous OTPs for this email
    const q = query(collection(db, 'email_otps'), where('email', '==', email));
    const existing = await getDocs(q);
    for (const d of existing.docs) {
      await deleteDoc(doc(db, 'email_otps', d.id));
    }

    // Store new OTP in Firestore
    await addDoc(collection(db, 'email_otps'), {
      email,
      otp,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes
    });

    // Send via EmailJS
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        to_email: email,
        to_name: name || 'User',
        otp_code: otp,
      }, PUBLIC_KEY);
    } catch (err: any) {
      console.error('EmailJS send error:', JSON.stringify(err));
      // EmailJS errors come as { status, text } objects
      const msg = err?.text || err?.message || (typeof err === 'string' ? err : 'Failed to send email');
      throw new Error(msg);
    }
  }

  static async verifyOTP(email: string, code: string): Promise<boolean> {
    const q = query(
      collection(db, 'email_otps'),
      where('email', '==', email),
      where('otp', '==', code)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return false;
    }

    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data() as EmailOTPRecord;

    // Check expiry
    if (Date.now() > data.expiresAt) {
      await deleteDoc(doc(db, 'email_otps', otpDoc.id));
      return false;
    }

    // Delete used OTP
    await deleteDoc(doc(db, 'email_otps', otpDoc.id));
    return true;
  }
}
