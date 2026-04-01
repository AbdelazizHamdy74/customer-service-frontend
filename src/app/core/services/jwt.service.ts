import { Injectable } from '@angular/core';
import { TokenPayload } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  /**
   * Decode JWT token
   */
  decode(token: string): TokenPayload | null {
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      const decoded = JSON.parse(this.urlBase64Decode(parts[1]));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string | null, offsetSeconds: number = 0): boolean {
    if (!token) return true;

    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime + offsetSeconds;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Get token expiry time in milliseconds
   */
  getTokenExpiry(token: string | null): number | null {
    if (!token) return null;

    try {
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) return null;

      return decoded.exp * 1000;
    } catch (error) {
      console.error('Error getting token expiry:', error);
      return null;
    }
  }

  /**
   * Get time until token expiry in milliseconds
   */
  getTimeUntilExpiry(token: string | null): number {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return 0;

    const timeLeft = expiry - Date.now();
    return Math.max(0, timeLeft);
  }

  /**
   * Base64 URL decode
   */
  private urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw new Error('Invalid base64url string');
    }

    try {
      return decodeURIComponent(
        atob(output)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } catch (error) {
      return atob(output);
    }
  }
}
