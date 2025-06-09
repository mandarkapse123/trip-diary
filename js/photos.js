// Photos Manager for Family Health Tracker
// Handles medical photo upload, organization, and management

class PhotosManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.currentCategory = 'all';
    this.currentFamilyFilter = 'all';
    this.currentDateFilter = 'all';
    console.log('🏗️ PhotosManager constructor called');
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('🎧 Setting up photos event listeners...');
    
    // Upload photo form
    const uploadForm = document.getElementById('upload-photo-form');
    console.log('🔍 Upload photo form found:', !!uploadForm);
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => {
        console.log('📤 Upload photo form submitted');
        this.handleUploadPhoto(e);
      });
    }

    // Set up file upload functionality with proper event delegation
    this.setupFileUpload();

    // Category tabs for photos
    document.querySelectorAll('.photo-categories .category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const category = e.target.closest('.category-tab').dataset.category;
        console.log('📂 Photo category tab clicked:', category);
        this.filterByCategory(category);
      });
    });

    // Search and filters for photos
    const searchInput = document.getElementById('photo-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        console.log('🔍 Photo search input changed');
        this.filterPhotos();
      });
    }

    const familyFilter = document.getElementById('photo-family-filter');
    if (familyFilter) {
      familyFilter.addEventListener('change', () => {
        console.log('👨‍👩‍👧‍👦 Photo family filter changed');
        this.filterPhotos();
      });
    }

    const dateFilter = document.getElementById('photo-date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        console.log('📅 Photo date filter changed');
        this.filterPhotos();
      });
    }

    // View toggle for photos
    const viewToggle = document.getElementById('photo-view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => {
        console.log('👁️ Photo view toggle clicked');
        this.toggleView();
      });
    }
  }

  setupFileUpload() {
    console.log('🔧 Setting up photo file upload functionality...');

    // Set up upload area click handler with a delay to ensure DOM is ready
    setTimeout(() => {
      const uploadArea = document.getElementById('photo-upload-area');
      const fileInput = document.getElementById('photo-file');

      console.log('🔍 Photo upload elements found:', {
        uploadArea: !!uploadArea,
        fileInput: !!fileInput
      });

      if (uploadArea && fileInput) {
        // Remove any existing listeners
        uploadArea.replaceWith(uploadArea.cloneNode(true));
        const newUploadArea = document.getElementById('photo-upload-area');
        const newFileInput = document.getElementById('photo-file');

        // Click to browse
        newUploadArea.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Photo upload area clicked');
          newFileInput.click();
        });

        // File input change
        newFileInput.addEventListener('change', (e) => {
          console.log('📸 Photo file input changed');
          if (e.target.files.length > 0) {
            console.log('📸 Photo selected via input:', e.target.files[0].name);
            this.handleFileSelection(e.target.files[0]);
          }
        });

        // Drag and drop
        newUploadArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          newUploadArea.classList.add('dragover');
          console.log('📁 Photo dragged over upload area');
        });

        newUploadArea.addEventListener('dragleave', () => {
          newUploadArea.classList.remove('dragover');
        });

        newUploadArea.addEventListener('drop', (e) => {
          e.preventDefault();
          newUploadArea.classList.remove('dragover');
          console.log('📁 Photo dropped on upload area');

          const files = e.dataTransfer.files;
          if (files.length > 0) {
            console.log('📸 Photo selected via drag & drop:', files[0].name);
            newFileInput.files = files;
            this.handleFileSelection(files[0]);
          }
        });

        console.log('✅ Photo file upload setup completed');
      } else {
        console.error('❌ Photo upload elements not found, retrying...');
        // Retry after another delay
        setTimeout(() => this.setupFileUpload(), 1000);
      }
    }, 500);
  }

  async loadPhotos() {
    console.log('📸 Loading photos...');
    try {
      const photos = await this.db.getPhotos();
      console.log('📸 Photos loaded:', photos.length);
      this.renderPhotos(photos);
      this.updateEmptyState(photos.length === 0);
    } catch (error) {
      console.error('❌ Error loading photos:', error);
      this.showNotification('Failed to load photos', 'error');
    }
  }

  renderPhotos(photos) {
    const container = document.getElementById('photos-gallery');
    if (!container) return;

    if (photos.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = photos.map(photo => this.createPhotoCard(photo)).join('');
  }

  createPhotoCard(photo) {
    const categoryBadges = {
      'symptoms': 'Symptoms',
      'progress': 'Progress',
      'wounds': 'Wounds',
      'skin': 'Skin',
      'other': 'Other'
    };

    const tags = photo.tags ? photo.tags.split(',').map(tag => 
      `<span class="photo-tag">${tag.trim()}</span>`
    ).join('') : '';

    return `
      <div class="photo-card" data-photo-id="${photo.id}">
        <div class="photo-image">
          ${photo.imageUrl ? 
            `<img src="${photo.imageUrl}" alt="${photo.title}" loading="lazy">` :
            `<div class="photo-placeholder"><i class="fas fa-image"></i></div>`
          }
        </div>
        <div class="photo-info">
          <h4>${photo.title}</h4>
          <div class="photo-meta">
            <div class="photo-date">
              <i class="fas fa-calendar"></i>
              ${new Date(photo.date).toLocaleDateString()}
            </div>
            <div class="photo-member">
              <i class="fas fa-user"></i>
              ${photo.family_member || 'Unknown'}
            </div>
          </div>
          <span class="photo-category-badge">${categoryBadges[photo.category] || 'Other'}</span>
          ${photo.notes ? `<p class="photo-notes">${photo.notes}</p>` : ''}
          ${tags ? `<div class="photo-tags">${tags}</div>` : ''}
        </div>
      </div>
    `;
  }

  handleFileSelection(file) {
    console.log('📸 Handling photo file selection:', file.name);
    
    if (!this.validateFile(file)) {
      return;
    }

    // Show preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const uploadArea = document.getElementById('photo-upload-area');
        if (uploadArea) {
          uploadArea.innerHTML = `
            <div style="position: relative;">
              <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
              <div style="margin-top: 0.5rem;">
                <p><strong>${file.name}</strong></p>
                <p class="text-secondary">Photo selected (${this.formatFileSize(file.size)})</p>
                <small>Click to select a different photo</small>
              </div>
            </div>
          `;
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Update upload area to show selected file
      const uploadArea = document.getElementById('photo-upload-area');
      if (uploadArea) {
        uploadArea.innerHTML = `
          <i class="fas fa-file-image"></i>
          <p><strong>${file.name}</strong></p>
          <p class="text-secondary">File selected (${this.formatFileSize(file.size)})</p>
          <small>Click to select a different file</small>
        `;
      }
    }
  }

  validateFile(file) {
    console.log('🔍 Validating photo file:', file.name, 'Size:', this.formatFileSize(file.size));
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
    
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

    console.log('✅ Photo file validation passed');
    return true;
  }

  async handleUploadPhoto(e) {
    e.preventDefault();
    console.log('📤 Handling upload photo...');
    
    const title = document.getElementById('photo-title').value;
    const category = document.getElementById('photo-category').value;
    const familyMember = document.getElementById('photo-family-member').value;
    const date = document.getElementById('photo-date').value;
    const notes = document.getElementById('photo-notes').value;
    const tags = document.getElementById('photo-tags').value;
    const fileInput = document.getElementById('photo-file');
    
    console.log('📋 Photo form data:', { title, category, familyMember, date, hasFile: !!fileInput.files[0] });
    
    if (!fileInput.files[0]) {
      this.showNotification('Please select a photo to upload', 'error');
      return;
    }

    const file = fileInput.files[0];
    console.log('📸 Photo file to upload:', file.name, file.type, this.formatFileSize(file.size));
    
    if (!this.validateFile(file)) {
      return;
    }

    try {
      // Show loading state
      this.setUploadLoading(true);
      console.log('⏳ Starting photo upload...');
      
      // For demo mode, simulate upload
      if (this.db.demoMode) {
        console.log('🎭 Demo mode: simulating photo upload...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
        
        // Create a demo image URL (placeholder)
        const reader = new FileReader();
        const imageUrl = await new Promise(resolve => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        
        const photoData = {
          id: 'demo-photo-' + Date.now(),
          title,
          category,
          family_member: familyMember,
          date,
          notes,
          tags,
          imageUrl: imageUrl, // Use the actual image data for demo
          fileName: file.name,
          fileType: file.type,
          uploadDate: new Date().toISOString()
        };
        
        // Add to demo data
        if (!this.db.demoData.photos) {
          this.db.demoData.photos = [];
        }
        this.db.demoData.photos.unshift(photoData);
        console.log('✅ Demo photo upload completed');
      } else {
        // Real upload
        const fileData = await this.db.uploadFile(file, 'medical-photos');
        console.log('📁 Photo file uploaded:', fileData);
        
        // Save photo metadata
        const photoData = {
          title,
          category,
          family_member: familyMember,
          date,
          notes,
          tags,
          imageUrl: fileData.url,
          fileName: fileData.fileName,
          fileType: file.type,
        };
        
        await this.db.savePhoto(photoData);
        console.log('💾 Photo metadata saved');
      }
      
      // Close modal and reload photos
      this.hideModal('upload-photo-modal');
      await this.loadPhotos();
      
      this.showNotification('Photo uploaded successfully', 'success');
      
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      this.showNotification('Failed to upload photo: ' + error.message, 'error');
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
    const submitBtn = document.querySelector('#upload-photo-form button[type="submit"]');
    const inputs = document.querySelectorAll('#upload-photo-form input, #upload-photo-form select, #upload-photo-form textarea');
    
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Photo';
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
      const fileUploadArea = document.getElementById('photo-upload-area');
      if (fileUploadArea) {
        fileUploadArea.innerHTML = `
          <i class="fas fa-camera"></i>
          <p>Take a photo or upload from gallery</p>
          <input type="file" id="photo-file" accept="image/*" capture="camera" hidden>
        `;
      }
    }
  }

  updateEmptyState(isEmpty) {
    const emptyState = document.getElementById('photos-empty-state');
    const gallery = document.getElementById('photos-gallery');
    
    if (emptyState && gallery) {
      if (isEmpty) {
        emptyState.style.display = 'block';
        gallery.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        gallery.style.display = 'grid';
      }
    }
  }

  filterByCategory(category) {
    this.currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.photo-categories .category-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`.photo-categories [data-category="${category}"]`).classList.add('active');
    
    this.filterPhotos();
  }

  filterPhotos() {
    // This will be implemented to filter the displayed photos
    console.log('🔍 Filtering photos by category:', this.currentCategory);
    // Implementation will be added when we have the database methods
  }

  toggleView() {
    // Toggle between gallery and list view
    console.log('👁️ Toggling photo view');
    // Implementation will be added
  }
}
