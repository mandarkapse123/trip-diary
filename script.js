// Family Health Tracker - Global Initialization
// This file initializes global variables and manager instances

// Global manager instances
window.authManager = null;
window.app = null;
window.vitalsManager = null;
window.reportsManager = null;
window.familyManager = null;
window.chartsManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Family Health Tracker - Initializing...');

  // The auth manager will be initialized by auth.js
  // The app will be initialized by app.js
  // Other managers will be initialized by the main app
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);

  // Show user-friendly error message
  if (window.app && window.app.showNotification) {
    window.app.showNotification('An unexpected error occurred. Please refresh the page.', 'error');
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Show user-friendly error message
  if (window.app && window.app.showNotification) {
    window.app.showNotification('A network error occurred. Please check your connection.', 'error');
  }
});

console.log('Family Health Tracker - Ready for initialization');
