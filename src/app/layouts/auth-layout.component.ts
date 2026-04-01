import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthLayoutComponent {}
