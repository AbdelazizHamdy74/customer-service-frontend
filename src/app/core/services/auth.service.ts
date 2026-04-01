import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { JwtService } from './jwt.service';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
  AuthState,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.authServiceUrl;

  // Signals
  private userSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);
  private refreshTokenSignal = signal<string | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public signals
  user$ = this.userSignal.asReadonly();
  accessToken$ = this.accessTokenSignal.asReadonly();
  refreshToken$ = this.refreshTokenSignal.asReadonly();
  isAuthenticated$ = this.isAuthenticatedSignal.asReadonly();
  isLoading$ = this.isLoadingSignal.asReadonly();
  error$ = this.errorSignal.asReadonly();

  // Auth state stream
  private authStateSubject = new BehaviorSubject<AuthState>(this.getCurrentAuthState());
  authState$: Observable<AuthState> = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
  ) {
    this.initializeFromStorage();
    this.setupEffects();
  }

  /**
   * Initialize signals from storage
   */
  private initializeFromStorage(): void {
    const user = this.storageService.getItem('user');
    const accessToken = this.storageService.getItem('accessToken');
    const refreshToken = this.storageService.getItem('refreshToken');

    if (user) this.userSignal.set(user);
    if (accessToken) this.accessTokenSignal.set(accessToken);
    if (refreshToken) this.refreshTokenSignal.set(refreshToken);
    if (accessToken && !this.jwtService.isTokenExpired(accessToken)) {
      this.isAuthenticatedSignal.set(true);
    }
  }

  /**
   * Setup effects to sync signals with storage and auth state
   */
  private setupEffects(): void {
    effect(() => {
      const authState: AuthState = {
        user: this.userSignal(),
        accessToken: this.accessTokenSignal(),
        refreshToken: this.refreshTokenSignal(),
        isAuthenticated: this.isAuthenticatedSignal(),
        isLoading: this.isLoadingSignal(),
        error: this.errorSignal(),
      };
      this.authStateSubject.next(authState);
    });
  }

  /**
   * Get current auth state
   */
  private getCurrentAuthState(): AuthState {
    return {
      user: this.userSignal(),
      accessToken: this.accessTokenSignal(),
      refreshToken: this.refreshTokenSignal(),
      isAuthenticated: this.isAuthenticatedSignal(),
      isLoading: this.isLoadingSignal(),
      error: this.errorSignal(),
    };
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.data) {
          this.setAuthTokens(
            response.data.user,
            response.data.accessToken,
            response.data.refreshToken,
          );
          this.isLoadingSignal.set(false);
        }
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || 'Login failed';
        this.errorSignal.set(errorMessage);
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    const refreshToken = this.refreshTokenSignal();

    return this.http.post(`${this.API_URL}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearAuthData();
      }),
      catchError((error) => {
        // Clear auth data even if logout request fails
        this.clearAuthData();
        return throwError(() => error);
      }),
    );
  }

  /**
   * Forgot password
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post(`${this.API_URL}/forgot-password`, request).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || 'Failed to send reset email';
        this.errorSignal.set(errorMessage);
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Reset password
   */
  resetPassword(request: ResetPasswordRequest): Observable<any> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post(`${this.API_URL}/reset-password`, request).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => {
        const errorMessage = error?.error?.message || 'Failed to reset password';
        this.errorSignal.set(errorMessage);
        this.isLoadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Refresh access token
   */
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh-token`, request).pipe(
      tap((response) => {
        if (response.data) {
          this.accessTokenSignal.set(response.data.accessToken);
          this.storageService.setItem('accessToken', response.data.accessToken);

          if (response.data.refreshToken) {
            this.refreshTokenSignal.set(response.data.refreshToken);
            this.storageService.setItem('refreshToken', response.data.refreshToken);
          }
        }
      }),
      catchError((error) => {
        // If refresh fails, clear auth data
        if (error.status === 401 || error.status === 403) {
          this.clearAuthData();
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.accessTokenSignal();
    return !!token && !this.jwtService.isTokenExpired(token);
  }

  /**
   * Check if token needs refresh
   */
  shouldRefreshToken(): boolean {
    const token = this.accessTokenSignal();
    if (!token) return false;

    const offsetSeconds = environment.tokenRefreshThreshold / 1000;
    return this.jwtService.isTokenExpired(token, offsetSeconds);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.userSignal();
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  /**
   * Check if user has specific role
   */
  hasRole(requiredRoles: string[]): boolean {
    const user = this.userSignal();
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  /**
   * Private: Set auth tokens and user data
   */
  private setAuthTokens(user: User, accessToken: string, refreshToken: string): void {
    this.userSignal.set(user);
    this.accessTokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.isAuthenticatedSignal.set(true);

    this.storageService.setItem('user', user);
    this.storageService.setItem('accessToken', accessToken);
    this.storageService.setItem('refreshToken', refreshToken);
  }

  /**
   * Private: Clear auth data
   */
  private clearAuthData(): void {
    this.userSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.errorSignal.set(null);

    this.storageService.removeItem('user');
    this.storageService.removeItem('accessToken');
    this.storageService.removeItem('refreshToken');
  }

  /**
   * Restore session from stored tokens
   */
  restoreSession(): Observable<boolean> {
    const accessToken = this.accessTokenSignal();
    const refreshToken = this.refreshTokenSignal();

    if (!accessToken || !refreshToken) {
      return new Observable<boolean>((observer) => {
        observer.next(false);
        observer.complete();
      });
    }

    // Check if access token is still valid
    if (!this.jwtService.isTokenExpired(accessToken)) {
      this.isAuthenticatedSignal.set(true);
      return new Observable<boolean>((observer) => {
        observer.next(true);
        observer.complete();
      });
    }

    // Try to refresh the token
    return this.refreshAccessToken().pipe(
      map(() => {
        this.isAuthenticatedSignal.set(true);
        return true;
      }),
      catchError(() => {
        this.clearAuthData();
        return new Observable<boolean>((observer) => {
          observer.next(false);
          observer.complete();
        });
      }),
    );
  }
}
