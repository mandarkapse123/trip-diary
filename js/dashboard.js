// Dashboard Manager for Family Health Tracker
// Handles dashboard data population and health overview

class DashboardManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    console.log('🏗️ DashboardManager constructor called');
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('🎧 Setting up dashboard event listeners...');
    
    // Chart controls
    const chartMetric = document.getElementById('chart-metric');
    const chartPeriod = document.getElementById('chart-period');
    
    if (chartMetric) {
      chartMetric.addEventListener('change', () => {
        console.log('📊 Chart metric changed:', chartMetric.value);
        this.updateHealthTrends();
      });
    }
    
    if (chartPeriod) {
      chartPeriod.addEventListener('change', () => {
        console.log('📅 Chart period changed:', chartPeriod.value);
        this.updateHealthTrends();
      });
    }
  }

  async loadDashboard() {
    console.log('📊 Loading dashboard data...');
    try {
      await Promise.all([
        this.loadFamilyHealthSummary(),
        this.loadHealthParameters(),
        this.loadRecentActivity(),
        this.updateHealthTrends()
      ]);
      console.log('✅ Dashboard loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showNotification('Failed to load dashboard', 'error');
    }
  }

  async loadFamilyHealthSummary() {
    console.log('👨‍👩‍👧‍👦 Loading family health summary...');
    const container = document.getElementById('family-health-summary');
    if (!container) return;

    try {
      // For demo mode, create sample family data
      const familyMembers = this.db.demoMode ? [
        {
          id: 'demo-user-1',
          name: 'John Doe',
          age: 45,
          relationship: 'self',
          healthStatus: 'good',
          lastCheckup: '2024-01-15'
        },
        {
          id: 'demo-user-2',
          name: 'Jane Doe',
          age: 42,
          relationship: 'spouse',
          healthStatus: 'warning',
          lastCheckup: '2024-01-10'
        },
        {
          id: 'demo-user-3',
          name: 'Emma Doe',
          age: 16,
          relationship: 'child',
          healthStatus: 'good',
          lastCheckup: '2024-01-20'
        }
      ] : await this.db.getFamilyMembers();

      if (familyMembers.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-users fa-2x"></i>
            <h4>No Family Members</h4>
            <p>Add family members to see their health overview</p>
            <button class="btn btn-primary" onclick="document.getElementById('invite-member-btn').click()">
              <i class="fas fa-user-plus"></i>
              Add Family Member
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = familyMembers.map(member => this.createFamilyMemberCard(member)).join('');
    } catch (error) {
      console.error('❌ Error loading family summary:', error);
      container.innerHTML = '<p class="text-secondary">Failed to load family health summary</p>';
    }
  }

  createFamilyMemberCard(member) {
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const statusClass = member.healthStatus || 'good';
    
    return `
      <div class="family-member-card">
        <div class="member-header">
          <div class="member-avatar">${initials}</div>
          <div class="member-info">
            <h4>${member.name}</h4>
            <span class="age">${member.age} years old</span>
          </div>
        </div>
        <div class="health-status">
          <span class="status-indicator ${statusClass}"></span>
          <span class="status-text">${this.getStatusText(statusClass)}</span>
        </div>
        <div class="last-checkup">
          <small>Last checkup: ${new Date(member.lastCheckup).toLocaleDateString()}</small>
        </div>
      </div>
    `;
  }

  async loadHealthParameters() {
    console.log('📊 Loading health parameters...');
    const container = document.getElementById('health-parameters-grid');
    if (!container) return;

    try {
      // For demo mode, create sample parameter data
      const parameters = this.db.demoMode ? [
        {
          type: 'blood_pressure',
          value: '120/80',
          unit: 'mmHg',
          status: 'normal',
          lastUpdated: '2024-01-15'
        },
        {
          type: 'heart_rate',
          value: '72',
          unit: 'bpm',
          status: 'normal',
          lastUpdated: '2024-01-15'
        },
        {
          type: 'weight',
          value: '70.5',
          unit: 'kg',
          status: 'normal',
          lastUpdated: '2024-01-14'
        },
        {
          type: 'temperature',
          value: '36.8',
          unit: '°C',
          status: 'normal',
          lastUpdated: '2024-01-15'
        }
      ] : await this.db.getLatestVitals();

      if (parameters.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-heartbeat fa-2x"></i>
            <h4>No Health Data</h4>
            <p>Add your first vital signs to see health parameters</p>
            <button class="btn btn-primary" onclick="document.getElementById('add-vital-btn').click()">
              <i class="fas fa-plus"></i>
              Add Vital Signs
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = parameters.map(param => this.createParameterCard(param)).join('');
    } catch (error) {
      console.error('❌ Error loading health parameters:', error);
      container.innerHTML = '<p class="text-secondary">Failed to load health parameters</p>';
    }
  }

  createParameterCard(parameter) {
    const icons = {
      blood_pressure: 'fas fa-heartbeat',
      heart_rate: 'fas fa-heart',
      weight: 'fas fa-weight',
      temperature: 'fas fa-thermometer-half',
      bmi: 'fas fa-calculator'
    };

    const labels = {
      blood_pressure: 'Blood Pressure',
      heart_rate: 'Heart Rate',
      weight: 'Weight',
      temperature: 'Temperature',
      bmi: 'BMI'
    };

    return `
      <div class="parameter-card">
        <div class="parameter-icon ${parameter.type}">
          <i class="${icons[parameter.type] || 'fas fa-chart-line'}"></i>
        </div>
        <div class="parameter-value">${parameter.value}</div>
        <div class="parameter-label">${labels[parameter.type] || parameter.type}</div>
        <div class="parameter-status ${parameter.status}">${this.getStatusText(parameter.status)}</div>
        <small class="parameter-date">Updated ${new Date(parameter.lastUpdated).toLocaleDateString()}</small>
      </div>
    `;
  }

  async loadRecentActivity() {
    console.log('📋 Loading recent activity...');
    
    // Load recent vitals
    const vitalsContainer = document.getElementById('recent-vitals');
    if (vitalsContainer) {
      try {
        const recentVitals = this.db.demoMode ? [
          { type: 'Blood Pressure', value: '120/80 mmHg', date: '2024-01-15' },
          { type: 'Weight', value: '70.5 kg', date: '2024-01-14' },
          { type: 'Heart Rate', value: '72 bpm', date: '2024-01-13' }
        ] : await this.db.getRecentVitals(5);

        if (recentVitals.length === 0) {
          vitalsContainer.innerHTML = '<p class="text-secondary">No vitals recorded yet. Add your first vital sign measurement.</p>';
        } else {
          vitalsContainer.innerHTML = recentVitals.map(vital => `
            <div class="vital-item">
              <div class="vital-item-label">${vital.type}</div>
              <div class="vital-item-value">${vital.value}</div>
              <div class="vital-item-date">${new Date(vital.date).toLocaleDateString()}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('❌ Error loading recent vitals:', error);
        vitalsContainer.innerHTML = '<p class="text-secondary">Failed to load recent vitals</p>';
      }
    }

    // Load recent documents
    const documentsContainer = document.getElementById('recent-documents');
    if (documentsContainer) {
      try {
        const recentDocuments = this.db.demoMode ? [
          { title: 'Blood Test Results', category: 'lab-reports', date: '2024-01-15' },
          { title: 'X-Ray Report', category: 'imaging', date: '2024-01-10' }
        ] : await this.db.getRecentDocuments(3);

        if (recentDocuments.length === 0) {
          documentsContainer.innerHTML = '<p class="text-secondary">No documents uploaded yet. Upload your first medical document.</p>';
        } else {
          documentsContainer.innerHTML = recentDocuments.map(doc => `
            <div class="document-item">
              <div class="document-item-title">${doc.title}</div>
              <div class="document-item-category">${doc.category}</div>
              <div class="document-item-date">${new Date(doc.date).toLocaleDateString()}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('❌ Error loading recent documents:', error);
        documentsContainer.innerHTML = '<p class="text-secondary">Failed to load recent documents</p>';
      }
    }

    // Load recent photos
    const photosContainer = document.getElementById('recent-photos');
    if (photosContainer) {
      try {
        const recentPhotos = this.db.demoMode ? [
          { title: 'Healing Progress - Day 5', category: 'progress', date: '2024-01-15' },
          { title: 'Rash on arm', category: 'symptoms', date: '2024-01-12' }
        ] : await this.db.getRecentPhotos(3);

        if (recentPhotos.length === 0) {
          photosContainer.innerHTML = '<p class="text-secondary">No photos added yet. Add your first medical photo.</p>';
        } else {
          photosContainer.innerHTML = recentPhotos.map(photo => `
            <div class="photo-item">
              <div class="photo-item-title">${photo.title}</div>
              <div class="photo-item-category">${photo.category}</div>
              <div class="photo-item-date">${new Date(photo.date).toLocaleDateString()}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('❌ Error loading recent photos:', error);
        photosContainer.innerHTML = '<p class="text-secondary">Failed to load recent photos</p>';
      }
    }
  }

  async updateHealthTrends() {
    console.log('📈 Updating health trends chart...');
    const canvas = document.getElementById('health-trends-chart');
    if (!canvas) return;

    try {
      const metric = document.getElementById('chart-metric')?.value || 'blood_pressure';
      const period = document.getElementById('chart-period')?.value || '30';
      
      // For demo mode, create sample chart data
      const chartData = this.db.demoMode ? this.generateDemoChartData(metric, period) : 
                       await this.db.getHealthTrends(metric, period);

      this.renderChart(canvas, chartData, metric);
    } catch (error) {
      console.error('❌ Error updating health trends:', error);
    }
  }

  generateDemoChartData(metric, period) {
    const days = parseInt(period);
    const data = [];
    const labels = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      
      // Generate realistic demo data based on metric
      switch (metric) {
        case 'blood_pressure':
          data.push(Math.floor(Math.random() * 20) + 110); // 110-130
          break;
        case 'heart_rate':
          data.push(Math.floor(Math.random() * 20) + 65); // 65-85
          break;
        case 'weight':
          data.push((Math.random() * 5 + 68).toFixed(1)); // 68-73
          break;
        case 'temperature':
          data.push((Math.random() * 2 + 36.5).toFixed(1)); // 36.5-38.5
          break;
        default:
          data.push(Math.floor(Math.random() * 50) + 50);
      }
    }
    
    return { labels, data };
  }

  renderChart(canvas, chartData, metric) {
    if (!window.Chart) {
      console.error('❌ Chart.js not loaded');
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: this.getMetricLabel(metric),
          data: chartData.data,
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }

  getMetricLabel(metric) {
    const labels = {
      blood_pressure: 'Blood Pressure (mmHg)',
      heart_rate: 'Heart Rate (bpm)',
      weight: 'Weight (kg)',
      temperature: 'Temperature (°C)',
      bmi: 'BMI'
    };
    return labels[metric] || metric;
  }

  getStatusText(status) {
    const statusTexts = {
      good: 'Good',
      normal: 'Normal',
      warning: 'Attention',
      critical: 'Critical'
    };
    return statusTexts[status] || 'Unknown';
  }

  // Helper methods
  showNotification(message, type = 'info') {
    if (window.authManager && window.authManager.showNotification) {
      window.authManager.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
}
