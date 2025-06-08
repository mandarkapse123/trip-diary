-- Family Health Tracker Database Schema
-- Run this SQL in your Supabase SQL editor to create all necessary tables

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_cm DECIMAL(5,2),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create vital signs table
CREATE TABLE vital_signs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vital_type TEXT NOT NULL CHECK (vital_type IN ('blood_pressure', 'heart_rate', 'weight', 'glucose', 'temperature', 'oxygen')),
  value DECIMAL(10,2),
  systolic INTEGER, -- For blood pressure
  diastolic INTEGER, -- For blood pressure
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood reports table
CREATE TABLE blood_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_date DATE NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  notes TEXT,
  extracted_data JSONB, -- For OCR extracted data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create family members table
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse', 'child', 'parent', 'sibling', 'other')),
  permissions JSONB DEFAULT '{"can_view_family": false, "can_manage_family": false}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_admin_id, member_user_id)
);

-- Create family invitations table
CREATE TABLE family_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  permissions JSONB DEFAULT '{"can_view_family": false, "can_manage_family": false}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health goals table
CREATE TABLE health_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vital_type TEXT NOT NULL,
  target_value DECIMAL(10,2),
  target_systolic INTEGER, -- For blood pressure goals
  target_diastolic INTEGER, -- For blood pressure goals
  target_date DATE,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health alerts table
CREATE TABLE health_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('abnormal_vital', 'missed_reading', 'goal_achieved', 'emergency')),
  vital_type TEXT,
  vital_id UUID REFERENCES vital_signs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication tracking table
CREATE TABLE medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointment tracking table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  doctor_name TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data sharing permissions table
CREATE TABLE data_sharing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('vitals', 'reports', 'goals', 'medications', 'appointments')),
  data_id UUID, -- References the specific record being shared
  permissions JSONB DEFAULT '{"can_view": true, "can_edit": false}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_user_id, shared_with_user_id, data_type, data_id)
);

-- Create indexes for better performance
CREATE INDEX idx_vital_signs_user_type_date ON vital_signs(user_id, vital_type, recorded_at DESC);
CREATE INDEX idx_blood_reports_user_date ON blood_reports(user_id, report_date DESC);
CREATE INDEX idx_family_members_admin ON family_members(family_admin_id);
CREATE INDEX idx_family_invitations_email ON family_invitations(email);
CREATE INDEX idx_health_alerts_user_unread ON health_alerts(user_id, is_read, created_at DESC);
CREATE INDEX idx_medications_user_active ON medications(user_id, is_active);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sharing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vital signs: Users can access their own data + family shared data
CREATE POLICY "Users can view own vital signs" ON vital_signs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vital signs" ON vital_signs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vital signs" ON vital_signs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vital signs" ON vital_signs
  FOR DELETE USING (auth.uid() = user_id);

-- Blood reports: Users can access their own reports
CREATE POLICY "Users can view own blood reports" ON blood_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood reports" ON blood_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood reports" ON blood_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood reports" ON blood_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Family members: Users can manage their family
CREATE POLICY "Users can view their family members" ON family_members
  FOR SELECT USING (auth.uid() = family_admin_id OR auth.uid() = member_user_id);

CREATE POLICY "Family admins can manage family members" ON family_members
  FOR ALL USING (auth.uid() = family_admin_id);

-- Family invitations: Users can manage their invitations
CREATE POLICY "Users can manage their family invitations" ON family_invitations
  FOR ALL USING (auth.uid() = family_admin_id);

-- Health goals: Users can manage their own goals
CREATE POLICY "Users can manage own health goals" ON health_goals
  FOR ALL USING (auth.uid() = user_id);

-- Health alerts: Users can view their own alerts
CREATE POLICY "Users can view own health alerts" ON health_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create health alerts" ON health_alerts
  FOR INSERT WITH CHECK (true);

-- Medications: Users can manage their own medications
CREATE POLICY "Users can manage own medications" ON medications
  FOR ALL USING (auth.uid() = user_id);

-- Appointments: Users can manage their own appointments
CREATE POLICY "Users can manage own appointments" ON appointments
  FOR ALL USING (auth.uid() = user_id);

-- Data sharing: Users can manage sharing of their own data
CREATE POLICY "Users can manage data sharing" ON data_sharing
  FOR ALL USING (auth.uid() = owner_user_id OR auth.uid() = shared_with_user_id);

-- Create storage bucket for blood reports
INSERT INTO storage.buckets (id, name, public) VALUES ('blood-reports', 'blood-reports', false);

-- Create storage policy for blood reports
CREATE POLICY "Users can upload their own blood reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blood-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own blood reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'blood-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own blood reports" ON storage.objects
  FOR DELETE USING (bucket_id = 'blood-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create functions for automated tasks

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vital_signs_updated_at BEFORE UPDATE ON vital_signs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blood_reports_updated_at BEFORE UPDATE ON blood_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_invitations_updated_at BEFORE UPDATE ON family_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
