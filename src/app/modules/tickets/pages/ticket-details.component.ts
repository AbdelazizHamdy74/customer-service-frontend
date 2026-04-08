import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Ticket } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Tickets workspace
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">
            Ticket #{{ ticket()?.id || 'Loading...' }}
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            View and manage ticket details, comments, and history.
          </p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Back to tickets
        </button>
      </div>

      <div *ngIf="ticket(); else loading" class="space-y-6">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-slate-950">{{ ticket()!.subject }}</h2>
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                [ngClass]="getStatusBadgeClasses(ticket()!.status)"
              >
                {{ getStatusLabel(ticket()!.status) }}
              </span>
            </div>
            <p class="text-slate-600">{{ ticket()!.description }}</p>
            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <span class="text-sm font-medium text-slate-700">Customer ID:</span>
                <p class="text-sm text-slate-900">{{ ticket()!.customerId }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-slate-700">Assigned Agent:</span>
                <p class="text-sm text-slate-900">
                  {{ ticket()!.assignedAgentId || 'Unassigned' }}
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-slate-700">Created:</span>
                <p class="text-sm text-slate-900">{{ formatDate(ticket()!.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-950 mb-4">Comments</h3>
          <div class="space-y-4">
            <div
              *ngFor="let comment of ticket()!.comments"
              class="border-l-4 border-indigo-200 pl-4"
            >
              <p class="text-sm text-slate-600">{{ comment.message }}</p>
              <p class="text-xs text-slate-500 mt-1">
                {{ comment.authorRole }} • {{ formatDate(comment.createdAt) }}
              </p>
            </div>
            <p *ngIf="ticket()!.comments.length === 0" class="text-slate-500">No comments yet.</p>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-slate-600">Loading ticket details...</p>
        </div>
      </ng-template>
    </section>
  `,
})
export class TicketDetailsComponent {
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly ticket = signal<Ticket | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ticketService.getById(id).subscribe({
        next: (ticket) => this.ticket.set(ticket),
        error: (error) => {
          console.error('Error loading ticket:', error);
          this.router.navigate(['/tickets']);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  getStatusBadgeClasses(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'WAITING_CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'WAITING_CUSTOMER':
        return 'Waiting Customer';
      case 'RESOLVED':
        return 'Resolved';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
