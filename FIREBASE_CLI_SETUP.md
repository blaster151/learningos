# Firebase Setup via CLI and Console

## ✅ Already Completed
- ✅ Firebase project created: `learningos-2026`
- ✅ Firebase Admin SDK credentials configured in `.env.local`
- ✅ Firebase Authentication API enabled
- ✅ Firestore API enabled

## 🔧 Setup Required

### 1. Create Firestore Database (Console Required)
The Firestore database must be created via Firebase Console initially:

**Via Console:**
```
1. Go to: https://console.firebase.google.com/project/learningos-2026/firestore
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose location: us-central (closest to your OpenAI API)
5. Click "Enable"
```

**Alternative - CLI after initial creation:**
```bash
# Once database exists, you can manage it via CLI:
firebase firestore:databases:list
```

### 2. Enable Authentication Providers (CLI)

**Enable Email/Password Authentication:**
```bash
# This requires the Firebase Console for initial setup
# Go to: https://console.firebase.google.com/project/learningos-2026/authentication/providers
# Enable "Email/Password" provider
```

**Enable Google Sign-In (Optional):**
```bash
# Go to same URL above
# Enable "Google" provider
# Add your OAuth client ID from Google Cloud Console
```

### 3. Set Up Authorized Domains (CLI)
```bash
# Add localhost for development
gcloud alpha identity domains create localhost:3000 \
  --project=learningos-2026

# Or via Firebase Console:
# https://console.firebase.google.com/project/learningos-2026/authentication/settings
# Add "localhost" to Authorized domains
```

### 4. Deploy Firestore Security Rules
```bash
# Create firestore.rules file if not exists, then:
firebase deploy --only firestore:rules
```

### 5. Verify Setup

**Check Firestore:**
```bash
firebase firestore:databases:list
```

**Check Auth Config:**
```bash
# Via Firebase Console:
# https://console.firebase.google.com/project/learningos-2026/authentication/users
```

**Test Your App:**
```bash
npm run dev
# Navigate to http://localhost:3000/signup
# Try creating an account
```

## 🚀 Quick Start Commands

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, seed initial data (after Firestore is created)
node scripts/seed-concepts.js

# 3. Test authentication
# Open http://localhost:3000/signup
# Create an account with email/password
```

## 📋 Firestore Collections to Create

Once Firestore is set up, your app will automatically create these collections:
- `users` - User profiles
- `sessions` - Learning sessions
- `messages` - Chat messages
- `concepts` - Knowledge graph concepts
- `concept_relations` - Relationships between concepts
- `learningPaths` - Generated learning paths
- `reflection_prompts` - Reflection prompts
- `reflections` - User reflection submissions

## 🔒 Security Rules (Already in firestore.rules)

Your current rules require authentication for all operations:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## ⚠️ Important Notes

1. **Localhost is already authorized** in your Firebase config (via NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
2. **Test mode** allows all authenticated reads/writes - fine for development
3. **Production** will need more restrictive security rules
4. The app requires **both** Firestore AND Authentication to function

## 🐛 Troubleshooting

**"Missing or insufficient permissions"**
- Ensure you're signed in: `firebase login`
- Check project: `firebase use learningos-2026`

**"Firestore has not been initialized"**
- Database must be created via Console first
- URL: https://console.firebase.google.com/project/learningos-2026/firestore

**Authentication errors**
- Check that Email/Password is enabled in Auth providers
- Verify authorized domains include "localhost"

**Service account errors**
- Verify FIREBASE_ADMIN_PRIVATE_KEY has proper newlines: `\n`
- Check that service account has Firestore and Auth permissions
