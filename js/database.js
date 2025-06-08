// Database module for Family Health Tracker
// Handles all database operations using Supabase

class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
  }

  initialize(supabaseClient, user) {
    this.supabase = supabaseClient;
    this.currentUser = user;
  }

  // Vital Signs Operations
  async saveVitalSign(vitalData) {
    try {
      const { data, error } = await this.supabase
        .from('vital_signs')
        .insert({
          user_id: this.currentUser.id,
          vital_type: vitalData.type,
          value: vitalData.value,
          systolic: vitalData.systolic || null,
          diastolic: vitalData.diastolic || null,
          recorded_at: vitalData.date,
          notes: vitalData.notes || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving vital sign:', error);
      throw error;
    }
  }

  async getVitalSigns(vitalType = null, limit = 100, days = 30) {
    try {
      let query = this.supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (vitalType) {
        query = query.eq('vital_type', vitalType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      throw error;
    }
  }

  async getLatestVitalSign(vitalType) {
    try {
      const { data, error } = await this.supabase
        .from('vital_signs')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .eq('vital_type', vitalType)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest vital sign:', error);
      return null;
    }
  }

  async deleteVitalSign(id) {
    try {
      const { error } = await this.supabase
        .from('vital_signs')
        .delete()
        .eq('id', id)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting vital sign:', error);
      throw error;
    }
  }

  // Blood Reports Operations
  async saveBloodReport(reportData) {
    try {
      const { data, error } = await this.supabase
        .from('blood_reports')
        .insert({
          user_id: this.currentUser.id,
          title: reportData.title,
          report_date: reportData.date,
          file_url: reportData.fileUrl,
          file_name: reportData.fileName,
          file_type: reportData.fileType,
          notes: reportData.notes || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving blood report:', error);
      throw error;
    }
  }

  async getBloodReports(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('blood_reports')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('report_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blood reports:', error);
      throw error;
    }
  }

  async deleteBloodReport(id) {
    try {
      // First get the report to delete the file
      const { data: report, error: fetchError } = await this.supabase
        .from('blood_reports')
        .select('file_url')
        .eq('id', id)
        .eq('user_id', this.currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the file from storage
      if (report.file_url) {
        const fileName = report.file_url.split('/').pop();
        await this.supabase.storage
          .from('blood-reports')
          .remove([`${this.currentUser.id}/${fileName}`]);
      }

      // Delete the database record
      const { error } = await this.supabase
        .from('blood_reports')
        .delete()
        .eq('id', id)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting blood report:', error);
      throw error;
    }
  }

  // File Upload Operations
  async uploadFile(file, folder = 'blood-reports') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${this.currentUser.id}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from(folder)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(folder)
        .getPublicUrl(filePath);

      return {
        path: data.path,
        url: publicUrl,
        fileName: file.name,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Family Management Operations
  async getFamilyMembers() {
    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .select(`
          *,
          member:user_profiles(id, full_name, email)
        `)
        .eq('family_admin_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching family members:', error);
      throw error;
    }
  }

  async inviteFamilyMember(memberData) {
    try {
      const { data, error } = await this.supabase
        .from('family_invitations')
        .insert({
          family_admin_id: this.currentUser.id,
          email: memberData.email,
          full_name: memberData.name,
          relationship: memberData.relationship,
          permissions: memberData.permissions,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error inviting family member:', error);
      throw error;
    }
  }

  // User Profile Operations
  async updateUserProfile(profileData) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          full_name: profileData.fullName,
          age: profileData.age,
          gender: profileData.gender,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Health Goals Operations
  async saveHealthGoal(goalData) {
    try {
      const { data, error } = await this.supabase
        .from('health_goals')
        .insert({
          user_id: this.currentUser.id,
          vital_type: goalData.vitalType,
          target_value: goalData.targetValue,
          target_date: goalData.targetDate,
          description: goalData.description,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving health goal:', error);
      throw error;
    }
  }

  async getHealthGoals() {
    try {
      const { data, error } = await this.supabase
        .from('health_goals')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching health goals:', error);
      throw error;
    }
  }

  // Analytics and Statistics
  async getVitalStatistics(vitalType, days = 30) {
    try {
      const vitals = await this.getVitalSigns(vitalType, 1000, days);
      
      if (vitals.length === 0) return null;

      const values = vitals.map(v => {
        if (vitalType === 'blood_pressure') {
          return { systolic: v.systolic, diastolic: v.diastolic, date: v.recorded_at };
        }
        return { value: v.value, date: v.recorded_at };
      });

      return {
        count: vitals.length,
        latest: values[0],
        oldest: values[values.length - 1],
        values: values,
      };
    } catch (error) {
      console.error('Error calculating vital statistics:', error);
      throw error;
    }
  }

  // Data Export
  async exportUserData() {
    try {
      const [vitals, reports, profile, goals] = await Promise.all([
        this.getVitalSigns(null, 10000, 365 * 2), // 2 years of data
        this.getBloodReports(1000),
        this.getUserProfile(),
        this.getHealthGoals(),
      ]);

      return {
        profile,
        vitals,
        reports,
        goals,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }
}

// Export for use in other modules
window.DatabaseManager = DatabaseManager;
