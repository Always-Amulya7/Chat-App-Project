# 🔒 Security Configuration Guide

## Environment Variables Setup

This project uses environment variables to secure sensitive Firebase configuration data.

### 📋 Setup Instructions

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your Firebase config:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General
   - Copy your Firebase configuration values
   - Replace the placeholder values in `.env`

### 🚨 Security Best Practices

- ✅ **NEVER** commit `.env` files to version control
- ✅ Use environment variables for all sensitive data
- ✅ Use different Firebase projects for development/production
- ✅ Regularly rotate API keys
- ✅ Set up Firebase security rules

### 🔧 Firebase Security Rules

For **Firestore**, add these security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages can be read/written by authenticated users only
    match /messages/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For **Firebase Storage** (if using file uploads):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 🌐 Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Set environment variables in your hosting platform
2. Use the same variable names (VITE\_**FIREBASE**)
3. Never expose sensitive keys in client-side code
4. Consider using Firebase Admin SDK for server-side operations

### 🚨 What to Do If Keys Are Exposed

If you accidentally committed sensitive keys:

1. **Immediately regenerate** your Firebase API keys
2. Update your `.env` file with new keys
3. Remove the sensitive commit from git history:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch src/firebase-config.js' \
   --prune-empty --tag-name-filter cat -- --all
   ```
4. Force push to remote repository
5. Update any deployed applications with new keys

### 📞 Security Questions?

If you have security concerns or find vulnerabilities, please:

- Open a security issue (mark as security vulnerability)
- Contact maintainers directly
- Follow responsible disclosure practices
