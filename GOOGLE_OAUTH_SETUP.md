# Google OAuth Integration Guide for IIITDM AttendanceSync PWA

## Overview
This guide will help you set up Google OAuth authentication for your IIITDM AttendanceSync PWA, allowing students and staff to sign in with their @iiitdm.ac.in email addresses.

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Select a project" → "New Project"
   - Project name: `IIITDM AttendanceSync`
   - Organization: Select your organization (if applicable)
   - Click "Create"

## Step 2: Enable Google OAuth API

1. **Navigate to APIs & Services**
   - In the Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
   - Search for "Google OAuth2 API" and enable it

2. **Enable Gmail API (for email verification)**
   - Search for "Gmail API" and enable it

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Click "Create"

2. **Fill in App Information**
   ```
   App name: IIITDM AttendanceSync
   User support email: your-email@iiitdm.ac.in
   App domain: https://c3e9036d-91ed-41f4-9a1c-b59c3a7ef0d4.preview.emergentagent.com
   Authorized domains: emergentagent.com
   Developer contact: your-email@iiitdm.ac.in
   ```

3. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`

4. **Add Test Users**
   - Add your @iiitdm.ac.in email addresses for testing
   - Students and staff emails can be added here

## Step 4: Create OAuth Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"

2. **Configure Web Application**
   ```
   Application type: Web application
   Name: IIITDM AttendanceSync Web Client
   
   Authorized JavaScript origins:
   - https://c3e9036d-91ed-41f4-9a1c-b59c3a7ef0d4.preview.emergentagent.com
   - http://localhost:3000 (for development)
   
   Authorized redirect URIs:
   - https://c3e9036d-91ed-41f4-9a1c-b59c3a7ef0d4.preview.emergentagent.com/auth/callback
   - http://localhost:3000/auth/callback
   ```

3. **Download Credentials**
   - Click "Create"
   - Download the JSON file
   - You'll need the `client_id` and `client_secret`

## Step 5: Environment Variables

Add these to your `/app/frontend/.env` file:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Add these to your `/app/backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Install Required Dependencies

### Frontend Dependencies
```bash
cd /app/frontend
yarn add @google-cloud/oauth2 google-auth-library
```

### Backend Dependencies
```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

## Step 7: Implementation Files

The PWA is already structured to handle Google OAuth. You'll need to:

1. **Update Login Component** - Replace the mock Google login with real OAuth
2. **Add Backend OAuth Endpoint** - Create `/api/auth/google` endpoint
3. **Handle OAuth Callback** - Process the OAuth response

## Step 8: Testing

1. **Test with @iiitdm.ac.in emails**
   - Use test accounts you added in Step 3
   - Ensure email validation works properly

2. **Test PWA Installation**
   - Open the app in mobile Safari (iOS) or Chrome (Android)
   - Look for "Add to Home Screen" prompt
   - Test offline functionality

## Step 9: Domain Verification (Production)

For production deployment:

1. **Verify Domain Ownership**
   - Add your domain to Google Search Console
   - Verify ownership with HTML file or DNS record

2. **Update OAuth Settings**
   - Add your production domain to authorized origins
   - Update redirect URIs for production

## Security Notes

1. **Email Domain Validation**
   - The app already validates @iiitdm.ac.in emails
   - Server-side validation is also recommended

2. **HTTPS Required**
   - Google OAuth requires HTTPS in production
   - The current PWA is already served over HTTPS

3. **Token Security**
   - Store OAuth tokens securely
   - Implement token refresh mechanism
   - Use secure HTTP-only cookies for sensitive data

## Example OAuth Flow

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. User grants permission
4. Google redirects back with authorization code
5. Exchange code for access token
6. Verify email domain (@iiitdm.ac.in)
7. Create user session
8. Redirect to home page

## Next Steps

After setting up Google OAuth:

1. **Implement OpenAI Vision API** for face recognition
2. **Add Web Bluetooth API** for beacon detection
3. **Implement offline data sync** for attendance records
4. **Add push notifications** for attendance reminders

## Support

If you encounter any issues:
1. Check the Google Cloud Console for error messages
2. Verify all domains are properly configured
3. Ensure the OAuth consent screen is properly set up
4. Test with different @iiitdm.ac.in email addresses

---

**Ready to implement?** 
Once you have the Google OAuth credentials, we can integrate them into the PWA and test the complete authentication flow!