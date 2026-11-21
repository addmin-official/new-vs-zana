# Firebase Phone Authentication Setup

## Steps to enable phone login in Firebase Console:

1. Go to: https://console.firebase.google.com
2. Select project: new-vs-zana
3. Left menu → Build → Authentication
4. Click "Sign-in method" tab
5. Click "Phone" provider
6. Toggle "Enable" → Save

## Test phone numbers (for development):
Add these in Firebase Console → Authentication → 
Sign-in method → Phone → Scroll down → "Phone numbers for testing":

| Phone number    | Verification code |
|-----------------|-------------------|
| +9647501234567  | 123456            |
| +9647509876543  | 654321            |

## Authorized domains:
Firebase Console → Authentication → Settings → Authorized domains
Add: localhost, your-production-domain.com

## Important:
- Real OTP SMS requires Firebase Blaze plan (pay-as-you-go)
- Test numbers work on Spark plan (free)
- reCAPTCHA app-check must be configured for production
