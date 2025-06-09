# Supabase Email Verification Setup

## Issue: Safari Can't Connect to Server on Email Verification

This happens because Supabase doesn't know where to redirect users after they click the email verification link.

## Solution: Configure Redirect URLs in Supabase

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/zezfnvgtomnxhtlkbckp
2. Go to **Authentication** > **URL Configuration**

### Step 2: Add Redirect URLs
Add these URLs to the **Redirect URLs** section:

#### For Local Development:
```
http://localhost:3000
http://localhost:8000
http://127.0.0.1:3000
http://127.0.0.1:8000
file:///path/to/your/index.html
```

#### For GitHub Pages (if you're using it):
```
https://mandarkapse123.github.io/trip-diary/
https://mandarkapse123.github.io/trip-diary/index.html
```

#### For Your Domain (if you have one):
```
https://yourdomain.com
https://yourdomain.com/index.html
```

### Step 3: Configure Site URL
Set the **Site URL** to your main application URL:
- For local: `http://localhost:3000` or `file:///path/to/your/index.html`
- For GitHub Pages: `https://mandarkapse123.github.io/trip-diary/`
- For your domain: `https://yourdomain.com`

### Step 4: Test Email Verification

1. **Clear your browser cache** completely
2. **Try registering a new account** with a valid email
3. **Check your email** for the verification link
4. **Click the verification link** - it should now redirect properly
5. **You should be automatically logged in** to the application

## How the Fix Works

### Before (Broken):
- Email link redirects to default Supabase URL
- Safari can't connect because URL is not configured
- User gets "can't connect to server" error

### After (Fixed):
- Email link redirects to your application URL
- Application detects auth tokens in URL
- Automatically logs user in and cleans up URL
- Smooth user experience

## Additional Configuration (Optional)

### Custom Email Templates
You can customize the email templates in:
**Authentication** > **Email Templates**

### SMTP Settings
For production, configure custom SMTP in:
**Settings** > **Auth** > **SMTP Settings**

## Troubleshooting

### If Email Verification Still Fails:

1. **Check Redirect URLs**: Make sure your exact URL is in the list
2. **Check Site URL**: Must match your main application URL
3. **Clear Browser Cache**: Old cached redirects can cause issues
4. **Try Different Browser**: Test in incognito/private mode
5. **Check Console**: Look for any JavaScript errors

### Common URL Formats:

#### Local File:
```
file:///Users/yourname/path/to/trip-diary/index.html
file:///C:/path/to/trip-diary/index.html
```

#### Local Server:
```
http://localhost:3000
http://127.0.0.1:8080
```

#### GitHub Pages:
```
https://username.github.io/repository-name/
```

## Testing Checklist

- [ ] Redirect URLs configured in Supabase
- [ ] Site URL set correctly
- [ ] Browser cache cleared
- [ ] New account registration works
- [ ] Email verification link works
- [ ] User automatically logged in after verification
- [ ] No console errors

## Need Help?

If you're still having issues:
1. Share the exact URL you're accessing the app from
2. Share any console error messages
3. Confirm which redirect URLs you've added to Supabase

The email verification should work smoothly once the redirect URLs are properly configured!
