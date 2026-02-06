/**
 * API Service for Portfolio Admin Backend
 * Handles all HTTP requests to the FastAPI backend
 */

// Base URL - use environment variable or default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

// Storage keys (must match AuthContext)
const TOKEN_STORAGE_KEY = 'admin_token';

/**
 * Get JWT token from storage (sessionStorage or localStorage)
 */
function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Get session object for backward compatibility
 */
function getSession() {
  const token = getToken();
  return token ? { token } : null;
}

/**
 * Update token if server issued a new one (sliding expiration)
 */
function handleTokenRefresh(response) {
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    console.log('Token refreshed via sliding expiration');
  }
}

/**
 * Check if we're in demo mode (test user)
 */
function isDemoMode() {
  const token = getToken();
  return token === 'TEST_TOKEN_DEMO_MODE';
}

/**
 * Get mock response for demo mode
 */
async function getMockResponse(endpoint) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  // Dashboard endpoints
  if (endpoint.includes('/dashboard/stats')) {
    return {
      status: 'success',
      stats: { total_queries: 0 }
    };
  }

  if (endpoint.includes('/dashboard/activity')) {
    return {
      status: 'success',
      activity: []
    };
  }

  if (endpoint.includes('/dashboard/weekly')) {
    return {
      status: 'success',
      weekly: []
    };
  }

  // Knowledge base endpoints
  if (endpoint.includes('/knowledge')) {
    return {
      status: 'success',
      categories: {}
    };
  }

  // System instructions
  if (endpoint.includes('/system-instructions')) {
    return {
      status: 'success',
      content: ''
    };
  }

  // Projects
  if (endpoint.includes('/projects')) {
    return {
      status: 'success',
      projects: []
    };
  }

  // Contacts
  if (endpoint.includes('/contacts')) {
    return {
      status: 'success',
      contact: { email: '', socials: {} }
    };
  }

  // Communication
  if (endpoint.includes('/communication')) {
    return {
      status: 'success',
      records: [],
      count: 0
    };
  }

  // Default response
  return { status: 'success', data: [] };
}

/**
 * Make an API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();

  // Check for demo mode - return mock responses
  if (isDemoMode()) {
    console.log('[Demo Mode] Mock response for:', endpoint);
    return getMockResponse(endpoint);
  }

  try {
    const headers = {
      ...options.headers,
    };

    // Add auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    return handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or server down
    throw new ApiError(error.message || 'Network error', 0, { originalError: error });
  }
}

async function handleResponse(response) {
  // Check for token refresh (sliding expiration)
  handleTokenRefresh(response);

  if (!response.ok) {
    // Handle 401 - token expired, clear session
    if (response.status === 401) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem('admin_user_info');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }

  return await response.json();
}

// ============================================
// Health API
// ============================================

export const healthApi = {
  /**
   * Check server health
   */
  async check() {
    if (isDemoMode()) {
      return true;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};

// ============================================
// Auth API
// ============================================

export const authApi = {
  /**
   * Login with credentials
   */
  async login(username, password) {
    const result = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (result.status === 'success' && result.token) {
      // Store the JWT token for subsequent authenticated requests
      sessionStorage.setItem(TOKEN_STORAGE_KEY, result.token);

      if (result.user) {
        sessionStorage.setItem('admin_user_info', JSON.stringify(result.user));
      }
    }

    return result;
  },

  /**
   * Logout
   */
  async logout() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem('admin_user_info');
    localStorage.removeItem('admin_session');
    return { status: 'success' };
  },

  /**
   * Check if session is valid
   */
  isLoggedIn() {
    return !!getToken();
  },

  /**
   * Get current token
   */
  getToken() {
    return getToken();
  },

  /**
   * Get current session (backward compatibility)
   */
  getSession() {
    return getSession();
  },
};

// ============================================
// System Instructions API
// ============================================

export const systemInstructionsApi = {
  /**
   * Get current system instructions
   */
  async get() {
    return apiRequest('/api/v1/system-instructions');
  },

  /**
   * Save system instructions
   */
  async save(content, message = null) {
    return apiRequest('/api/v1/system-instructions/save', {
      method: 'POST',
      body: JSON.stringify({ content, message }),
    });
  },
};

// ============================================
// Main API Object
// ============================================

export const api = {
  auth: authApi,
  health: healthApi,
  systemInstructions: systemInstructionsApi,

  /**
   * Dashboard API
   */
  dashboard: {
    getStats: () => apiRequest('/api/v1/dashboard/stats'),
    getActivity: (limit = 10) => apiRequest(`/api/v1/dashboard/activity?limit=${limit}`),
    getWeekly: () => apiRequest('/api/v1/dashboard/weekly'),
  },

  /**
   * Knowledge Base API
   * For managing the knowledge categories used by NEXUS chatbot
   */
  knowledge: {
    /**
     * Get all knowledge categories
     * @returns {Promise<{status: string, categories: Object}>}
     */
    getAll: async () => {
      return apiRequest('/api/v1/knowledge');
    },

    /**
     * Get list of valid category names
     * @returns {Promise<{status: string, categories: string[]}>}
     */
    getCategories: async () => {
      return apiRequest('/api/v1/knowledge/categories');
    },

    /**
     * Get content for a specific category
     * @param {string} category - Category ID (about_me, tech_stack, projects, contact, misc)
     * @returns {Promise<{status: string, category: string, data: Object}>}
     */
    get: async (category) => {
      return apiRequest(`/api/v1/knowledge/${encodeURIComponent(category)}`);
    },

    /**
     * Save content for a specific category
     * @param {string} category - Category ID
     * @param {string} content - New content
     * @returns {Promise<{status: string, message: string}>}
     */
    save: async (category, content) => {
      return apiRequest(`/api/v1/knowledge/${encodeURIComponent(category)}/save`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  },

  /**
   * Contacts API
   * For managing contact information (email and social links)
   */
  contacts: {
    /**
     * Get contact information
     * @returns {Promise<{status: string, contact: Object, commit: string}>}
     */
    get: async () => {
      return apiRequest('/api/v1/contacts');
    },

    /**
     * Save contact information
     * @param {Object} contact - Contact data with email and socials
     * @param {string} [message] - Optional commit message
     * @returns {Promise<{status: string, message: string, commit: string}>}
     */
    save: async (contact, message = null) => {
      return apiRequest('/api/v1/contacts/save', {
        method: 'POST',
        body: JSON.stringify({ contact, message }),
      });
    },
  },

  /**
   * Communication API
   * For managing contact form submissions from portfolio website
   */
  communication: {
    /**
     * Get all communication records
     * @param {string} [status] - Optional status filter (new, done, dismissed)
     * @returns {Promise<{status: string, records: Array, count: number}>}
     */
    getAll: async (status = '') => {
      const url = status ? `/api/v1/communication?status=${status}` : '/api/v1/communication';
      return apiRequest(url);
    },

    /**
     * Update record status
     * @param {string} recordId - Record ID
     * @param {string} status - New status (new, done, dismissed)
     * @returns {Promise<{status: string, message: string}>}
     */
    updateStatus: async (recordId, status) => {
      return apiRequest(`/api/v1/communication/${recordId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    /**
     * Delete a record
     * @param {string} recordId - Record ID
     * @returns {Promise<{status: string, message: string}>}
     */
    delete: async (recordId) => {
      return apiRequest(`/api/v1/communication/${recordId}`, {
        method: 'DELETE',
      });
    },
  },

  /**
   * Projects API
   * For managing portfolio projects
   */
  projects: {
    /**
     * Get all projects
     * @returns {Promise<{status: string, projects: Array, commit: string}>}
     */
    get: async () => {
      return apiRequest('/api/v1/projects');
    },

    /**
     * Save projects list
     * @param {Array} projects - Array of project objects
     * @param {string} [message] - Optional commit message
     * @param {Array} [oldProjects] - Previous projects for cleanup
     * @returns {Promise<{status: string, message: string, commit: string}>}
     */
    save: async (projects, message = null, oldProjects = null) => {
      const body = { projects, message };
      if (oldProjects) {
        body.oldProjects = oldProjects;
      }
      return apiRequest('/api/v1/projects/save', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    /**
     * Upload and process a project image
     * @param {File} file - Image file to upload
     * @param {string} projectName - Project name for filename generation
     * @returns {Promise<{status: string, imageUrl: string, filename: string}>}
     */
    uploadImage: async (file, projectName) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', projectName);

      return apiRequest('/api/v1/projects/upload-image', {
        method: 'POST',
        body: formData,
      });
    },
  },
};

export default api;
