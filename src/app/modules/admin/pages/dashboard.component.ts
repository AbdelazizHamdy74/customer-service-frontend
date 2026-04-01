import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p class="text-slate-600 mt-2">Welcome back, {{ user()?.name }}!</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <h3 class="text-slate-600 text-sm font-medium">Total Users</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">1,234</p>
          <p class="text-green-600 text-sm mt-2">+12% from last month</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <h3 class="text-slate-600 text-sm font-medium">Active Sessions</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">456</p>
          <p class="text-green-600 text-sm mt-2">+8% from last week</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <h3 class="text-slate-600 text-sm font-medium">Resolved Tickets</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">892</p>
          <p class="text-green-600 text-sm mt-2">+23% from last month</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
          <h3 class="text-slate-600 text-sm font-medium">Pending Tickets</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">145</p>
          <p class="text-red-600 text-sm mt-2">-5% from last week</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            class="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium"
          >
            Manage Users
          </button>
          <button
            class="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
          >
            View Reports
          </button>
          <button
            class="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium"
          >
            System Settings
          </button>
          <button
            class="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
          >
            Analytics
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AdminDashboardComponent {
  constructor(private authService: AuthService) {}

  get user() {
    return this.authService.user$;
  }
}
