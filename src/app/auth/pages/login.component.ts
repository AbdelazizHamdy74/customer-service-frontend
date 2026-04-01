import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="w-full">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4"
        >
          <span class="text-3xl font-bold text-white">CS</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p class="text-slate-400">Customer Service Management System</p>
      </div>

      <!-- Card -->
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <!-- Alert Messages -->
        <div
          *ngIf="error()"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm"
        >
          {{ error() }}
        </div>

        <!-- Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-200 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              [class.border-red-500]="isFieldInvalid('email')"
              [class.focus:border-red-500]="isFieldInvalid('email')"
            />
            <p *ngIf="isFieldInvalid('email')" class="mt-2 text-sm text-red-400">
              Please enter a valid email address
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-200 mb-2">
              Password
            </label>
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              [class.border-red-500]="isFieldInvalid('password')"
              [class.focus:border-red-500]="isFieldInvalid('password')"
            />
            <button
              type="button"
              (click)="togglePasswordVisibility()"
              class="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {{ showPassword() ? 'Hide' : 'Show' }} password
            </button>
            <p *ngIf="isFieldInvalid('password')" class="mt-2 text-sm text-red-400">
              Password is required
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span *ngIf="!isLoading()">Sign In</span>
            <span *ngIf="isLoading()" class="flex items-center space-x-2">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Signing in...</span>
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-slate-600"></div>
          <span class="px-3 text-slate-400 text-sm">or</span>
          <div class="flex-1 border-t border-slate-600"></div>
        </div>

        <!-- Footer Links -->
        <div class="space-y-3 text-sm text-center">
          <p>
            <a
              routerLink="/forgot-password"
              class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Forgot your password?
            </a>
          </p>
        </div>
      </div>

      <!-- Demo Credentials -->
      <!-- <div
        class="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs rounded-lg"
      >
        <p class="font-semibold mb-2">Demo Credentials:</p>
        <p>Email: admin@example.com</p>
        <p>Password: password123</p>
      </div> -->
    </div>
  `,
  styles: [],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get isLoading() {
    return this.authService.isLoading$;
  }

  get error() {
    return this.authService.error$;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Submit login form
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const credentials = this.loginForm.value;
    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Get redirect URL or use role-based redirection
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectUrl');
          this.router.navigateByUrl(redirectUrl);
        } else {
          // Navigate based on user role
          const user = response.data.user;
          this.router.navigate([this.getRoleBasedPath(user.role)]);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        // Error is already handled by the auth service
      },
    });
  }

  /**
   * Get path based on user role
   */
  private getRoleBasedPath(role: string): string {
    const rolePaths: { [key: string]: string } = {
      ADMIN: '/admin/dashboard',
      SUPERVISOR: '/supervisor/dashboard',
      AGENT: '/agent/dashboard',
      CUSTOMER: '/customer/dashboard',
    };
    return rolePaths[role] || '/dashboard';
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
