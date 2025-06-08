// Reports management module for Family Health Tracker
// Handles blood report uploads, storage, and display

class ReportsManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Upload report form
    const uploadForm = document.getElementById('upload-report-form');
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => this.handleUploadReport(e));
    }

    // File upload area
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('report-file');
    
    if (fileUploadArea && fileInput) {
      // Click to browse
      fileUploadArea.addEventListener('click', () => fileInput.click());
      
      // Drag and drop
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
      });
      
      fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
      });
      
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          fileInput.files = files;
          this.handleFileSelection(files[0]);
        }
      });
      
      // File input change
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelection(e.target.files[0]);
        }
      });
    }

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

  async loadReports() {
    try {
      const reports = await this.db.getBloodReports();
      this.displayReports(reports);
    } catch (error) {
      console.error('Error loading reports:', error);
      window.app.showNotification('Failed to load reports', 'error');
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
    // Check file size
    if (file.size > APP_CONFIG.maxFileSize) {
      window.app.showNotification(
        `File size too large. Maximum size is ${this.formatFileSize(APP_CONFIG.maxFileSize)}`,
        'error'
      );
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!APP_CONFIG.allowedFileTypes.includes(fileExtension)) {
      window.app.showNotification(
        `File type not allowed. Allowed types: ${APP_CONFIG.allowedFileTypes.join(', ')}`,
        'error'
      );
      return false;
    }

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
    
    const title = document.getElementById('report-title').value;
    const date = document.getElementById('report-date').value;
    const notes = document.getElementById('report-notes').value;
    const fileInput = document.getElementById('report-file');
    
    if (!fileInput.files[0]) {
      window.app.showNotification('Please select a file to upload', 'error');
      return;
    }

    const file = fileInput.files[0];
    
    if (!this.validateFile(file)) {
      return;
    }

    try {
      // Show loading state
      this.setUploadLoading(true);
      
      // Upload file
      const fileData = await this.db.uploadFile(file, 'blood-reports');
      
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
      
      // Close modal and reload reports
      window.app.hideModal('upload-report-modal');
      await this.loadReports();
      
      window.app.showNotification('Report uploaded successfully', 'success');
      
    } catch (error) {
      console.error('Error uploading report:', error);
      window.app.showNotification('Failed to upload report', 'error');
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
        window.app.showNotification('Report file not found', 'error');
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      window.app.showNotification('Failed to open report', 'error');
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
        
        window.app.showNotification('Download started', 'success');
      } else {
        window.app.showNotification('Report file not found', 'error');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      window.app.showNotification('Failed to download report', 'error');
    }
  }

  async deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await this.db.deleteBloodReport(reportId);
      await this.loadReports();
      window.app.showNotification('Report deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting report:', error);
      window.app.showNotification('Failed to delete report', 'error');
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
}

// Export for use in other modules
window.ReportsManager = ReportsManager;
