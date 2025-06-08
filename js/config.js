// Configuration file for Family Health Tracker
// This file contains all the configuration settings and constants

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://zezfnvgtomnxhtlkbckp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplemZudmd0b21ueGh0bGtiY2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDI4ODEsImV4cCI6MjA2NDk3ODg4MX0.dHo5u_t5Llfvxz8shiCPiYNhxWFZoyTo9CD5AErMiew',
};

// Application Configuration
const APP_CONFIG = {
  name: 'Family Health Tracker',
  version: '1.0.0',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
  chartColors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
};

// Vital Signs Configuration
const VITAL_SIGNS_CONFIG = {
  blood_pressure: {
    name: 'Blood Pressure',
    unit: 'mmHg',
    icon: 'fas fa-heartbeat',
    fields: ['systolic', 'diastolic'],
    ranges: {
      normal: { systolic: [90, 120], diastolic: [60, 80] },
      elevated: { systolic: [120, 129], diastolic: [60, 80] },
      stage1: { systolic: [130, 139], diastolic: [80, 89] },
      stage2: { systolic: [140, 180], diastolic: [90, 120] },
      crisis: { systolic: [180, 300], diastolic: [120, 200] },
    },
  },
  heart_rate: {
    name: 'Heart Rate',
    unit: 'bpm',
    icon: 'fas fa-heart',
    fields: ['value'],
    ranges: {
      normal: [60, 100],
      bradycardia: [40, 59],
      tachycardia: [101, 200],
    },
  },
  weight: {
    name: 'Weight',
    unit: 'kg',
    icon: 'fas fa-weight',
    fields: ['value'],
    ranges: {
      // BMI-based ranges will be calculated dynamically
    },
  },
  glucose: {
    name: 'Blood Glucose',
    unit: 'mg/dL',
    icon: 'fas fa-tint',
    fields: ['value'],
    ranges: {
      normal: [70, 99],
      prediabetes: [100, 125],
      diabetes: [126, 400],
      hypoglycemia: [40, 69],
    },
  },
  temperature: {
    name: 'Temperature',
    unit: '°F',
    icon: 'fas fa-thermometer-half',
    fields: ['value'],
    ranges: {
      hypothermia: [95, 97],
      normal: [97.1, 99.9],
      fever: [100, 103],
      highFever: [103.1, 106],
    },
  },
  oxygen: {
    name: 'Oxygen Saturation',
    unit: '%',
    icon: 'fas fa-lungs',
    fields: ['value'],
    ranges: {
      normal: [95, 100],
      mild: [90, 94],
      moderate: [85, 89],
      severe: [80, 84],
    },
  },
};

// Blood Test Parameters Configuration
const BLOOD_TEST_CONFIG = {
  complete_blood_count: {
    name: 'Complete Blood Count (CBC)',
    parameters: {
      hemoglobin: { name: 'Hemoglobin', unit: 'g/dL', ranges: { male: [13.8, 17.2], female: [12.1, 15.1] } },
      hematocrit: { name: 'Hematocrit', unit: '%', ranges: { male: [40.7, 50.3], female: [36.1, 44.3] } },
      rbc: { name: 'Red Blood Cells', unit: 'million/μL', ranges: { male: [4.7, 6.1], female: [4.2, 5.4] } },
      wbc: { name: 'White Blood Cells', unit: 'thousand/μL', ranges: { all: [4.5, 11.0] } },
      platelets: { name: 'Platelets', unit: 'thousand/μL', ranges: { all: [150, 450] } },
    },
  },
  lipid_panel: {
    name: 'Lipid Panel',
    parameters: {
      total_cholesterol: { name: 'Total Cholesterol', unit: 'mg/dL', ranges: { desirable: [0, 199], borderline: [200, 239], high: [240, 500] } },
      ldl: { name: 'LDL Cholesterol', unit: 'mg/dL', ranges: { optimal: [0, 99], near_optimal: [100, 129], borderline: [130, 159], high: [160, 189], very_high: [190, 500] } },
      hdl: { name: 'HDL Cholesterol', unit: 'mg/dL', ranges: { low: [0, 39], good: [40, 59], high: [60, 100] } },
      triglycerides: { name: 'Triglycerides', unit: 'mg/dL', ranges: { normal: [0, 149], borderline: [150, 199], high: [200, 499], very_high: [500, 1000] } },
    },
  },
  basic_metabolic: {
    name: 'Basic Metabolic Panel',
    parameters: {
      glucose: { name: 'Glucose', unit: 'mg/dL', ranges: { normal: [70, 99], prediabetes: [100, 125], diabetes: [126, 400] } },
      sodium: { name: 'Sodium', unit: 'mEq/L', ranges: { normal: [136, 145] } },
      potassium: { name: 'Potassium', unit: 'mEq/L', ranges: { normal: [3.5, 5.0] } },
      chloride: { name: 'Chloride', unit: 'mEq/L', ranges: { normal: [98, 107] } },
      bun: { name: 'Blood Urea Nitrogen', unit: 'mg/dL', ranges: { normal: [7, 20] } },
      creatinine: { name: 'Creatinine', unit: 'mg/dL', ranges: { male: [0.74, 1.35], female: [0.59, 1.04] } },
    },
  },
  liver_function: {
    name: 'Liver Function Tests',
    parameters: {
      alt: { name: 'ALT', unit: 'U/L', ranges: { male: [10, 40], female: [7, 35] } },
      ast: { name: 'AST', unit: 'U/L', ranges: { normal: [10, 40] } },
      bilirubin_total: { name: 'Total Bilirubin', unit: 'mg/dL', ranges: { normal: [0.3, 1.2] } },
      albumin: { name: 'Albumin', unit: 'g/dL', ranges: { normal: [3.5, 5.0] } },
    },
  },
  thyroid: {
    name: 'Thyroid Function',
    parameters: {
      tsh: { name: 'TSH', unit: 'mIU/L', ranges: { normal: [0.4, 4.0] } },
      t4: { name: 'Free T4', unit: 'ng/dL', ranges: { normal: [0.8, 1.8] } },
      t3: { name: 'Free T3', unit: 'pg/mL', ranges: { normal: [2.3, 4.2] } },
    },
  },
};

// Chart Configuration
const CHART_CONFIG = {
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
  },
  colors: {
    primary: 'rgba(37, 99, 235, 0.8)',
    secondary: 'rgba(100, 116, 139, 0.8)',
    success: 'rgba(16, 185, 129, 0.8)',
    warning: 'rgba(245, 158, 11, 0.8)',
    danger: 'rgba(239, 68, 68, 0.8)',
  },
};

// Google Drive Configuration
const GOOGLE_DRIVE_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Google Client ID
  apiKey: 'YOUR_GOOGLE_API_KEY', // Replace with your Google API Key
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  scopes: 'https://www.googleapis.com/auth/drive.file',
};

// Notification Configuration
const NOTIFICATION_CONFIG = {
  types: {
    success: { icon: 'fas fa-check-circle', color: '#10b981' },
    warning: { icon: 'fas fa-exclamation-triangle', color: '#f59e0b' },
    error: { icon: 'fas fa-times-circle', color: '#ef4444' },
    info: { icon: 'fas fa-info-circle', color: '#2563eb' },
  },
  duration: 5000, // 5 seconds
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SUPABASE_CONFIG,
    APP_CONFIG,
    VITAL_SIGNS_CONFIG,
    BLOOD_TEST_CONFIG,
    CHART_CONFIG,
    GOOGLE_DRIVE_CONFIG,
    NOTIFICATION_CONFIG,
  };
}
