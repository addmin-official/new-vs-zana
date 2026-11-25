# Firebase Phone Authentication Setup

> **Status: Future / Unsupported in Current Release.**
> SMS and phone-based OTP registration/login are explicitly **out of scope** for the current ZANA production release (not a release blocker). ZANA currently supports verified Email/Password and Google Sign-In only, and server-side `/api/auth/phone/send-otp` fails closed with `503 SMS_PROVIDER_NOT_CONFIGURED`. Retain this document for future SMS activation only.

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
