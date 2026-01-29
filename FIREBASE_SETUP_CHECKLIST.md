# Firebase Console Setup Checklist

> **Project:** learningos-2026  
> **Console URL:** https://console.firebase.google.com/project/learningos-2026

## ✅ Already Done
- [x] Firebase project created (`learningos-2026`)
- [x] Web app registered
- [x] Firebase config added to `.env.local`
- [x] Service account created for Admin SDK
- [x] Admin SDK credentials in `.env.local`

---

## 🔧 Manual Steps Required (Firebase Console)

### 1. Enable Authentication Providers

**Go to:** Authentication → Sign-in method

1. **Email/Password**
   - [ ] Click "Email/Password"
   - [ ] Toggle "Enable" → ON
   - [ ] Click "Save"

2. **Google OAuth**
   - [ ] Click "Google"
   - [ ] Toggle "Enable" → ON
   - [ ] Set Project support email (your email)
   - [ ] Click "Save"

### 2. Add Authorized Domains

**Go to:** Authentication → Settings → Authorized domains

- [ ] Verify `localhost` is listed (should be automatic)
- [ ] Add any custom domains if deploying (e.g., `learningos.vercel.app`)

### 3. Create Firestore Database

**Go to:** Firestore Database → Create database

- [ ] Choose "Start in production mode"
- [ ] Select location: `us-central1` (or closest region)
- [ ] Click "Enable"

### 4. Set Firestore Security Rules

**Go to:** Firestore Database → Rules

Replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profiles - users can only read/write their own
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Sessions - users can only access their own
    match /sessions/{sessionId} {
      allow read, write: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Messages - users can only access messages in their sessions
    match /messages/{messageId} {
      allow read, write: if isAuthenticated();
      // Note: Full validation would check session ownership
    }
    
    // Concepts - users can only access their own
    match /concepts/{conceptId} {
      allow read, write: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Allow server-side operations (Admin SDK bypasses rules)
  }
}
```

- [ ] Paste rules above
- [ ] Click "Publish"

### 5. Create Firestore Indexes (Optional - will auto-create on first query)

**Go to:** Firestore Database → Indexes

The following composite indexes will be needed (Firebase will prompt you to create them on first use):

- `sessions`: `userId` ASC, `startedAt` DESC
- `concepts`: `userId` ASC, `masteryLevel` DESC
- `messages`: `sessionId` ASC, `timestamp` ASC

---

## 🧪 Verification Steps

After completing the above, verify everything works:

### Test 1: Local Authentication
```bash
npm run dev
# Go to http://localhost:3000/login
# Try creating an account with email/password
# Try signing in with Google
```

### Test 2: Firestore Write
```bash
# After logging in, the app should create a user profile
# Check Firestore Console → Data → users collection
```

### Test 3: E2E Tests
```bash
npm run test:e2e
# Should now be able to run basic auth flow tests
```

---

## 🔐 Security Notes

1. **Never commit** `.env.local` to git (it's in `.gitignore`)
2. **Admin SDK private key** should only be on server-side
3. **Firestore rules** protect client-side access; Admin SDK bypasses them
4. For production, consider:
   - Rate limiting
   - More granular rules
   - Firebase App Check

---

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Ensure Authentication is enabled in Firebase Console

### "Permission denied" in Firestore
- Check Firestore rules are published
- Verify user is authenticated
- Check the userId matches

### Google Sign-in not working
- Verify Google provider is enabled
- Check authorized domains include `localhost`
- Ensure support email is set
