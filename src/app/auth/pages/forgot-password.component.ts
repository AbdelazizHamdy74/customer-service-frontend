import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
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
        <h1 class="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p class="text-slate-400">We'll send you a link to reset your password</p>
      </div>

      <!-- Card -->
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <!-- Success Message -->
        <div
          *ngIf="resetSent()"
          class="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg"
        >
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <div>
              <p class="font-semibold">Check your email</p>
              <p class="text-sm mt-1">We've sent a password reset link to your email address.</p>
            </div>
          </div>
        </div>

        <!-- Alert Messages -->
        <div
          *ngIf="error() && !resetSent()"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm"
        >
          {{ error() }}
        </div>

        <!-- Form -->
        <form
          *ngIf="!resetSent()"
          [formGroup]="forgotPasswordForm"
          (ngSubmit)="onSubmit()"
          class="space-y-6"
        >
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

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="forgotPasswordForm.invalid || isLoading()"
            class="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span *ngIf="!isLoading()">Send Reset Link</span>
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
              <span>Sending...</span>
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-6 text-center text-sm">
          <p class="text-slate-400">
            Remember your password?
            <a
              routerLink="/login"
              class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;

  resetSent = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }
  get isLoading() {
    return this.authService.isLoading$;
  }

  get error() {
    return this.authService.error$;
  }
  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Submit forgot password form
   */
  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    const request = this.forgotPasswordForm.value;
    this.authService.forgotPassword(request).subscribe({
      next: () => {
        this.resetSent.set(true);
        // Redirect to login after 5 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 5000);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Forgot password error:', error);
        // Error is already handled by the auth service
      },
    });
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
