import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">My Dashboard</h1>
        <p class="text-slate-600 mt-2">Hello, {{ user()?.name }}!</p>
      </div>

      <!-- Welcome Card -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white mb-8"
      >
        <h2 class="text-2xl font-bold mb-2">Welcome to Customer Service</h2>
        <p class="opacity-90">Manage your support tickets and track your requests in real-time.</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-slate-600 text-sm font-medium">Open Tickets</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">3</p>
          <p class="text-slate-500 text-sm mt-2">Waiting for response</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-slate-600 text-sm font-medium">Resolved Tickets</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">12</p>
          <p class="text-green-600 text-sm mt-2">Completed</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-slate-600 text-sm font-medium">Average Response</h3>
          <p class="text-3xl font-bold text-slate-900 mt-2">2h 30m</p>
          <p class="text-slate-500 text-sm mt-2">Support team</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-bold text-slate-900 mb-4">What would you like to do?</h2>
        <div class="flex flex-col space-y-3">
          <button
            class="text-left p-4 border border-slate-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <p class="font-medium text-slate-900">Create a New Ticket</p>
            <p class="text-sm text-slate-500">Report a new issue or request help</p>
          </button>
          <button
            class="text-left p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <p class="font-medium text-slate-900">View My Tickets</p>
            <p class="text-sm text-slate-500">Check the status of your support requests</p>
          </button>
          <button
            class="text-left p-4 border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <p class="font-medium text-slate-900">Contact Support</p>
            <p class="text-sm text-slate-500">Get help from our support team</p>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CustomerDashboardComponent {
  constructor(private authService: AuthService) {}

  get user() {
    return this.authService.user$;
  }
}
