# Day 2 Setup Guide: External Services

> **Goal:** Set up all external services needed for LearningOS to run

---

## 1. Firebase Setup

### Step 1.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: **LearningOS** (or your preferred name)
4. Enable Google Analytics: **Optional** (recommended for production)
5. Click "Create project"

### Step 1.2: Register Web App

1. In your Firebase project, click the **Web** icon (`</>`)
2. App nickname: **LearningOS Web**
3. ✅ Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase config** - you'll need these values

### Step 1.3: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Save
4. Enable **Google**:
   - Click "Google"
   - Toggle "Enable"
   - Enter support email (your email)
   - Save

### Step 1.4: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** → **Create database**
2. Select **Start in production mode** (we'll set rules properly)
3. Choose location: **us-central1** (or closest to your users)
4. Click "Enable"

### Step 1.5: Set Firestore Security Rules

Once database is created, go to **Rules** tab and replace with:

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
      
      // User's learning sessions
      match /sessions/{sessionId} {
        allow read, write: if isOwner(userId);
        
        // Messages within sessions
        match /messages/{messageId} {
          allow read, write: if isOwner(userId);
        }
      }
      
      // User's concepts
      match /userConcepts/{conceptId} {
        allow read, write: if isOwner(userId);
      }
      
      // User's concept relations
      match /conceptRelations/{relationId} {
        allow read, write: if isOwner(userId);
      }
      
      // User's reflections
      match /reflections/{reflectionId} {
        allow read, write: if isOwner(userId);
      }
      
      // User's learning paths
      match /learningPaths/{pathId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Global concepts - read by all authenticated, write by server only
    match /concepts/{conceptId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only server can write
    }
  }
}
```

Click **Publish**

### Step 1.6: Generate Service Account Key (for server-side)

1. Go to **Project Settings** (gear icon) → **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file securely (DO NOT commit to git)
4. Extract these values for your `.env.local`:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

---

## 2. OpenAI Setup

### Step 2.1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to **API keys** section

### Step 2.2: Generate API Key

1. Click **Create new secret key**
2. Name: **LearningOS Development**
3. **Copy the key immediately** (you can't see it again)
4. Save to your `.env.local` as `OPENAI_API_KEY`

### Step 2.3: Set Usage Limits (Recommended)

1. Go to **Billing** → **Usage limits**
2. Set a monthly budget (e.g., $20 for development)
3. Set email notifications at 50%, 75%, 90%

---

## 3. Redis Cloud Setup (Optional for MVP)

> **Note:** Redis is optional for MVP. You can skip this and add it later for caching.

### If you want to set up Redis:

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free tier (30MB free)
3. Create a new database
4. Copy the connection string
5. Add to `.env.local` as `REDIS_URL`

---

## 4. Vercel Setup

### Step 4.1: Create Vercel Account

1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub (recommended)
3. Install Vercel CLI (optional but helpful):
   ```bash
   npm install -g vercel
   ```

### Step 4.2: Connect Repository

1. Push your code to GitHub (if you haven't already)
2. In Vercel dashboard, click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 4.3: Configure Environment Variables

In Vercel project settings → **Environment Variables**, add all your variables from `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_PRIMARY`
- `OPENAI_MODEL_FALLBACK`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)

---

## 5. Configure Local Environment

### Step 5.1: Create `.env.local`

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 5.2: Fill in Values

Edit `.env.local` with all the values you collected:

```env
# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=learningos-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learningos-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=learningos-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin (from service account JSON)
FIREBASE_ADMIN_PROJECT_ID=learningos-xxxxx
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@learningos-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_PRIMARY=gpt-4
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created with security rules
- [ ] Firebase service account key generated
- [ ] OpenAI API key created
- [ ] `.env.local` file created and filled
- [ ] Vercel project created (optional for now)

---

## Next Steps

Once all services are configured, we'll:

1. Create Firebase configuration files in `src/lib/firebase/`
2. Create OpenAI service wrapper in `src/lib/ai/`
3. Test connections to ensure everything works
4. Create initial data models in TypeScript

---

## Troubleshooting

### Firebase Auth not working
- Check if domain is authorized in Firebase Console → Authentication → Settings → Authorized domains
- For localhost, `localhost` should be pre-authorized

### OpenAI API errors
- Verify API key is correct
- Check billing is set up in OpenAI dashboard
- Ensure usage limits haven't been exceeded

### Firestore permission denied
- Verify security rules are published
- Check user is authenticated before making requests
- Verify user ID matches the document path

---

**Ready?** Once you've completed these setup steps, let me know and we'll create the integration code!
