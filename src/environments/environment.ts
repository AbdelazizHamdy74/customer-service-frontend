export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000/api/v1',
  authServiceUrl: 'http://localhost:4000/api/v1/auth',
  tokenRefreshInterval: 5 * 60 * 1000, // 5 minutes
  tokenRefreshThreshold: 60 * 1000, // Refresh 1 minute before expiry
};
