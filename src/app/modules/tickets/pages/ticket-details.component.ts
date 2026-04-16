import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CannedResponseItem, Ticket, TicketPriority } from '../../../core/models/ticket.model';
import { UserRole } from '../../../core/models/auth.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../core/services/ticket.service';
import { Agent } from '../../../core/models/agent.model';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <span class="text-sm font-medium text-slate-700">Priority:</span>
                <p class="text-sm text-slate-900">{{ ticket()!.priority || 'MEDIUM' }}</p>
              </div>
              <div>
                <span class="text-sm font-medium text-slate-700">SLA due:</span>
                <p class="text-sm text-slate-900">
                  {{ formatDate(ticket()!.slaDueAt) }}
                  <span
                    *ngIf="isSlaOverdue(ticket()!)"
                    class="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800"
                    >Overdue</span
                  >
                </p>
              </div>
              <div>
                <span class="text-sm font-medium text-slate-700">Created:</span>
                <p class="text-sm text-slate-900">{{ formatDate(ticket()!.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          *ngIf="canEditPriority() && ticket()!.status !== 'CLOSED'"
          class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 class="text-lg font-semibold text-slate-950">Priority (staff)</h3>
          <p class="mt-1 text-sm text-slate-600">
            Changing priority recalculates SLA from the original creation time.
          </p>
          <form [formGroup]="priorityForm" (ngSubmit)="submitPriority()" class="mt-4 flex flex-wrap items-end gap-4">
            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Priority</span>
              <select
                formControlName="priority"
                class="w-full min-w-[12rem] rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <button
              type="submit"
              [disabled]="prioritySubmitting() || priorityForm.pristine"
              class="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {{ prioritySubmitting() ? 'Saving…' : 'Update priority' }}
            </button>
            <p *ngIf="priorityMessage()" class="text-sm text-emerald-700">{{ priorityMessage() }}</p>
            <p *ngIf="priorityError()" class="text-sm text-red-600">{{ priorityError() }}</p>
          </form>
        </div>

        <div
          *ngIf="canAssign()"
          class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Assignment
          </p>
          <h3 class="mt-2 text-lg font-semibold text-slate-950">Assign to an agent</h3>
          <p class="mt-1 text-sm text-slate-600">
            Choose an active agent so they can pick up the ticket. They will receive an email and an
            in-app notification.
          </p>

          <form [formGroup]="assignForm" (ngSubmit)="submitAssign()" class="mt-6 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Agent *</span>
                <select
                  formControlName="assignedAgentId"
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="">Select…</option>
                  <option *ngFor="let a of agents()" [value]="a.id">
                    {{ agentLabel(a) }}
                  </option>
                </select>
              </label>
              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Note (optional)</span>
                <input
                  formControlName="note"
                  type="text"
                  placeholder="Optional note for history"
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </label>
            </div>
            <p *ngIf="assignError()" class="text-sm text-red-600">{{ assignError() }}</p>
            <p *ngIf="assignSuccess()" class="text-sm text-emerald-700">{{ assignSuccess() }}</p>
            <button
              type="submit"
              [disabled]="ticket()!.status === 'CLOSED' || assignForm.invalid || assignSubmitting()"
              class="inline-flex items-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {{ assignSubmitting() ? 'Assigning…' : 'Assign ticket' }}
            </button>
          </form>
        </div>

        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-950 mb-4">Comments</h3>

          <div *ngIf="cannedList().length > 0" class="mb-4 flex flex-wrap items-center gap-2">
            <span class="text-sm text-slate-600">Canned response:</span>
            <select
              class="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
              (change)="onCannedPick($event)"
            >
              <option value="">Insert…</option>
              <option *ngFor="let c of cannedList(); let i = index" [value]="i">{{ c.title }}</option>
            </select>
          </div>

          <form [formGroup]="commentForm" (ngSubmit)="submitComment()" class="mb-6 space-y-3">
            <label class="space-y-2 block">
              <span class="text-sm font-medium text-slate-700">New comment</span>
              <textarea
                formControlName="message"
                rows="3"
                placeholder="Reply to the customer or internal note"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              ></textarea>
            </label>
            <button
              type="submit"
              [disabled]="ticket()!.status === 'CLOSED' || commentForm.invalid || commentSubmitting()"
              class="inline-flex items-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {{ commentSubmitting() ? 'Sending…' : 'Add comment' }}
            </button>
            <p *ngIf="commentError()" class="text-sm text-red-600">{{ commentError() }}</p>
          </form>

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
  private readonly auth = inject(AuthService);
  private readonly agentService = inject(AgentService);
  private readonly fb = inject(FormBuilder);

  readonly ticket = signal<Ticket | null>(null);
  readonly agents = signal<Agent[]>([]);
  readonly assignSubmitting = signal(false);
  readonly assignError = signal<string | null>(null);
  readonly assignSuccess = signal<string | null>(null);
  readonly cannedList = signal<CannedResponseItem[]>([]);
  readonly commentSubmitting = signal(false);
  readonly commentError = signal<string | null>(null);
  readonly prioritySubmitting = signal(false);
  readonly priorityMessage = signal<string | null>(null);
  readonly priorityError = signal<string | null>(null);

  readonly canAssign = computed(() => {
    const role = this.auth.user$()?.role;
    return role === UserRole.ADMIN || role === UserRole.SUPERVISOR;
  });

  readonly canEditPriority = computed(() => {
    const role = this.auth.user$()?.role;
    return role === UserRole.ADMIN || role === UserRole.SUPERVISOR || role === UserRole.AGENT;
  });

  readonly assignForm = this.fb.group({
    assignedAgentId: ['', Validators.required],
    note: [''],
  });

  readonly commentForm = this.fb.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly priorityForm = this.fb.group({
    priority: ['MEDIUM' as TicketPriority],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
    }

    const role = this.auth.user$()?.role;
    if (role === UserRole.ADMIN || role === UserRole.SUPERVISOR) {
      this.agentService.searchAgents({ status: 'ACTIVE', limit: 100, page: 1 }).subscribe({
        next: (res) => {
          if (res.data?.items) {
            this.agents.set(res.data.items);
          }
        },
        error: () => {
          /* agents optional for view */
        },
      });
    }

    if (
      role === UserRole.ADMIN ||
      role === UserRole.SUPERVISOR ||
      role === UserRole.AGENT
    ) {
      this.ticketService.listCannedResponses().subscribe({
        next: (list) => this.cannedList.set(list),
        error: () => this.cannedList.set([]),
      });
    }
  }

  onCannedPick(ev: Event): void {
    const sel = ev.target as HTMLSelectElement;
    const raw = sel.value;
    sel.selectedIndex = 0;
    if (raw === '') return;
    const idx = Number(raw);
    const list = this.cannedList();
    const item = Number.isInteger(idx) ? list[idx] : undefined;
    if (item) {
      this.applyCanned(item.body);
    }
  }

  private loadTicket(id: string): void {
    this.ticketService.getById(id).subscribe({
      next: (t) => {
        this.ticket.set(t);
        if (t.assignedAgentId) {
          this.assignForm.patchValue({ assignedAgentId: t.assignedAgentId });
        }
        this.priorityForm.patchValue({ priority: (t.priority || 'MEDIUM') as TicketPriority });
        this.priorityForm.markAsPristine();
      },
      error: (error) => {
        console.error('Error loading ticket:', error);
        this.router.navigate([`${getRoleBasePath(this.auth.user$()?.role)}/tickets`]);
      },
    });
  }

  submitAssign(): void {
    const id = this.ticket()?.id;
    if (!id || this.assignForm.invalid) return;

    this.assignSubmitting.set(true);
    this.assignError.set(null);
    this.assignSuccess.set(null);

    const raw = this.assignForm.getRawValue();
    this.ticketService
      .assign(id, {
        assignedAgentId: raw.assignedAgentId!,
        note: raw.note?.trim() || undefined,
      })
      .subscribe({
        next: (ticket) => {
          this.ticket.set(ticket);
          this.assignSubmitting.set(false);
          this.assignSuccess.set('Ticket assigned successfully.');
        },
        error: (err) => {
          this.assignSubmitting.set(false);
          this.assignError.set(err?.error?.message || 'Failed to assign ticket.');
        },
      });
  }

  goBack(): void {
    this.router.navigate([`${getRoleBasePath(this.auth.user$()?.role)}/tickets`]);
  }

  submitComment(): void {
    const id = this.ticket()?.id;
    const msg = this.commentForm.get('message')?.value?.trim();
    if (!id || !msg) return;

    this.commentSubmitting.set(true);
    this.commentError.set(null);
    this.ticketService.addComment(id, msg).subscribe({
      next: () => {
        this.commentForm.reset();
        this.commentSubmitting.set(false);
        this.loadTicket(id);
      },
      error: (err) => {
        this.commentSubmitting.set(false);
        this.commentError.set(err?.error?.message || 'Could not add comment.');
      },
    });
  }

  applyCanned(body: string): void {
    if (!body) return;
    const cur = this.commentForm.get('message')?.value || '';
    const next = cur ? `${cur.trim()}\n\n${body}` : body;
    this.commentForm.patchValue({ message: next });
  }

  submitPriority(): void {
    const id = this.ticket()?.id;
    const p = this.priorityForm.get('priority')?.value as TicketPriority;
    if (!id || !p) return;

    this.prioritySubmitting.set(true);
    this.priorityMessage.set(null);
    this.priorityError.set(null);
    this.ticketService.update(id, { priority: p }).subscribe({
      next: (t) => {
        this.ticket.set(t);
        this.prioritySubmitting.set(false);
        this.priorityMessage.set('Priority updated.');
        this.priorityForm.markAsPristine();
      },
      error: (err) => {
        this.prioritySubmitting.set(false);
        this.priorityError.set(err?.error?.message || 'Update failed.');
      },
    });
  }

  isSlaOverdue(ticket: Ticket): boolean {
    if (!ticket.slaDueAt || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return false;
    }
    return new Date(ticket.slaDueAt).getTime() < Date.now();
  }

  agentLabel(agent: Agent): string {
    const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ').trim();
    return name ? `${name} (${agent.id})` : agent.id;
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

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
  }
}
