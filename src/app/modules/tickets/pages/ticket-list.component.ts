import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  Ticket,
  TicketSearchParams,
  TicketSearchResult,
  TicketStatus,
} from '../../../core/models/ticket.model';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Tickets workspace
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">
            Support ticket management
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            View and manage customer support tickets. Filter by status, customer, or agent. Create
            new tickets and track progress.
          </p>
        </div>

        <a
          [routerLink]="['new']"
          queryParamsHandling="preserve"
          class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create ticket
        </a>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        The ticket service is currently falling back to mock workspace data so navigation remains
        usable while the API is unavailable.
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Search filters
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Find tickets quickly</h2>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              (click)="clearFilters()"
              class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Reset filters
            </button>
            <button
              type="submit"
              form="ticket-search-form"
              class="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Search tickets
            </button>
          </div>
        </div>

        <form
          id="ticket-search-form"
          [formGroup]="searchForm"
          (ngSubmit)="applyFilters()"
          class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <label class="space-y-2 xl:col-span-2">
            <span class="text-sm font-medium text-slate-700">Global search</span>
            <input
              formControlName="q"
              type="text"
              placeholder="Subject, description, or customer"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select
              formControlName="status"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_CUSTOMER">Waiting Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Customer ID</span>
            <input
              formControlName="customerId"
              type="text"
              placeholder="Customer ID"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Agent ID</span>
            <input
              formControlName="assignedAgentId"
              type="text"
              placeholder="Assigned agent ID"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>
        </form>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-slate-950">Tickets ({{ totalCount() }})</h2>
            <div class="flex items-center gap-2 text-sm text-slate-600">
              <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full table-auto">
              <thead>
                <tr class="border-b border-slate-200">
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Subject</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Customer</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Status</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">
                    Assigned Agent
                  </th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Created</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-950">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr *ngFor="let ticket of tickets()" class="hover:bg-slate-50 transition">
                  <td class="px-4 py-4">
                    <div class="space-y-1">
                      <p class="text-sm font-medium text-slate-950">{{ ticket.subject }}</p>
                      <p class="text-xs text-slate-600 line-clamp-2">{{ ticket.description }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm text-slate-700">{{ ticket.customerId }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      [ngClass]="getStatusBadgeClasses(ticket.status)"
                    >
                      {{ getStatusLabel(ticket.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm text-slate-700">{{
                      ticket.assignedAgentId || 'Unassigned'
                    }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-sm text-slate-700">{{ formatDate(ticket.createdAt) }}</span>
                  </td>
                  <td class="px-4 py-4">
                    <a
                      [routerLink]="[ticket.id]"
                      class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="tickets().length === 0" class="text-center py-12">
            <p class="text-slate-500">No tickets found matching your criteria.</p>
          </div>

          <div *ngIf="totalPages() > 1" class="flex items-center justify-between">
            <button
              type="button"
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-600">
                Showing {{ (currentPage() - 1) * pageSize() + 1 }} to
                {{ Math.min(currentPage() * pageSize(), totalCount()) }} of {{ totalCount() }}
              </span>
            </div>

            <button
              type="button"
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TicketListComponent {
  private readonly ticketService = inject(TicketService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  Math = Math;

  readonly searchForm = this.formBuilder.group({
    q: [''],
    subject: [''],
    customerId: [''],
    assignedAgentId: [''],
    status: [''],
  });

  readonly tickets = signal<Ticket[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);

  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(),
        map((params) => this.paramsToSearchParams(params)),
        switchMap((params) => {
          this.loading.set(true);
          return this.ticketService.search(params).pipe(finalize(() => this.loading.set(false)));
        }),
      )
      .subscribe((result) => {
        this.tickets.set(result.tickets);
        this.currentPage.set(result.pagination.page);
        this.pageSize.set(result.pagination.limit);
        this.totalCount.set(result.pagination.total);
        this.totalPages.set(result.pagination.totalPages);
      });
  }

  usingMock() {
    return this.ticketService.usingMock();
  }

  applyFilters(): void {
    const params = this.searchForm.value as TicketSearchParams;
    params.page = 1; // Reset to first page when applying filters

    this.updateQueryParams(params);
  }

  clearFilters(): void {
    this.searchForm.reset();
    this.updateQueryParams({});
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    const params = this.searchForm.value as TicketSearchParams;
    params.page = page;

    this.updateQueryParams(params);
  }

  getStatusBadgeClasses(status: TicketStatus): string {
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

  getStatusLabel(status: TicketStatus): string {
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
    return new Date(dateString).toLocaleDateString();
  }

  private paramsToSearchParams(params: ParamMap): TicketSearchParams {
    return {
      q: params.get('q') || undefined,
      subject: params.get('subject') || undefined,
      customerId: params.get('customerId') || undefined,
      assignedAgentId: params.get('assignedAgentId') || undefined,
      status: (params.get('status') as TicketStatus) || undefined,
      page: parseInt(params.get('page') || '1', 10),
      limit: parseInt(params.get('limit') || '10', 10),
    };
  }

  private updateQueryParams(params: TicketSearchParams): void {
    const queryParams: any = {};

    if (params.q) queryParams.q = params.q;
    if (params.subject) queryParams.subject = params.subject;
    if (params.customerId) queryParams.customerId = params.customerId;
    if (params.assignedAgentId) queryParams.assignedAgentId = params.assignedAgentId;
    if (params.status) queryParams.status = params.status;
    if (params.page && params.page > 1) queryParams.page = params.page;
    if (params.limit && params.limit !== 10) queryParams.limit = params.limit;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
