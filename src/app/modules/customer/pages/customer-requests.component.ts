import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';
import { Ticket, TicketStatus } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-customer-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            My support
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">My requests</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Create a ticket and track status for your open support conversations.
          </p>
        </div>
        <button
          type="button"
          (click)="openModal()"
          class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          New ticket
        </button>
      </div>

      <div
        *ngIf="error()"
        class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900"
      >
        {{ error() }}
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-semibold text-slate-950">Your tickets ({{ tickets().length }})</h2>
          <button
            type="button"
            (click)="reload()"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div class="mt-6 overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="border-b border-slate-200">
                <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Subject</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Created</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr *ngFor="let t of tickets()" class="hover:bg-slate-50 transition">
                <td class="px-4 py-4">
                  <p class="text-sm font-medium text-slate-950">{{ t.subject }}</p>
                  <p class="text-xs text-slate-600 line-clamp-2">{{ t.description }}</p>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [ngClass]="statusClass(t.status)"
                  >
                    {{ statusLabel(t.status) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-700">{{ formatDate(t.createdAt) }}</td>
                <td class="px-4 py-4">
                  <a
                    [routerLink]="ticketDetailUrl(t.id)"
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p *ngIf="tickets().length === 0 && !loading()" class="mt-8 text-center text-slate-500">
          No tickets yet. Use &quot;New ticket&quot; to open a request.
        </p>
        <p *ngIf="loading()" class="mt-8 text-center text-slate-500">Loading…</p>
      </div>
    </section>

    <div
      *ngIf="modalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      (click)="closeModal()"
    >
      <div
        class="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              New request
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Create a ticket</h2>
            <p class="mt-1 text-sm text-slate-600">
              Describe your issue; our team will respond as soon as possible.
            </p>
          </div>
          <button
            type="button"
            (click)="closeModal()"
            class="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submitTicket()" class="mt-6 space-y-4">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">Subject *</span>
            <input
              formControlName="subject"
              type="text"
              placeholder="Short summary"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">Description *</span>
            <textarea
              formControlName="description"
              rows="4"
              placeholder="What happened? Include any error messages or steps."
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            ></textarea>
          </label>
          <p *ngIf="createError()" class="text-sm text-red-600">{{ createError() }}</p>
          <div class="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              [disabled]="form.invalid || createLoading()"
              class="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Submit ticket
            </button>
            <button
              type="button"
              (click)="closeModal()"
              class="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CustomerRequestsComponent {
  private readonly ticketService = inject(TicketService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly modalOpen = signal(false);
  readonly createLoading = signal(false);
  readonly createError = signal<string | null>(null);

  readonly form = this.fb.group({
    subject: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    this.reload();
  }

  ticketDetailUrl(id: string): string {
    return `${getRoleBasePath(this.auth.user$()?.role)}/tickets/${id}`;
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ticketService.search({ page: 1, limit: 50 }).subscribe({
      next: (res) => {
        this.tickets.set(res.tickets);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Could not load your tickets.');
      },
    });
  }

  openModal(): void {
    this.createError.set(null);
    this.form.reset();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  submitTicket(): void {
    if (this.form.invalid) return;
    this.createLoading.set(true);
    this.createError.set(null);
    const v = this.form.getRawValue();
    this.ticketService
      .create({
        subject: v.subject!,
        description: v.description!,
      })
      .subscribe({
        next: () => {
          this.createLoading.set(false);
          this.closeModal();
          this.reload();
        },
        error: (err) => {
          this.createLoading.set(false);
          this.createError.set(err?.error?.message || 'Failed to create ticket.');
        },
      });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  statusLabel(status: TicketStatus): string {
    const labels: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In progress',
      WAITING_CUSTOMER: 'Waiting for you',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed',
    };
    return labels[status] || status;
  }

  statusClass(status: TicketStatus): string {
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
}
