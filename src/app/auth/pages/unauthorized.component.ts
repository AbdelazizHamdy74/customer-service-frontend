import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4"
    >
      <div class="text-center">
        <div
          class="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 rounded-full mb-6"
        >
          <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4v2m0 0v2M6.343 4.343L4.929 5.757M17.071 4.343l1.414 1.414M4.929 18.243L6.343 19.657m12.728 0l1.414-1.414M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            ></path>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <p class="text-slate-400 text-lg mb-8">You don't have permission to access this page.</p>
        <a
          routerLink="/dashboard"
          class="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [],
})
export class UnauthorizedComponent {}
