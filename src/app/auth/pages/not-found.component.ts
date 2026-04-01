import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4"
    >
      <div class="text-center">
        <h1
          class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4"
        >
          404
        </h1>
        <h2 class="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p class="text-slate-400 text-lg mb-8">The page you're looking for doesn't exist.</p>
        <a
          routerLink="/dashboard"
          class="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Go Home
        </a>
      </div>
    </div>
  `,
  styles: [],
})
export class NotFoundComponent {}
