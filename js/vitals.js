// Vitals management module for Family Health Tracker
// Handles vital signs tracking, display, and analysis

class VitalsManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add vital form
    const addVitalForm = document.getElementById('add-vital-form');
    if (addVitalForm) {
      addVitalForm.addEventListener('submit', (e) => this.handleAddVital(e));
    }

    // Vital type selector
    const vitalTypeSelect = document.getElementById('vital-type');
    if (vitalTypeSelect) {
      vitalTypeSelect.addEventListener('change', (e) => this.handleVitalTypeChange(e));
    }

    // Vital cards click handlers
    document.querySelectorAll('.vital-card').forEach(card => {
      card.addEventListener('click', () => {
        const vitalType = card.dataset.vital;
        this.showVitalDetails(vitalType);
      });
    });

    // Chart controls
    const vitalSelector = document.getElementById('vital-selector');
    const timeRange = document.getElementById('time-range');
    
    if (vitalSelector) {
      vitalSelector.addEventListener('change', () => this.updateDetailedChart());
    }
    
    if (timeRange) {
      timeRange.addEventListener('change', () => this.updateDetailedChart());
    }
  }

  async loadVitals() {
    try {
      // Load all vital types
      await Promise.all([
        this.loadVitalCard('blood_pressure'),
        this.loadVitalCard('heart_rate'),
        this.loadVitalCard('weight'),
        this.loadVitalCard('glucose'),
        this.loadVitalCard('temperature'),
        this.loadVitalCard('oxygen'),
      ]);

      // Load detailed chart
      await this.updateDetailedChart();
    } catch (error) {
      console.error('Error loading vitals:', error);
    }
  }

  async loadVitalCard(vitalType) {
    try {
      const config = VITAL_SIGNS_CONFIG[vitalType];
      const latest = await this.db.getLatestVitalSign(vitalType);
      const recent = await this.db.getVitalSigns(vitalType, 10, 30);

      // Update latest value
      const valueElement = document.getElementById(`${vitalType.replace('_', '-')}-latest`);
      const statusElement = document.getElementById(`${vitalType.replace('_', '-')}-status`);

      if (latest) {
        let value, status;
        
        if (vitalType === 'blood_pressure') {
          value = `${latest.systolic}/${latest.diastolic} ${config.unit}`;
          status = this.getBloodPressureStatus(latest.systolic, latest.diastolic);
        } else {
          value = `${latest.value} ${config.unit}`;
          status = this.getVitalStatus(vitalType, latest.value);
        }

        if (valueElement) valueElement.textContent = value;
        if (statusElement) {
          statusElement.textContent = status.text;
          statusElement.className = `vital-status ${status.level}`;
        }
      } else {
        if (valueElement) valueElement.textContent = `-- ${config.unit}`;
        if (statusElement) {
          statusElement.textContent = 'No data';
          statusElement.className = 'vital-status';
        }
      }

      // Create mini chart
      const chartCanvas = document.getElementById(`${vitalType.replace('_', '-')}-mini-chart`);
      if (chartCanvas && recent.length > 0) {
        this.createMiniChart(chartCanvas, recent, vitalType);
      }
    } catch (error) {
      console.error(`Error loading ${vitalType} vital:`, error);
    }
  }

  createMiniChart(canvas, data, vitalType) {
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const chartData = data.reverse().map(item => ({
      x: new Date(item.recorded_at),
      y: vitalType === 'blood_pressure' ? item.systolic : item.value
    }));

    canvas.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          data: chartData,
          borderColor: APP_CONFIG.chartColors.primary,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        elements: {
          point: { radius: 0 }
        }
      }
    });
  }

  handleVitalTypeChange(e) {
    const vitalType = e.target.value;
    const bpFields = document.getElementById('bp-fields');
    const singleValueField = document.getElementById('single-value-field');
    const vitalValueLabel = document.getElementById('vital-value-label');
    const vitalUnit = document.getElementById('vital-unit');

    // Hide all fields first
    bpFields.classList.add('hidden');
    singleValueField.classList.add('hidden');

    if (vitalType === 'blood_pressure') {
      bpFields.classList.remove('hidden');
      document.getElementById('systolic').required = true;
      document.getElementById('diastolic').required = true;
      document.getElementById('vital-value').required = false;
    } else if (vitalType) {
      const config = VITAL_SIGNS_CONFIG[vitalType];
      singleValueField.classList.remove('hidden');
      vitalValueLabel.textContent = `${config.name}:`;
      vitalUnit.textContent = config.unit;
      document.getElementById('vital-value').required = true;
      document.getElementById('systolic').required = false;
      document.getElementById('diastolic').required = false;
    }
  }

  async handleAddVital(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const vitalType = formData.get('vital-type') || document.getElementById('vital-type').value;
    const date = formData.get('vital-date') || document.getElementById('vital-date').value;
    const notes = formData.get('vital-notes') || document.getElementById('vital-notes').value;

    try {
      let vitalData = {
        type: vitalType,
        date: date,
        notes: notes
      };

      if (vitalType === 'blood_pressure') {
        const systolic = parseInt(document.getElementById('systolic').value);
        const diastolic = parseInt(document.getElementById('diastolic').value);
        
        if (!systolic || !diastolic) {
          throw new Error('Please enter both systolic and diastolic values');
        }
        
        vitalData.systolic = systolic;
        vitalData.diastolic = diastolic;
        vitalData.value = systolic; // Store systolic as primary value for consistency
      } else {
        const value = parseFloat(document.getElementById('vital-value').value);
        
        if (!value) {
          throw new Error('Please enter a valid value');
        }
        
        vitalData.value = value;
      }

      // Save to database
      await this.db.saveVitalSign(vitalData);
      
      // Close modal
      window.app.hideModal('add-vital-modal');
      
      // Reload vitals display
      await this.loadVitals();
      
      // Show success message
      window.app.showNotification('Vital sign recorded successfully', 'success');
      
    } catch (error) {
      console.error('Error saving vital sign:', error);
      window.app.showNotification(error.message || 'Failed to save vital sign', 'error');
    }
  }

  async updateDetailedChart() {
    const vitalSelector = document.getElementById('vital-selector');
    const timeRange = document.getElementById('time-range');
    const canvas = document.getElementById('detailed-chart');

    if (!vitalSelector || !timeRange || !canvas) return;

    const vitalType = vitalSelector.value;
    const days = parseInt(timeRange.value);

    try {
      const vitals = await this.db.getVitalSigns(vitalType, 1000, days);
      
      if (window.chartsManager) {
        window.chartsManager.createDetailedChart(canvas, vitals, vitalType);
      }
    } catch (error) {
      console.error('Error updating detailed chart:', error);
    }
  }

  showVitalDetails(vitalType) {
    // Switch to vitals section and focus on specific vital
    window.app.navigateToSection('vitals');
    
    // Update selectors to show this vital type
    const vitalSelector = document.getElementById('vital-selector');
    if (vitalSelector) {
      vitalSelector.value = vitalType;
      this.updateDetailedChart();
    }
  }

  getVitalStatus(vitalType, value) {
    const config = VITAL_SIGNS_CONFIG[vitalType];
    if (!config || !config.ranges) {
      return { text: 'Unknown', level: 'normal' };
    }

    const ranges = config.ranges;

    switch (vitalType) {
      case 'heart_rate':
        if (value >= ranges.normal[0] && value <= ranges.normal[1]) {
          return { text: 'Normal', level: 'normal' };
        } else if (value < ranges.normal[0]) {
          return { text: 'Bradycardia', level: 'warning' };
        } else {
          return { text: 'Tachycardia', level: 'warning' };
        }

      case 'glucose':
        if (value >= ranges.normal[0] && value <= ranges.normal[1]) {
          return { text: 'Normal', level: 'normal' };
        } else if (value >= ranges.prediabetes[0] && value <= ranges.prediabetes[1]) {
          return { text: 'Prediabetes', level: 'warning' };
        } else if (value >= ranges.diabetes[0]) {
          return { text: 'Diabetes Range', level: 'danger' };
        } else {
          return { text: 'Hypoglycemia', level: 'danger' };
        }

      case 'temperature':
        if (value >= ranges.normal[0] && value <= ranges.normal[1]) {
          return { text: 'Normal', level: 'normal' };
        } else if (value < ranges.normal[0]) {
          return { text: 'Hypothermia', level: 'danger' };
        } else if (value <= ranges.fever[1]) {
          return { text: 'Fever', level: 'warning' };
        } else {
          return { text: 'High Fever', level: 'danger' };
        }

      case 'oxygen':
        if (value >= ranges.normal[0]) {
          return { text: 'Normal', level: 'normal' };
        } else if (value >= ranges.mild[0]) {
          return { text: 'Mild Hypoxemia', level: 'warning' };
        } else if (value >= ranges.moderate[0]) {
          return { text: 'Moderate Hypoxemia', level: 'warning' };
        } else {
          return { text: 'Severe Hypoxemia', level: 'danger' };
        }

      default:
        return { text: 'Normal', level: 'normal' };
    }
  }

  getBloodPressureStatus(systolic, diastolic) {
    const ranges = VITAL_SIGNS_CONFIG.blood_pressure.ranges;

    if (systolic >= ranges.crisis.systolic[0] || diastolic >= ranges.crisis.diastolic[0]) {
      return { text: 'Hypertensive Crisis', level: 'danger' };
    } else if (systolic >= ranges.stage2.systolic[0] || diastolic >= ranges.stage2.diastolic[0]) {
      return { text: 'Stage 2 Hypertension', level: 'danger' };
    } else if (systolic >= ranges.stage1.systolic[0] || diastolic >= ranges.stage1.diastolic[0]) {
      return { text: 'Stage 1 Hypertension', level: 'warning' };
    } else if (systolic >= ranges.elevated.systolic[0] && diastolic <= ranges.elevated.diastolic[1]) {
      return { text: 'Elevated', level: 'warning' };
    } else if (systolic >= ranges.normal.systolic[0] && systolic <= ranges.normal.systolic[1] && 
               diastolic >= ranges.normal.diastolic[0] && diastolic <= ranges.normal.diastolic[1]) {
      return { text: 'Normal', level: 'normal' };
    } else {
      return { text: 'Low', level: 'warning' };
    }
  }
}

// Export for use in other modules
window.VitalsManager = VitalsManager;
