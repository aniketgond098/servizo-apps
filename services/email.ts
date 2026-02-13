import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';

export class EmailService {
  static async sendVerificationEmail(user: FirebaseUser): Promise<void> {
    try {
      await sendEmailVerification(user, {
        url: window.location.origin + '/#/dashboard',
        handleCodeInApp: false
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  static async createUserAndSendVerification(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.sendVerificationEmail(userCredential.user);
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async signInUser(email: string, password: string): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  static async resendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await this.sendVerificationEmail(user);
    }
  }

  static isEmailVerified(): boolean {
    return auth.currentUser?.emailVerified || false;
  }
}
