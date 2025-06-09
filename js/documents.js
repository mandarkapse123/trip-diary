// Documents Manager for Family Health Tracker
// Handles document upload, organization, and management

class DocumentsManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.currentCategory = 'all';
    this.currentFamilyFilter = 'all';
    this.currentDateFilter = 'all';
    console.log('🏗️ DocumentsManager constructor called');
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('🎧 Setting up documents event listeners...');
    
    // Upload document form
    const uploadForm = document.getElementById('upload-document-form');
    console.log('🔍 Upload document form found:', !!uploadForm);
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        console.log('📤 Upload document form submitted');
        this.handleUploadDocument(e);
      });
    }

    // File upload area for documents
    const fileUploadArea = document.getElementById('document-upload-area');
    const fileInput = document.getElementById('document-file');
    
    console.log('🔍 Document upload elements found:', {
      fileUploadArea: !!fileUploadArea,
      fileInput: !!fileInput
    });
    
    if (fileUploadArea && fileInput) {
      // Click to browse
      fileUploadArea.addEventListener('click', () => {
        console.log('🖱️ Document upload area clicked');
        fileInput.click();
      });
      
      // Drag and drop
      fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
        console.log('📁 Document dragged over upload area');
      });
      
      fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
      });
      
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        console.log('📁 Document dropped on upload area');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          console.log('📄 Document selected via drag & drop:', files[0].name);
          fileInput.files = files;
          this.handleFileSelection(files[0]);
        }
      });
      
      // File input change
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          console.log('📄 Document selected via input:', e.target.files[0].name);
          this.handleFileSelection(e.target.files[0]);
        }
      });
    }

    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.target.closest('.category-tab').dataset.category;
        console.log('📂 Category tab clicked:', category);
        this.filterByCategory(category);
      });
    });

    // Search and filters
    const searchInput = document.getElementById('document-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        console.log('🔍 Document search input changed');
        this.filterDocuments();
      });
    }

    const familyFilter = document.getElementById('document-family-filter');
    if (familyFilter) {
      familyFilter.addEventListener('change', () => {
        console.log('👨‍👩‍👧‍👦 Family filter changed');
        this.filterDocuments();
      });
    }

    const dateFilter = document.getElementById('document-date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        console.log('📅 Date filter changed');
        this.filterDocuments();
      });
    }

    // View toggle
    const viewToggle = document.getElementById('document-view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        console.log('👁️ Document view toggle clicked');
        this.toggleView();
      });
    }
  }

  async loadDocuments() {
    console.log('📄 Loading documents...');
    try {
      const documents = await this.db.getDocuments();
      console.log('📄 Documents loaded:', documents.length);
      this.renderDocuments(documents);
      this.updateEmptyState(documents.length === 0);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      this.showNotification('Failed to load documents', 'error');
    }
  }

  renderDocuments(documents) {
    const container = document.getElementById('documents-grid');
    if (!container) return;

    if (documents.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = documents.map(doc => this.createDocumentCard(doc)).join('');
  }

  createDocumentCard(document) {
    const categoryIcons = {
      'lab-reports': 'fas fa-vial',
      'imaging': 'fas fa-x-ray',
      'prescriptions': 'fas fa-pills',
      'insurance': 'fas fa-shield-alt',
      'other': 'fas fa-file-alt'
    };

    const tags = document.tags ? document.tags.split(',').map(tag => 
      `<span class="document-tag">${tag.trim()}</span>`
    ).join('') : '';

    return `
      <div class="document-card" data-document-id="${document.id}">
        <div class="document-header">
          <div class="document-icon ${document.category}">
            <i class="${categoryIcons[document.category] || 'fas fa-file-alt'}"></i>
          </div>
          <div class="document-info">
            <h4>${document.title}</h4>
            <div class="document-meta">
              <div class="document-date">
                <i class="fas fa-calendar"></i>
                ${new Date(document.date).toLocaleDateString()}
              </div>
              <div class="document-member">
                <i class="fas fa-user"></i>
                ${document.family_member || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
        ${document.notes ? `<p class="document-notes">${document.notes}</p>` : ''}
        ${tags ? `<div class="document-tags">${tags}</div>` : ''}
        <div class="document-actions">
          <button class="btn btn-sm btn-primary" onclick="documentsManager.viewDocument('${document.id}')">
            <i class="fas fa-eye"></i>
            View
          </button>
          <button class="btn btn-sm btn-secondary" onclick="documentsManager.downloadDocument('${document.id}')">
            <i class="fas fa-download"></i>
            Download
          </button>
          <button class="btn btn-sm btn-danger" onclick="documentsManager.deleteDocument('${document.id}')">
            <i class="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>
    `;
  }

  handleFileSelection(file) {
    console.log('📄 Handling file selection:', file.name);
    
    if (!this.validateFile(file)) {
      return;
    }

    // Update upload area to show selected file
    const uploadArea = document.getElementById('document-upload-area');
    if (uploadArea) {
      uploadArea.innerHTML = `
        <i class="fas fa-file-check"></i>
        <p><strong>${file.name}</strong></p>
        <p class="text-secondary">File selected (${this.formatFileSize(file.size)})</p>
        <small>Click to select a different file</small>
      `;
    }
  }

  validateFile(file) {
    console.log('🔍 Validating document file:', file.name, 'Size:', this.formatFileSize(file.size));
    
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    
    // Check file size
    if (file.size > maxSize) {
      this.showNotification(
        `File size too large. Maximum size is ${this.formatFileSize(maxSize)}`,
        'error'
      );
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      this.showNotification(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        'error'
      );
      return false;
    }

    console.log('✅ Document file validation passed');
    return true;
  }

  async handleUploadDocument(e) {
    e.preventDefault();
    console.log('📤 Handling upload document...');
    
    const title = document.getElementById('document-title').value;
    const category = document.getElementById('document-category').value;
    const familyMember = document.getElementById('document-family-member').value;
    const date = document.getElementById('document-date').value;
    const notes = document.getElementById('document-notes').value;
    const tags = document.getElementById('document-tags').value;
    const fileInput = document.getElementById('document-file');
    
    console.log('📋 Document form data:', { title, category, familyMember, date, hasFile: !!fileInput.files[0] });
    
    if (!fileInput.files[0]) {
      this.showNotification('Please select a file to upload', 'error');
      return;
    }

    const file = fileInput.files[0];
    console.log('📄 Document file to upload:', file.name, file.type, this.formatFileSize(file.size));
    
    if (!this.validateFile(file)) {
      return;
    }

    try {
      // Show loading state
      this.setUploadLoading(true);
      console.log('⏳ Starting document upload...');
      
      // For demo mode, simulate upload
      if (this.db.demoMode) {
        console.log('🎭 Demo mode: simulating document upload...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
        
        const documentData = {
          id: 'demo-document-' + Date.now(),
          title,
          category,
          family_member: familyMember,
          date,
          notes,
          tags,
          fileUrl: '#demo-file',
          fileName: file.name,
          fileType: file.type,
          uploadDate: new Date().toISOString()
        };
        
        // Add to demo data
        if (!this.db.demoData.documents) {
          this.db.demoData.documents = [];
        }
        this.db.demoData.documents.unshift(documentData);
        console.log('✅ Demo document upload completed');
      } else {
        // Real upload
        const fileData = await this.db.uploadFile(file, 'medical-documents');
        console.log('📁 Document file uploaded:', fileData);
        
        // Save document metadata
        const documentData = {
          title,
          category,
          family_member: familyMember,
          date,
          notes,
          tags,
          fileUrl: fileData.url,
          fileName: fileData.fileName,
          fileType: file.type,
        };
        
        await this.db.saveDocument(documentData);
        console.log('💾 Document metadata saved');
      }
      
      // Close modal and reload documents
      this.hideModal('upload-document-modal');
      await this.loadDocuments();
      
      this.showNotification('Document uploaded successfully', 'success');
      
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      this.showNotification('Failed to upload document: ' + error.message, 'error');
    } finally {
      this.setUploadLoading(false);
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  setUploadLoading(loading) {
    const submitBtn = document.querySelector('#upload-document-form button[type="submit"]');
    const inputs = document.querySelectorAll('#upload-document-form input, #upload-document-form select, #upload-document-form textarea');
    
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload Document';
      inputs.forEach(input => input.disabled = false);
    }
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
      const fileUploadArea = document.getElementById('document-upload-area');
      if (fileUploadArea) {
        fileUploadArea.innerHTML = `
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop your document here or click to browse</p>
          <input type="file" id="document-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" hidden>
        `;
      }
    }
  }

  updateEmptyState(isEmpty) {
    const emptyState = document.getElementById('documents-empty-state');
    const grid = document.getElementById('documents-grid');
    
    if (emptyState && grid) {
      if (isEmpty) {
        emptyState.style.display = 'block';
        grid.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';
      }
    }
  }

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    this.filterDocuments();
  }

  filterDocuments() {
    // This will be implemented to filter the displayed documents
    console.log('🔍 Filtering documents by category:', this.currentCategory);
    // Implementation will be added when we have the database methods
  }

  toggleView() {
    // Toggle between grid and list view
    console.log('👁️ Toggling document view');
    // Implementation will be added
  }

  async viewDocument(documentId) {
    console.log('👁️ Viewing document:', documentId);
    // Implementation will be added
  }

  async downloadDocument(documentId) {
    console.log('⬇️ Downloading document:', documentId);
    // Implementation will be added
  }

  async deleteDocument(documentId) {
    console.log('🗑️ Deleting document:', documentId);
    // Implementation will be added
  }
}
