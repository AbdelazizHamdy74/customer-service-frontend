import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AuditLogItem } from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Compliance</p>
        <h1 class="text-3xl font-semibold tracking-tight text-slate-950">Audit log</h1>
        <p class="max-w-2xl text-sm leading-6 text-slate-600">
          Recent security-relevant actions across tickets and canned responses (admin &amp;
          supervisor).
        </p>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-950">Events</h2>
          <span class="text-sm text-slate-500">Total {{ total() }}</span>
        </div>
        <div *ngIf="loading()" class="text-slate-600 text-sm">Loading…</div>
        <div *ngIf="error()" class="text-red-600 text-sm">{{ error() }}</div>
        <div *ngIf="!loading() && !error()" class="overflow-x-auto">
          <table class="w-full table-auto text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-slate-950">
                <th class="px-2 py-2 font-semibold">Time</th>
                <th class="px-2 py-2 font-semibold">Action</th>
                <th class="px-2 py-2 font-semibold">Actor</th>
                <th class="px-2 py-2 font-semibold">Resource</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let row of items()" class="align-top text-slate-700">
                <td class="px-2 py-2 whitespace-nowrap">{{ row.createdAt | date : 'short' }}</td>
                <td class="px-2 py-2 font-medium text-slate-900">{{ row.action }}</td>
                <td class="px-2 py-2">
                  {{ row.actorRole || '—' }}
                  <span *ngIf="row.actorId" class="block text-xs text-slate-500">{{ row.actorId }}</span>
                </td>
                <td class="px-2 py-2">
                  {{ row.resourceType }}<span *ngIf="row.resourceId"> #{{ row.resourceId }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="items().length === 0" class="py-8 text-center text-slate-500">No entries yet.</p>
        </div>
      </div>
    </section>
  `,
})
export class AuditLogComponent {
  private readonly tickets = inject(TicketService);

  readonly items = signal<AuditLogItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.tickets.getAuditLogs(1, 100).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load audit log.');
        this.loading.set(false);
      },
    });
  }
}
