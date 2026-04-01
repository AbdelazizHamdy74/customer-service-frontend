import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add token to request
    const token = this.authService.getAccessToken();
    if (token && !this.isTokenRequest(req)) {
      req = this.addToken(req, token);
    }

    return next.handle(req).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 401:
              return this.handle401Error(req, next);
            case 403:
              return this.handle403Error();
            default:
              return throwError(() => error);
          }
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * Add token to request headers
   */
  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Handle 401 Unauthorized error
   */
  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshAccessToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          const token = response.data.accessToken;
          this.refreshTokenSubject.next(token);

          // Retry the original request with new token
          return next.handle(this.addToken(req, token));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe(() => {
            // Navigate to login
            window.location.href = '/login';
          });
          return throwError(() => error);
        }),
      );
    } else {
      // Wait for token refresh to complete
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(req, token));
        }),
      );
    }
  }

  /**
   * Handle 403 Forbidden error
   */
  private handle403Error(): Observable<HttpEvent<any>> {
    this.authService.logout().subscribe(() => {
      window.location.href = '/login';
    });
    return throwError(() => new Error('Access Denied'));
  }

  /**
   * Check if request is a token-related request
   */
  private isTokenRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/refresh-token') || req.url.includes('/logout');
  }
}
