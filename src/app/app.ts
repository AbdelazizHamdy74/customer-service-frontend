import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { AuthHttpInterceptor } from './core/interceptors/auth.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true,
    },
  ],
  template: `<router-outlet></router-outlet>`,
  styles: [],
})
export class App implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Restore session on app initialization
    this.authService.restoreSession().subscribe((restored) => {
      if (restored) {
        console.log('Session restored successfully');
      } else {
        console.log('No valid session to restore');
      }
    });

    // Setup automatic token refresh
    this.setupTokenRefresh();
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    setInterval(() => {
      if (this.authService.isAuthenticated() && this.authService.shouldRefreshToken()) {
        this.authService.refreshAccessToken().subscribe({
          next: () => {
            console.log('Token refreshed successfully');
          },
          error: (error) => {
            console.error('Error refreshing token:', error);
          },
        });
      }
    }, 60000); // Check every minute
  }
}
