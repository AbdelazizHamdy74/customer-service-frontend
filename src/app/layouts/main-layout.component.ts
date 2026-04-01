import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold text-lg">CS</span>
            </div>
            <h1 class="text-xl font-bold text-slate-900">Customer Service</h1>
          </div>

          <div class="flex items-center space-x-4">
            <div *ngIf="user()" class="flex items-center space-x-3">
              <div>
                <p class="text-sm font-medium text-slate-900">{{ user()?.name }}</p>
                <p class="text-xs text-slate-500">{{ user()?.role }}</p>
              </div>
              <button
                (click)="logout()"
                class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [],
})
export class MainLayoutComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  get user() {
    return this.authService.user$;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      },
    });
  }
}
