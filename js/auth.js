// Authentication module for Family Health Tracker
// Handles user authentication, registration, and session management

class AuthManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.authModal = document.getElementById('auth-modal');
    this.authForm = document.getElementById('auth-form');
    this.authTitle = document.getElementById('auth-title');
    this.authSubmit = document.getElementById('auth-submit');
    this.authSwitchText = document.getElementById('auth-switch-text');
    this.authSwitchLink = document.getElementById('auth-switch-link');
    this.nameGroup = document.getElementById('name-group');
    this.isSignUp = false;
    
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Initialize Supabase client
      this.supabase = supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
      );

      // Set up event listeners
      this.setupEventListeners();

      // Check for existing session
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session) {
        await this.handleAuthSuccess(session.user);
      } else {
        this.showAuthModal();
      }

      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.handleAuthSuccess(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        }
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      this.showNotification('Authentication initialization failed', 'error');
    }
  }

  setupEventListeners() {
    // Auth form submission
    this.authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
    
    // Switch between sign in and sign up
    this.authSwitchLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthMode();
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.signOut());
    }
  }

  showAuthModal() {
    this.authModal.classList.remove('hidden');
    document.getElementById('loading-screen').classList.add('hidden');
  }

  hideAuthModal() {
    this.authModal.classList.add('hidden');
  }

  toggleAuthMode() {
    this.isSignUp = !this.isSignUp;
    
    if (this.isSignUp) {
      this.authTitle.textContent = 'Create Your Account';
      this.authSubmit.textContent = 'Sign Up';
      this.authSwitchText.textContent = 'Already have an account?';
      this.authSwitchLink.textContent = 'Sign In';
      this.nameGroup.style.display = 'block';
      this.nameGroup.querySelector('input').required = true;
    } else {
      this.authTitle.textContent = 'Welcome Back';
      this.authSubmit.textContent = 'Sign In';
      this.authSwitchText.textContent = "Don't have an account?";
      this.authSwitchLink.textContent = 'Sign Up';
      this.nameGroup.style.display = 'none';
      this.nameGroup.querySelector('input').required = false;
    }
  }

  async handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('full-name').value;

    // Disable form during submission
    this.setFormLoading(true);

    try {
      if (this.isSignUp) {
        await this.signUp(email, password, fullName);
      } else {
        await this.signIn(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showNotification(error.message, 'error');
      this.setFormLoading(false);
    }
  }

  async signUp(email, password, fullName) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user && !data.user.email_confirmed_at) {
      this.showNotification(
        'Please check your email and click the confirmation link to complete registration.',
        'info'
      );
    } else {
      await this.handleAuthSuccess(data.user);
    }
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    await this.handleAuthSuccess(data.user);
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      this.handleSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
      this.showNotification('Failed to sign out', 'error');
    }
  }

  async handleAuthSuccess(user) {
    this.currentUser = user;
    this.hideAuthModal();
    
    // Update UI with user info
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = user.user_metadata?.full_name || user.email;
    }

    // Show main application
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('loading-screen').classList.add('hidden');

    // Initialize user profile if needed
    await this.ensureUserProfile(user);

    // Trigger app initialization
    if (window.app) {
      window.app.initialize();
    }

    this.showNotification('Welcome to Family Health Tracker!', 'success');
  }

  handleSignOut() {
    this.currentUser = null;
    
    // Hide main app and show auth modal
    document.getElementById('app').classList.add('hidden');
    this.showAuthModal();
    
    // Reset form
    this.authForm.reset();
    this.isSignUp = false;
    this.toggleAuthMode();
    
    this.showNotification('You have been signed out', 'info');
  }

  async ensureUserProfile(user) {
    try {
      // Check if user profile exists
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await this.supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  }

  setFormLoading(loading) {
    const submitBtn = this.authSubmit;
    const inputs = this.authForm.querySelectorAll('input');
    
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
      inputs.forEach(input => input.disabled = true);
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = this.isSignUp ? 'Sign Up' : 'Sign In';
      inputs.forEach(input => input.disabled = false);
    }
  }

  showNotification(message, type = 'info') {
    // This will be implemented in the main app module
    if (window.app && window.app.showNotification) {
      window.app.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getSupabaseClient() {
    return this.supabase;
  }

  async isAuthenticated() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return !!session;
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});
