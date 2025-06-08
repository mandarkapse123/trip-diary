# Family Health Tracker - Setup Guide

This guide will help you set up the Family Health Tracker application with Supabase backend.

## Prerequisites

- A modern web browser
- A Supabase account (free tier available)
- Basic knowledge of HTML/CSS/JavaScript

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Choose a database password and region
4. Wait for the project to be created (usually takes 2-3 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `database-schema.sql` from this project
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables, indexes, and security policies

## Step 3: Configure Storage

1. In Supabase dashboard, go to Storage
2. The `blood-reports` bucket should already be created by the schema
3. Verify that the bucket exists and has the correct policies

## Step 4: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon public key
3. Update `js/config.js` with your credentials:

```javascript
const SUPABASE_CONFIG = {
  url: 'YOUR_PROJECT_URL_HERE',
  anonKey: 'YOUR_ANON_KEY_HERE',
};
```

## Step 5: Configure the Application

1. Open `js/config.js`
2. Update the Supabase configuration with your credentials
3. Optionally, customize other settings like:
   - Maximum file upload size
   - Allowed file types
   - Chart colors
   - Notification settings

## Step 6: Test the Application

1. Open `index.html` in a web browser
2. You should see the authentication modal
3. Create a new account to test the signup process
4. Check your email for the confirmation link
5. After confirming, you should be able to access the main application

## Step 7: Enable Email Authentication (Optional)

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your email templates
3. Set up SMTP settings for custom email delivery
4. Test the email confirmation process

## Features Overview

### Core Features Implemented

✅ **User Authentication**
- Sign up/Sign in with email and password
- Email confirmation
- Secure session management

✅ **Vital Signs Tracking**
- Blood pressure, heart rate, weight, glucose, temperature, oxygen saturation
- Interactive charts and trends
- Reference ranges and status indicators
- Historical data analysis

✅ **Blood Report Management**
- File upload (PDF, images)
- Secure cloud storage
- Report organization and search
- Download and sharing capabilities

✅ **Family Management**
- Invite family members
- Role-based permissions
- Family health overview
- Data sharing controls

✅ **Dashboard & Analytics**
- Health trends visualization
- Recent vitals summary
- Family overview
- Alert system

✅ **Settings & Data Export**
- User profile management
- Data export functionality
- Privacy controls

### Database Schema

The application uses the following main tables:

- `user_profiles` - User information and preferences
- `vital_signs` - All vital sign measurements
- `blood_reports` - Blood test reports and files
- `family_members` - Family relationships and permissions
- `family_invitations` - Pending family invitations
- `health_goals` - User-defined health targets
- `health_alerts` - System-generated alerts
- `medications` - Medication tracking
- `appointments` - Medical appointments
- `data_sharing` - Granular data sharing permissions

### Security Features

- Row Level Security (RLS) on all tables
- User data isolation
- Secure file storage
- Family data sharing controls
- JWT-based authentication

## Customization Options

### Adding New Vital Types

1. Update `VITAL_SIGNS_CONFIG` in `js/config.js`
2. Add the new vital type to the database check constraint
3. Update the UI forms and displays
4. Add reference ranges and status logic

### Customizing Reference Ranges

1. Modify `VITAL_SIGNS_CONFIG` in `js/config.js`
2. Update the status calculation logic in `js/vitals.js`
3. Adjust chart reference lines in `js/charts.js`

### Adding Blood Test Parameters

1. Update `BLOOD_TEST_CONFIG` in `js/config.js`
2. Implement OCR extraction for automatic data entry
3. Add parameter-specific analysis and alerts

## Troubleshooting

### Common Issues

**Authentication not working:**
- Check Supabase URL and anon key in config.js
- Verify email confirmation is enabled
- Check browser console for errors

**File uploads failing:**
- Verify storage bucket exists and has correct policies
- Check file size and type restrictions
- Ensure user is authenticated

**Charts not displaying:**
- Verify Chart.js is loaded
- Check for JavaScript errors in console
- Ensure data is being fetched correctly

**Family invitations not working:**
- Check email configuration in Supabase
- Verify SMTP settings
- Test with a valid email address

### Getting Help

1. Check the browser console for error messages
2. Verify Supabase dashboard for any issues
3. Test database queries in Supabase SQL editor
4. Check network tab for failed API requests

## Next Steps

### Planned Enhancements

1. **Google Drive Integration**
   - Automatic backup of health data
   - Sync across devices
   - Share reports with healthcare providers

2. **Mobile App**
   - React Native or Flutter implementation
   - Push notifications
   - Offline data entry

3. **Advanced Analytics**
   - AI-powered health insights
   - Predictive analytics
   - Correlation analysis

4. **Healthcare Provider Integration**
   - Direct sharing with doctors
   - Appointment scheduling
   - Prescription management

5. **Wearable Device Integration**
   - Automatic data import
   - Real-time monitoring
   - Activity tracking

### Contributing

This is a comprehensive health tracking platform that can be extended with additional features. The modular architecture makes it easy to add new functionality while maintaining security and performance.

## Support

For technical support or feature requests, please refer to the documentation or create an issue in the project repository.
