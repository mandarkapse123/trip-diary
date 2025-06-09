// Reports management module for Family Health Tracker
// Handles blood report uploads, storage, and display

class ReportsManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    console.log('🏗️ ReportsManager constructor called');
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('🎧 Setting up reports event listeners...');

    // Upload report form
    const uploadForm = document.getElementById('upload-report-form');
    console.log('🔍 Upload form found:', !!uploadForm);
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        console.log('📤 Upload form submitted');
        this.handleUploadReport(e);
      });
    }

    // Set up file upload functionality with proper event delegation
    this.setupFileUpload();

    // Search and filter
    const searchInput = document.getElementById('report-search');
    const filterSelect = document.getElementById('report-filter');
    
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterReports());
    }
    
    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.filterReports());
    }
  }

  setupFileUpload() {
    console.log('🔧 Setting up report file upload functionality...');

    // Set up upload area click handler with a delay to ensure DOM is ready
    setTimeout(() => {
      const uploadArea = document.getElementById('file-upload-area');
      const fileInput = document.getElementById('report-file');

      console.log('🔍 Report upload elements found:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput
      });

      if (uploadArea && fileInput) {
        // Remove any existing listeners
        uploadArea.replaceWith(uploadArea.cloneNode(true));
        const newUploadArea = document.getElementById('file-upload-area');
        const newFileInput = document.getElementById('report-file');

        // Click to browse
        newUploadArea.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Report upload area clicked');
          newFileInput.click();
        });

        // File input change
        newFileInput.addEventListener('change', (e) => {
          console.log('📄 Report file input changed');
          if (e.target.files.length > 0) {
            console.log('📄 Report selected via input:', e.target.files[0].name);
            this.handleFileSelection(e.target.files[0]);
          }
        });

        // Drag and drop
        newUploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          newUploadArea.classList.add('dragover');
          console.log('📁 Report dragged over upload area');
        });

        newUploadArea.addEventListener('dragleave', () => {
          newUploadArea.classList.remove('dragover');
        });

        newUploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          newUploadArea.classList.remove('dragover');
          console.log('📁 Report dropped on upload area');

          const files = e.dataTransfer.files;
          if (files.length > 0) {
            console.log('📄 Report selected via drag & drop:', files[0].name);
            newFileInput.files = files;
            this.handleFileSelection(files[0]);
          }
        });

        console.log('✅ Report file upload setup completed');
      } else {
        console.error('❌ Report upload elements not found, retrying...');
        // Retry after another delay
        setTimeout(() => this.setupFileUpload(), 1000);
      }
    }, 500);
  }

  async loadReports() {
    try {
      const reports = await this.db.getBloodReports();
      this.displayReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      this.showNotification('Failed to load reports', 'error');
    }
  }

  displayReports(reports) {
    const container = document.getElementById('reports-grid');
    if (!container) return;

    if (reports.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-medical fa-3x"></i>
          <h3>No Reports Yet</h3>
          <p>Upload your first blood report to get started</p>
          <button class="btn btn-primary" onclick="window.app.showModal('upload-report-modal')">
            <i class="fas fa-upload"></i>
            Upload Report
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = reports.map(report => this.createReportCard(report)).join('');
  }

  createReportCard(report) {
    const date = new Date(report.report_date).toLocaleDateString();
    const uploadDate = new Date(report.created_at).toLocaleDateString();
    
    return `
      <div class="report-card" data-report-id="${report.id}">
        <div class="report-header">
          <h3 class="report-title">${report.title}</h3>
          <div class="report-date">${date}</div>
        </div>
        <div class="report-content">
          <div class="report-preview">
            <i class="fas fa-file-${this.getFileIcon(report.file_type)}"></i>
          </div>
          ${report.notes ? `<p class="report-notes">${report.notes}</p>` : ''}
          <div class="report-meta">
            <small>Uploaded: ${uploadDate}</small>
          </div>
          <div class="report-actions">
            <button class="btn btn-secondary btn-sm" onclick="reportsManager.viewReport('${report.id}')">
              <i class="fas fa-eye"></i>
              View
            </button>
            <button class="btn btn-primary btn-sm" onclick="reportsManager.downloadReport('${report.id}')">
              <i class="fas fa-download"></i>
              Download
            </button>
            <button class="btn btn-danger btn-sm" onclick="reportsManager.deleteReport('${report.id}')">
              <i class="fas fa-trash"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'pdf';
    if (fileType.includes('image')) return 'image';
    return 'alt';
  }

  handleFileSelection(file) {
    const fileUploadArea = document.getElementById('file-upload-area');
    
    // Validate file
    if (!this.validateFile(file)) {
      return;
    }

    // Update UI to show selected file
    fileUploadArea.innerHTML = `
      <i class="fas fa-file-${this.getFileIcon(file.type)}"></i>
      <p><strong>${file.name}</strong></p>
      <p>Size: ${this.formatFileSize(file.size)}</p>
      <p class="text-success">File ready for upload</p>
    `;
  }

  validateFile(file) {
    console.log('🔍 Validating file:', file.name, 'Size:', this.formatFileSize(file.size));

    // Check file size
    if (file.size > APP_CONFIG.maxFileSize) {
      this.showNotification(
        `File size too large. Maximum size is ${this.formatFileSize(APP_CONFIG.maxFileSize)}`,
        'error'
      );
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!APP_CONFIG.allowedFileTypes.includes(fileExtension)) {
      this.showNotification(
        `File type not allowed. Allowed types: ${APP_CONFIG.allowedFileTypes.join(', ')}`,
        'error'
      );
      return false;
    }

    console.log('✅ File validation passed');
    return true;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async handleUploadReport(e) {
    e.preventDefault();
    console.log('📤 Handling upload report...');

    const title = document.getElementById('report-title').value;
    const date = document.getElementById('report-date').value;
    const notes = document.getElementById('report-notes').value;
    const fileInput = document.getElementById('report-file');

    console.log('📋 Form data:', { title, date, notes, hasFile: !!fileInput.files[0] });

    if (!fileInput.files[0]) {
      this.showNotification('Please select a file to upload', 'error');
      return;
    }

    const file = fileInput.files[0];
    console.log('📄 File to upload:', file.name, file.type, this.formatFileSize(file.size));

    if (!this.validateFile(file)) {
      return;
    }

    try {
      // Show loading state
      this.setUploadLoading(true);
      console.log('⏳ Starting file upload...');

      // For demo mode, simulate upload
      if (this.db.demoMode) {
        console.log('🎭 Demo mode: simulating upload...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay

        const reportData = {
          id: 'demo-report-' + Date.now(),
          title,
          date,
          notes,
          fileUrl: '#demo-file',
          fileName: file.name,
          fileType: file.type,
        };

        this.db.demoData.reports.unshift(reportData);
        console.log('✅ Demo upload completed');
      } else {
        // Real upload
        const fileData = await this.db.uploadFile(file, 'blood-reports');
        console.log('📁 File uploaded:', fileData);

        // Save report metadata
        const reportData = {
          title,
          date,
          notes,
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileType: file.type,
        };

        await this.db.saveBloodReport(reportData);
        console.log('💾 Report metadata saved');
      }

      // Close modal and reload reports
      this.hideModal('upload-report-modal');
      await this.loadReports();

      this.showNotification('Report uploaded successfully', 'success');

    } catch (error) {
      console.error('❌ Error uploading report:', error);
      this.showNotification('Failed to upload report: ' + error.message, 'error');
    } finally {
      this.setUploadLoading(false);
    }
  }

  setUploadLoading(loading) {
    const submitBtn = document.querySelector('#upload-report-form button[type="submit"]');
    const inputs = document.querySelectorAll('#upload-report-form input, #upload-report-form textarea');
    
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Report';
      inputs.forEach(input => input.disabled = false);
    }
  }

  async viewReport(reportId) {
    try {
      const reports = await this.db.getBloodReports();
      const report = reports.find(r => r.id === reportId);
      
      if (report && report.file_url) {
        window.open(report.file_url, '_blank');
      } else {
        this.showNotification('Report file not found', 'error');
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      this.showNotification('Failed to open report', 'error');
    }
  }

  async downloadReport(reportId) {
    try {
      const reports = await this.db.getBloodReports();
      const report = reports.find(r => r.id === reportId);
      
      if (report && report.file_url) {
        const a = document.createElement('a');
        a.href = report.file_url;
        a.download = report.file_name || `report-${report.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('Download started', 'success');
      } else {
        this.showNotification('Report file not found', 'error');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      this.showNotification('Failed to download report', 'error');
    }
  }

  async deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await this.db.deleteBloodReport(reportId);
      await this.loadReports();
      this.showNotification('Report deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting report:', error);
      this.showNotification('Failed to delete report', 'error');
    }
  }

  filterReports() {
    const searchTerm = document.getElementById('report-search').value.toLowerCase();
    const filterValue = document.getElementById('report-filter').value;
    const reportCards = document.querySelectorAll('.report-card');

    reportCards.forEach(card => {
      const title = card.querySelector('.report-title').textContent.toLowerCase();
      const notes = card.querySelector('.report-notes')?.textContent.toLowerCase() || '';
      const date = card.querySelector('.report-date').textContent;

      let matchesSearch = title.includes(searchTerm) || notes.includes(searchTerm);
      let matchesFilter = true;

      if (filterValue === 'recent') {
        const reportDate = new Date(date);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        matchesFilter = reportDate >= thirtyDaysAgo;
      }

      card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
    });
  }

  // Helper methods
  showNotification(message, type = 'info') {
    if (window.authManager && window.authManager.showNotification) {
      window.authManager.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      // Reset form
      const form = modal.querySelector('form');
      if (form) {
        form.reset();
      }
      // Reset file upload area
      const fileUploadArea = document.getElementById('file-upload-area');
      if (fileUploadArea) {
        fileUploadArea.innerHTML = `
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop your blood report here</p>
          <p class="text-secondary">or click to browse files</p>
          <small>Supported: PDF, JPG, PNG (max 10MB)</small>
        `;
      }
    }
  }
}

// Export for use in other modules
window.ReportsManager = ReportsManager;
