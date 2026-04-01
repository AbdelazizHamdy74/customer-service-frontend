export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',
  authServiceUrl: 'https://api.example.com/api/auth',
  tokenRefreshInterval: 5 * 60 * 1000, // 5 minutes
  tokenRefreshThreshold: 60 * 1000, // Refresh 1 minute before expiry
};
