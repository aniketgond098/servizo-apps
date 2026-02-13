import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCnw7G3fI86-rFZXxRvkVD3isyEGGNtFE8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'prolux-elite-services.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'prolux-elite-services',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'prolux-elite-services.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '116588196443',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:116588196443:web:d491b7b96fcb940909857e'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
