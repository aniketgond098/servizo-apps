# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "prolux-elite-services"
4. Disable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Services

### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select location (closest to your users)
5. Click "Enable"

### Authentication
1. Go to "Authentication" → "Sign-in method"
2. Enable "Email/Password"
3. Click "Save"

### Storage
1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Click "Done"

## 3. Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app name: "prolux-web"
5. Copy the firebaseConfig object

## 4. Add Environment Variables

Create `.env.local` file in project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 5. Firestore Security Rules

Go to Firestore → Rules and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /specialists/{specialistId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
    
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    match /verificationRequests/{requestId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 6. Storage Security Rules

Go to Storage → Rules and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## 7. Run the App

```bash
npm run dev
```

The app will now use Firebase instead of localStorage!
