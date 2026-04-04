import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App implements OnInit {
  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.authService.restoreSession().subscribe();
    this.setupTokenRefresh();
  }

  private setupTokenRefresh(): void {
    setInterval(() => {
      if (this.authService.isAuthenticated() && this.authService.shouldRefreshToken()) {
        this.authService.refreshAccessToken().subscribe({
          error: (error) => {
            console.error('Error refreshing token:', error);
          },
        });
      }
    }, 60000);
  }
}
