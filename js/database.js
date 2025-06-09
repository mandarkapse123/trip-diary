// Database module for Family Health Tracker
// Handles all database operations using Supabase

class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.demoMode = false;
    this.demoData = {
      vitals: [],
      reports: [],
      documents: [],
      photos: [],
      family: []
    };
  }

  initialize(supabaseClient, user) {
    this.supabase = supabaseClient;
    this.currentUser = user;
    this.demoMode = SUPABASE_CONFIG.url === 'DEMO_MODE' || !supabaseClient;

    console.log('🗄️ Database initialized:', {
      demoMode: this.demoMode,
      hasUser: !!user,
      supabaseUrl: SUPABASE_CONFIG.url,
      hasSupabaseClient: !!supabaseClient,
      userEmail: user?.email
    });

    if (this.demoMode) {
      console.log('🎭 Running in DEMO MODE - Data will not be saved to Supabase');
      this.initializeDemoData();
    } else {
      console.log('☁️ Running with REAL SUPABASE - Data will be saved to cloud database');
      console.log('📊 Supabase URL:', SUPABASE_CONFIG.url);
      // Test Supabase connection
      this.testSupabaseConnection();
    }
  }

  initializeDemoData() {
    // Generate some demo vital signs data
    const now = new Date();
    const demoVitals = [];

    // Generate 30 days of demo data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));

      // Blood pressure
      demoVitals.push({
        id: `demo-bp-${i}`,
        user_id: this.currentUser.id,
        vital_type: 'blood_pressure',
        systolic: 110 + Math.floor(Math.random() * 20),
        diastolic: 70 + Math.floor(Math.random() * 15),
        value: 110 + Math.floor(Math.random() * 20),
        recorded_at: date.toISOString(),
        notes: i === 0 ? 'Latest reading' : null,
        created_at: date.toISOString()
      });

      // Heart rate
      if (i % 2 === 0) {
        demoVitals.push({
          id: `demo-hr-${i}`,
          user_id: this.currentUser.id,
          vital_type: 'heart_rate',
          value: 65 + Math.floor(Math.random() * 20),
          recorded_at: date.toISOString(),
          created_at: date.toISOString()
        });
      }

      // Weight (weekly)
      if (i % 7 === 0) {
        demoVitals.push({
          id: `demo-weight-${i}`,
          user_id: this.currentUser.id,
          vital_type: 'weight',
          value: 70 + Math.floor(Math.random() * 10),
          recorded_at: date.toISOString(),
          created_at: date.toISOString()
        });
      }
    }

    this.demoData.vitals = demoVitals;

    // Demo reports
    this.demoData.reports = [
      {
        id: 'demo-report-1',
        user_id: this.currentUser.id,
        title: 'Annual Physical Exam',
        report_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        file_url: '#',
        file_name: 'annual-physical-2024.pdf',
        file_type: 'application/pdf',
        notes: 'All values within normal range',
        created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-report-2',
        user_id: this.currentUser.id,
        title: 'Lipid Panel',
        report_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        file_url: '#',
        file_name: 'lipid-panel-2024.pdf',
        file_type: 'application/pdf',
        notes: 'Cholesterol slightly elevated',
        created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Demo family
    this.demoData.family = [
      {
        id: 'demo-family-1',
        family_admin_id: this.currentUser.id,
        member_user_id: 'demo-spouse',
        relationship: 'spouse',
        status: 'active',
        permissions: { can_view_family: true, can_manage_family: false },
        member: {
          full_name: 'Jane Demo',
          email: 'jane@demo.com'
        }
      },
      {
        id: 'demo-family-2',
        family_admin_id: this.currentUser.id,
        email: 'john@demo.com',
        full_name: 'John Demo Jr.',
        relationship: 'child',
        status: 'pending',
        permissions: { can_view_family: false, can_manage_family: false }
      }
    ];
  }

  async testSupabaseConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        console.log('🎭 Falling back to demo mode due to connection error');
        this.demoMode = true;
        this.initializeDemoData();
      } else {
        console.log('✅ Supabase connection successful!');
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      console.log('🎭 Falling back to demo mode due to connection error');
      this.demoMode = true;
      this.initializeDemoData();
    }
  }

  // Vital Signs Operations
  async saveVitalSign(vitalData) {
    try {
      if (this.demoMode) {
        const newVital = {
          id: `demo-${Date.now()}`,
          user_id: this.currentUser.id,
          vital_type: vitalData.type,
          value: vitalData.value,
          systolic: vitalData.systolic || null,
          diastolic: vitalData.diastolic || null,
          recorded_at: vitalData.date,
          notes: vitalData.notes || null,
          created_at: new Date().toISOString(),
        };
        this.demoData.vitals.unshift(newVital);
        return newVital;
      }

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
      if (this.demoMode) {
        let filteredVitals = this.demoData.vitals.filter(vital => {
          const vitalDate = new Date(vital.recorded_at);
          const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          return vitalDate >= cutoffDate;
        });

        if (vitalType) {
          filteredVitals = filteredVitals.filter(vital => vital.vital_type === vitalType);
        }

        return filteredVitals
          .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
          .slice(0, limit);
      }

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
      if (this.demoMode) {
        const vitals = this.demoData.vitals
          .filter(vital => vital.vital_type === vitalType)
          .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
        return vitals.length > 0 ? vitals[0] : null;
      }

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
      if (this.demoMode) {
        return this.demoData.reports
          .sort((a, b) => new Date(b.report_date) - new Date(a.report_date))
          .slice(0, limit);
      }

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
      if (this.demoMode) {
        return this.demoData.family;
      }

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

  // Document Management Operations
  async saveDocument(documentData) {
    try {
      if (this.demoMode) {
        const newDocument = {
          id: `demo-doc-${Date.now()}`,
          user_id: this.currentUser.id,
          title: documentData.title,
          category: documentData.category,
          family_member: documentData.family_member,
          date: documentData.date,
          notes: documentData.notes,
          tags: documentData.tags,
          fileUrl: documentData.fileUrl,
          fileName: documentData.fileName,
          fileType: documentData.fileType,
          uploadDate: new Date().toISOString()
        };
        this.demoData.documents.unshift(newDocument);
        return newDocument;
      }

      const { data, error } = await this.supabase
        .from('medical_documents')
        .insert({
          user_id: this.currentUser.id,
          title: documentData.title,
          category: documentData.category,
          family_member: documentData.family_member,
          document_date: documentData.date,
          notes: documentData.notes,
          tags: documentData.tags,
          file_url: documentData.fileUrl,
          file_name: documentData.fileName,
          file_type: documentData.fileType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async getDocuments(limit = 50) {
    try {
      if (this.demoMode) {
        return this.demoData.documents
          .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
          .slice(0, limit);
      }

      const { data, error } = await this.supabase
        .from('medical_documents')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async getRecentDocuments(limit = 5) {
    return this.getDocuments(limit);
  }

  // Photo Management Operations
  async savePhoto(photoData) {
    try {
      if (this.demoMode) {
        const newPhoto = {
          id: `demo-photo-${Date.now()}`,
          user_id: this.currentUser.id,
          title: photoData.title,
          category: photoData.category,
          family_member: photoData.family_member,
          date: photoData.date,
          notes: photoData.notes,
          tags: photoData.tags,
          imageUrl: photoData.imageUrl,
          fileName: photoData.fileName,
          fileType: photoData.fileType,
          uploadDate: new Date().toISOString()
        };
        this.demoData.photos.unshift(newPhoto);
        return newPhoto;
      }

      const { data, error } = await this.supabase
        .from('medical_photos')
        .insert({
          user_id: this.currentUser.id,
          title: photoData.title,
          category: photoData.category,
          family_member: photoData.family_member,
          photo_date: photoData.date,
          notes: photoData.notes,
          tags: photoData.tags,
          image_url: photoData.imageUrl,
          file_name: photoData.fileName,
          file_type: photoData.fileType,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  async getPhotos(limit = 50) {
    try {
      if (this.demoMode) {
        return this.demoData.photos
          .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
          .slice(0, limit);
      }

      const { data, error } = await this.supabase
        .from('medical_photos')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  }

  async getRecentPhotos(limit = 5) {
    return this.getPhotos(limit);
  }

  // Dashboard helper methods
  async getLatestVitals() {
    try {
      const vitalTypes = ['blood_pressure', 'heart_rate', 'weight', 'temperature'];
      const latestVitals = [];

      for (const type of vitalTypes) {
        const latest = await this.getLatestVitalSign(type);
        if (latest) {
          let value, status;

          switch (type) {
            case 'blood_pressure':
              value = `${latest.systolic}/${latest.diastolic}`;
              status = latest.systolic > 140 || latest.diastolic > 90 ? 'warning' : 'normal';
              break;
            case 'heart_rate':
              value = latest.value.toString();
              status = latest.value > 100 || latest.value < 60 ? 'warning' : 'normal';
              break;
            case 'weight':
              value = latest.value.toString();
              status = 'normal';
              break;
            case 'temperature':
              value = latest.value.toString();
              status = latest.value > 37.5 ? 'warning' : 'normal';
              break;
          }

          latestVitals.push({
            type,
            value,
            unit: this.getVitalUnit(type),
            status,
            lastUpdated: latest.recorded_at
          });
        }
      }

      return latestVitals;
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      return [];
    }
  }

  async getRecentVitals(limit = 5) {
    try {
      const vitals = await this.getVitalSigns(null, limit, 30);
      return vitals.map(vital => ({
        type: this.getVitalDisplayName(vital.vital_type),
        value: vital.vital_type === 'blood_pressure' ?
               `${vital.systolic}/${vital.diastolic} ${this.getVitalUnit(vital.vital_type)}` :
               `${vital.value} ${this.getVitalUnit(vital.vital_type)}`,
        date: vital.recorded_at
      }));
    } catch (error) {
      console.error('Error fetching recent vitals:', error);
      return [];
    }
  }

  getVitalDisplayName(type) {
    const names = {
      blood_pressure: 'Blood Pressure',
      heart_rate: 'Heart Rate',
      weight: 'Weight',
      temperature: 'Temperature',
      bmi: 'BMI'
    };
    return names[type] || type;
  }

  getVitalUnit(type) {
    const units = {
      blood_pressure: 'mmHg',
      heart_rate: 'bpm',
      weight: 'kg',
      temperature: '°C',
      bmi: ''
    };
    return units[type] || '';
  }
}

// Export for use in other modules
window.DatabaseManager = DatabaseManager;
