export class ApiClient {
  constructor(baseUrl = 'http://localhost:4000/api/v1') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials || 'include' // Send cookies automatically
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const error = new Error(data?.message || 'API request failed');
      error.code = data?.code || 'API_ERROR';
      error.details = data?.details;
      error.status = res.status;
      throw error;
    }

    return data;
  }

  // Health
  async getHealth() {
    return this.request('/health');
  }

  // Auth Endpoints
  async signup({ email, password, displayName }) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
    if (data.tokens?.accessToken) this.setToken(data.tokens.accessToken);
    return data;
  }

  async login({ email, password }) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.tokens?.accessToken) this.setToken(data.tokens.accessToken);
    return data;
  }

  async logout() {
    const data = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return data;
  }

  async getSession() {
    return this.request('/auth/session');
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  }

  async verifyEmail(token) {
    return this.request(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  // User Profile
  async getMyProfile() {
    return this.request('/users/me');
  }

  async updateMyProfile({ displayName, bio, avatarUrl }) {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, bio, avatarUrl })
    });
  }

  async getUserProfile(id) {
    return this.request(`/users/${id}`);
  }

  // Maps
  async getMapMarkers({ minLng, minLat, maxLng, maxLat }) {
    const params = new URLSearchParams({ minLng, minLat, maxLng, maxLat });
    return this.request(`/maps/markers?${params.toString()}`);
  }

  // Stories
  async getPublishedStories() {
    return this.request('/content/stories');
  }
}

export default ApiClient;
