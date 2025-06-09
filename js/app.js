// Main application module for Family Health Tracker
// Coordinates all other modules and handles UI interactions

class FamilyHealthApp {
  constructor() {
    console.log('🏗️ FamilyHealthApp constructor called');
    this.db = new DatabaseManager();
    this.vitalsManager = null;
    this.reportsManager = null;
    this.familyManager = null;
    this.chartsManager = null;
    this.currentSection = 'dashboard';
    this.notifications = [];

    // Set up event listeners after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.setupEventListeners();
    }, 100);
  }

  async initialize() {
    try {
      // Get auth manager and user
      const authManager = window.authManager;
      const user = authManager.getCurrentUser();
      const supabase = authManager.getSupabaseClient();

      if (!user || !supabase) {
        throw new Error('User not authenticated');
      }

      // Initialize database manager
      this.db.initialize(supabase, user);

      // Initialize other managers
      this.vitalsManager = new VitalsManager(this.db);
      this.reportsManager = new ReportsManager(this.db);
      this.familyManager = new FamilyManager(this.db);
      this.chartsManager = new ChartsManager();

      // Load initial data
      await this.loadDashboard();
      
      this.showNotification('Application initialized successfully', 'success');
    } catch (error) {
      console.error('App initialization error:', error);
      this.showNotification('Failed to initialize application', 'error');
    }
  }

  setupEventListeners() {
    console.log('🎧 Setting up event listeners...');

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log('🔍 Found navigation buttons:', navButtons.length);

    navButtons.forEach((btn, index) => {
      console.log(`📱 Setting up nav button ${index}:`, btn.dataset.section);
      btn.addEventListener('click', (e) => {
        console.log('🖱️ Navigation button clicked:', e.target.closest('.nav-btn').dataset.section);
        const section = e.target.closest('.nav-btn').dataset.section;
        this.navigateToSection(section);
      });
    });

    // Modal controls
    this.setupModalControls();

    // Quick action buttons
    const addVitalBtn = document.getElementById('add-vital-btn');
    const uploadReportBtn = document.getElementById('upload-report-btn');
    const addVitalModalBtn = document.getElementById('add-vital-modal-btn');
    const uploadReportModalBtn = document.getElementById('upload-report-modal-btn');
    const inviteMemberBtn = document.getElementById('invite-member-btn');

    console.log('🔍 Found action buttons:', {
      addVitalBtn: !!addVitalBtn,
      uploadReportBtn: !!uploadReportBtn,
      addVitalModalBtn: !!addVitalModalBtn,
      uploadReportModalBtn: !!uploadReportModalBtn,
      inviteMemberBtn: !!inviteMemberBtn
    });

    addVitalBtn?.addEventListener('click', () => {
      console.log('🖱️ Add vital button clicked');
      this.showModal('add-vital-modal');
    });

    uploadReportBtn?.addEventListener('click', () => {
      console.log('🖱️ Upload report button clicked');
      this.showModal('upload-report-modal');
    });

    addVitalModalBtn?.addEventListener('click', () => {
      console.log('🖱️ Add vital modal button clicked');
      this.showModal('add-vital-modal');
    });

    uploadReportModalBtn?.addEventListener('click', () => {
      console.log('🖱️ Upload report modal button clicked');
      this.showModal('upload-report-modal');
    });

    inviteMemberBtn?.addEventListener('click', () => {
      console.log('🖱️ Invite member button clicked');
      this.showModal('invite-member-modal');
    });

    // Settings buttons
    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('google-drive-sync')?.addEventListener('click', () => {
      this.connectGoogleDrive();
    });
  }

  setupModalControls() {
    // Close modal buttons
    document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.hideModal(modal.id);
      });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
          this.hideModal(openModal.id);
        }
      }
    });
  }

  navigateToSection(section) {
    console.log('🧭 Navigating to section:', section);

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-section="${section}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      console.log('✅ Navigation button activated:', section);
    } else {
      console.error('❌ Navigation button not found for section:', section);
    }

    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      console.log('✅ Content section activated:', section);
    } else {
      console.error('❌ Content section not found:', `${section}-section`);
    }

    this.currentSection = section;

    // Load section-specific data
    this.loadSectionData(section);
  }

  async loadSectionData(section) {
    try {
      switch (section) {
        case 'dashboard':
          await this.loadDashboard();
          break;
        case 'vitals':
          if (this.vitalsManager) {
            await this.vitalsManager.loadVitals();
          }
          break;
        case 'reports':
          if (this.reportsManager) {
            await this.reportsManager.loadReports();
          }
          break;
        case 'family':
          if (this.familyManager) {
            await this.familyManager.loadFamily();
          }
          break;
        case 'settings':
          await this.loadSettings();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${section} data:`, error);
      this.showNotification(`Failed to load ${section} data`, 'error');
    }
  }

  async loadDashboard() {
    try {
      // Load recent vitals
      await this.loadRecentVitals();
      
      // Load health trends chart
      await this.loadHealthTrends();
      
      // Load family overview
      await this.loadFamilyOverview();
      
      // Load alerts
      await this.loadAlerts();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  async loadRecentVitals() {
    const container = document.getElementById('recent-vitals-list');
    if (!container) return;

    try {
      const vitals = await this.db.getVitalSigns(null, 5, 7); // Last 5 readings in 7 days
      
      if (vitals.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No recent vitals recorded</p>';
        return;
      }

      container.innerHTML = vitals.map(vital => {
        const config = VITAL_SIGNS_CONFIG[vital.vital_type];
        const value = vital.vital_type === 'blood_pressure' 
          ? `${vital.systolic}/${vital.diastolic} ${config.unit}`
          : `${vital.value} ${config.unit}`;
        
        return `
          <div class="vital-item">
            <div class="vital-item-icon">
              <i class="${config.icon}"></i>
            </div>
            <div class="vital-item-info">
              <div class="vital-item-name">${config.name}</div>
              <div class="vital-item-value">${value}</div>
              <div class="vital-item-date">${new Date(vital.recorded_at).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading recent vitals:', error);
      container.innerHTML = '<p class="text-center text-danger">Error loading vitals</p>';
    }
  }

  async loadHealthTrends() {
    const canvas = document.getElementById('trends-chart');
    const selector = document.getElementById('trend-selector');
    
    if (!canvas || !this.chartsManager) return;

    const vitalType = selector.value || 'blood_pressure';
    
    try {
      const vitals = await this.db.getVitalSigns(vitalType, 30, 30);
      this.chartsManager.createTrendChart(canvas, vitals, vitalType);
    } catch (error) {
      console.error('Error loading health trends:', error);
    }

    // Update chart when selector changes
    selector.addEventListener('change', async () => {
      const newVitalType = selector.value;
      try {
        const vitals = await this.db.getVitalSigns(newVitalType, 30, 30);
        this.chartsManager.createTrendChart(canvas, vitals, newVitalType);
      } catch (error) {
        console.error('Error updating trend chart:', error);
      }
    });
  }

  async loadFamilyOverview() {
    const container = document.getElementById('family-overview');
    if (!container) return;

    try {
      const familyMembers = await this.db.getFamilyMembers();
      
      if (familyMembers.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No family members added yet</p>';
        return;
      }

      container.innerHTML = familyMembers.map(member => `
        <div class="family-overview-item">
          <div class="member-avatar-small">
            ${member.member?.full_name?.charAt(0) || member.full_name?.charAt(0) || '?'}
          </div>
          <div class="member-info-small">
            <div class="member-name-small">${member.member?.full_name || member.full_name}</div>
            <div class="member-status-small ${member.status}">${member.status}</div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading family overview:', error);
      container.innerHTML = '<p class="text-center text-danger">Error loading family data</p>';
    }
  }

  async loadAlerts() {
    const container = document.getElementById('alerts-list');
    if (!container) return;

    // This would typically check for abnormal values, missed readings, etc.
    // For now, show a placeholder
    container.innerHTML = '<p class="text-center text-secondary">No alerts at this time</p>';
  }

  async loadSettings() {
    try {
      const profile = await this.db.getUserProfile();
      
      if (profile) {
        document.getElementById('user-name-setting').value = profile.full_name || '';
        document.getElementById('user-age').value = profile.age || '';
        document.getElementById('user-gender').value = profile.gender || '';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  showModal(modalId) {
    console.log('📱 showModal called for:', modalId);
    const modal = document.getElementById(modalId);
    console.log('🔍 Modal element found:', !!modal);

    if (modal) {
      modal.classList.remove('hidden');
      console.log('✅ Modal shown:', modalId);

      // Set current date/time for forms
      const dateTimeInput = modal.querySelector('input[type="datetime-local"]');
      if (dateTimeInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateTimeInput.value = now.toISOString().slice(0, 16);
      }

      const dateInput = modal.querySelector('input[type="date"]');
      if (dateInput && !dateTimeInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    } else {
      console.error('❌ Modal not found:', modalId);
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      
      // Reset form if it exists
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="${NOTIFICATION_CONFIG.types[type].icon}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Position notification
    const notifications = document.querySelectorAll('.notification');
    notification.style.top = `${20 + (notifications.length - 1) * 70}px`;

    // Auto remove after duration
    setTimeout(() => {
      this.removeNotification(notification);
    }, NOTIFICATION_CONFIG.duration);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });
  }

  removeNotification(notification) {
    if (notification && notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        notification.remove();
        
        // Reposition remaining notifications
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach((notif, index) => {
          notif.style.top = `${20 + index * 70}px`;
        });
      }, 300);
    }
  }

  async exportData() {
    try {
      const data = await this.db.exportUserData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showNotification('Failed to export data', 'error');
    }
  }

  async connectGoogleDrive() {
    // Google Drive integration would be implemented here
    this.showNotification('Google Drive integration coming soon', 'info');
  }
}

// Initialize app when DOM is loaded or immediately if already loaded
function initializeApp() {
  console.log('🚀 Initializing FamilyHealthApp...');
  if (!window.app) {
    window.app = new FamilyHealthApp();
    console.log('✅ FamilyHealthApp created and assigned to window.app');
  } else {
    console.log('ℹ️ FamilyHealthApp already exists');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
