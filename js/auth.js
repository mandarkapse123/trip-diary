// Authentication module for Family Health Tracker
// Handles user authentication, registration, and session management

class AuthManager {
  constructor() {
    console.log('🏗️ AuthManager constructor called');
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

    console.log('🔧 AuthManager DOM elements found:', {
      authModal: !!this.authModal,
      authForm: !!this.authForm,
      authTitle: !!this.authTitle
    });

    console.log('🚀 Starting auth initialization...');
    this.initializeAuth();
  }

  async initializeAuth() {
    console.log('🔐 initializeAuth() called');
    try {
      // Check if we're in demo mode
      if (SUPABASE_CONFIG.url === 'DEMO_MODE') {
        console.log('🎭 Running in DEMO MODE - No Supabase connection');
        this.setupEventListeners();

        // Simulate demo user login after a short delay
        setTimeout(() => {
          const demoUser = {
            id: 'demo-user-123',
            email: 'demo@familyhealthtracker.com',
            user_metadata: {
              full_name: 'Demo User'
            }
          };
          this.handleAuthSuccess(demoUser);
        }, 1000);
        return;
      }

      console.log('🔍 Checking Supabase availability...');
      // Check if Supabase is loaded
      if (!window.supabase) {
        throw new Error('Supabase library not loaded. Please check your internet connection.');
      }

      console.log('🔗 Creating Supabase client...');
      // Initialize Supabase client
      this.supabase = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey
      );
      console.log('✅ Supabase client created successfully');

      console.log('🎧 Setting up event listeners...');
      // Set up event listeners
      this.setupEventListeners();

      console.log('🔍 Checking for existing session...');
      // Check for existing session
      const { data: { session } } = await this.supabase.auth.getSession();

      // Also check for auth tokens in URL (from email confirmation)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('🔗 Auth tokens found in URL, setting session...');
        try {
          const { data: sessionData, error: sessionError } = await this.supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) throw sessionError;

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);

          if (sessionData.session) {
            console.log('✅ Session set from URL tokens, logging in user');
            await this.handleAuthSuccess(sessionData.session.user);
            return;
          }
        } catch (error) {
          console.error('❌ Error setting session from URL tokens:', error);
          this.showNotification('Email verification failed. Please try again.', 'error');
        }
      }

      if (session) {
        console.log('✅ Existing session found, logging in user');
        await this.handleAuthSuccess(session.user);
      } else {
        console.log('📝 No existing session, showing auth modal');
        this.showAuthModal();
      }

      console.log('👂 Setting up auth state change listener...');
      // Listen for auth state changes
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          this.handleAuthSuccess(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut();
        }
      });

      console.log('🎉 Auth initialization completed successfully!');

    } catch (error) {
      console.error('❌ Auth initialization error:', error);
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
    console.log('📱 showAuthModal() called');
    console.log('🔍 Auth modal element:', this.authModal);
    console.log('🔍 Loading screen element:', document.getElementById('loading-screen'));

    if (this.authModal) {
      this.authModal.classList.remove('hidden');
      console.log('✅ Auth modal shown');
    } else {
      console.error('❌ Auth modal element not found!');
    }

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      console.log('✅ Loading screen hidden');
    } else {
      console.error('❌ Loading screen element not found!');
    }
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
    // Get the current URL for redirect
    const currentUrl = window.location.origin + window.location.pathname;

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: currentUrl
      },
    });

    if (error) throw error;

    if (data.user && !data.user.email_confirmed_at) {
      this.showNotification(
        'Please check your email and click the confirmation link to complete registration. The link will redirect you back to this page.',
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

// Wait for libraries to be loaded before initializing
function waitForLibraries() {
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (window.supabase && window.Chart && window.librariesLoaded) {
        console.log('✅ All libraries are ready, initializing auth manager');
        resolve();
      } else {
        console.log('⏳ Waiting for libraries to load...', {
          supabase: !!window.supabase,
          chart: !!window.Chart,
          librariesLoaded: !!window.librariesLoaded
        });
        setTimeout(checkLibraries, 200);
      }
    };
    checkLibraries();
  });
}

// Initialize auth manager when libraries are ready
async function initializeAuthManager() {
  console.log('🚀 Starting auth manager initialization...');
  try {
    console.log('⏳ Waiting for libraries to be ready...');
    await waitForLibraries();
    console.log('📱 Creating AuthManager instance...');
    window.authManager = new AuthManager();
    console.log('✅ AuthManager created successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize auth manager:', error);
    // Show error message to user
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h2 style="color: #dc3545;">Initialization Error</h2>
          <p>Failed to initialize the application. Please refresh the page.</p>
          <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuthManager);
} else {
  initializeAuthManager();
}
