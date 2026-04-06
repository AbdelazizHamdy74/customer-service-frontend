import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  Agent,
  AgentPerformanceReport,
  AgentPerformanceReportItem,
  AgentRole,
} from '../../../core/models/agent.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

@Component({
  selector: 'app-agent-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <a
            [routerLink]="agentsPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            Back to agents
          </a>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">Agent details</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Review profile data, update role assignment, and check performance without leaving the
            staffing flow.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            [routerLink]="agentsPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Directory
          </a>
          <a
            *ngIf="agent()"
            [routerLink]="editPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit agent
          </a>
        </div>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        Agent details and performance are currently being served from mock staffing data.
      </div>

      <div
        *ngIf="error()"
        class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        {{ error() }}
      </div>

      <div *ngIf="isLoading()" class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div class="h-80 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
        <div class="space-y-6">
          <div class="h-52 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
          <div class="h-52 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
        </div>
      </div>

      <ng-container *ngIf="!isLoading() && agent() as currentAgent">
        <div
          class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
        >
          <div
            class="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(135deg,_#0f172a_0%,_#312e81_48%,_#1d4ed8_100%)] px-6 py-8 text-white sm:px-8"
          >
            <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                  Agent profile
                </p>
                <h2 class="mt-3 text-3xl font-semibold tracking-tight">
                  {{ currentAgent.fullName }}
                </h2>
                <p class="mt-2 max-w-2xl text-sm text-slate-200">
                  {{ currentAgent.email || 'Email not added yet' }}
                  <span class="mx-2 text-slate-400">&bull;</span>
                  {{ currentAgent.phone }}
                </p>
              </div>

              <div class="flex flex-wrap gap-3">
                <span
                  class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100"
                >
                  {{ roleLabel(currentAgent.role) }}
                </span>
                <span
                  class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
                  [ngClass]="statusClasses(currentAgent.status)"
                >
                  {{ currentAgent.status }}
                </span>
                <span
                  class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200"
                >
                  {{ currentAgent.source }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid gap-6 p-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div class="space-y-6">
              <article class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                      Coverage
                    </p>
                    <h3 class="mt-2 text-xl font-semibold text-slate-950">Team and contact</h3>
                  </div>
                  <p class="text-sm text-slate-500">
                    {{ currentAgent.team || 'No team assigned yet' }}
                  </p>
                </div>

                <div class="mt-6 grid gap-4 sm:grid-cols-2">
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Email</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.email || 'Not provided' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Phone</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.phone }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Role</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ roleLabel(currentAgent.role) }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Status</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.status }}
                    </p>
                  </div>
                </div>

                <div class="mt-6">
                  <p class="text-sm font-medium text-slate-500">Skills</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      *ngFor="let skill of currentAgent.skills"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {{ skill }}
                    </span>
                    <span
                      *ngIf="!currentAgent.skills.length"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"
                    >
                      No skills listed yet
                    </span>
                  </div>
                </div>
              </article>

              <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Performance
                </p>
                <div
                  class="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 class="text-xl font-semibold text-slate-950">Delivery view</h3>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ performancePeriodLabel() }}
                    </p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      *ngFor="let days of [7, 30, 90]"
                      type="button"
                      (click)="selectPerformanceWindow(days)"
                      class="rounded-full px-4 py-2 text-sm font-semibold transition"
                      [ngClass]="
                        selectedWindowDays() === days
                          ? 'bg-slate-950 text-white'
                          : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                      "
                    >
                      {{ days }} days
                    </button>
                  </div>
                </div>

                <div
                  *ngIf="performanceError()"
                  class="mt-5 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {{ performanceError() }}
                </div>

                <div
                  *ngIf="isPerformanceLoading()"
                  class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                >
                  <div
                    *ngFor="let placeholder of [1, 2, 3, 4]"
                    class="h-28 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                  ></div>
                </div>

                <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Assigned</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">
                      {{
                        performanceItem()?.ticketsAssigned ??
                          currentAgent.performance.ticketsHandled
                      }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Closed</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">
                      {{
                        performanceItem()?.ticketsClosed ?? currentAgent.performance.ticketsResolved
                      }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Open now</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">
                      {{ performanceItem()?.currentOpenTickets ?? 0 }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Resolution rate</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-950">
                      {{
                        performanceItem()?.resolutionRate ??
                          currentAgent.performance.resolutionRate ??
                          0
                      }}%
                    </p>
                  </div>
                </div>

                <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Avg. response</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentAgent.performance.avgResponseTimeMinutes }} min
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Avg. resolution</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{
                        performanceItem()?.averageResolutionTimeMinutes ??
                          currentAgent.performance.avgResolutionTimeMinutes
                      }}
                      min
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Customer satisfaction</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentAgent.performance.customerSatisfaction | number: '1.1-1' }}/5
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Last active</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{
                        currentAgent.performance.lastActiveAt
                          ? (currentAgent.performance.lastActiveAt | date: 'short')
                          : 'Not tracked'
                      }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div class="space-y-6">
              <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Assign role
                </p>
                <h3 class="mt-2 text-xl font-semibold text-slate-950">Change access level</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Use this action when coverage changes or a teammate moves into supervision.
                </p>

                <div
                  *ngIf="assignRoleError()"
                  class="mt-5 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {{ assignRoleError() }}
                </div>

                <form [formGroup]="roleForm" (ngSubmit)="assignRole()" class="mt-5 space-y-4">
                  <label class="space-y-2">
                    <span class="text-sm font-medium text-slate-700">Role</span>
                    <select
                      formControlName="role"
                      class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="AGENT">Agent</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    [disabled]="isAssigningRole()"
                    class="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {{ isAssigningRole() ? 'Updating role...' : 'Assign role' }}
                  </button>
                </form>
              </article>

              <article class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Lifecycle
                </p>
                <div class="mt-5 space-y-4">
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Created</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.createdAt | date: 'medium' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Updated</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.updatedAt || currentAgent.createdAt | date: 'medium' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Provisioned user</p>
                    <p class="mt-2 break-all text-base font-semibold text-slate-950">
                      {{ currentAgent.authUserId || 'Not linked yet' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-white p-4">
                    <p class="text-sm font-medium text-slate-500">Created by</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentAgent.createdBy || 'System workspace' }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </ng-container>
    </section>
  `,
})
export class AgentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly agentService = inject(AgentService);

  readonly queryParams = this.route.snapshot.queryParams;
  readonly roleForm = this.formBuilder.nonNullable.group({
    role: 'AGENT' as AgentRole,
  });
  readonly agent = signal<Agent | null>(null);
  readonly performanceReport = signal<AgentPerformanceReport | null>(null);
  readonly isLoading = signal(true);
  readonly isPerformanceLoading = signal(true);
  readonly isAssigningRole = signal(false);
  readonly error = signal<string | null>(null);
  readonly performanceError = signal<string | null>(null);
  readonly assignRoleError = signal<string | null>(null);
  readonly selectedWindowDays = signal(30);
  readonly usingMock = this.agentService.usingMock$;
  readonly user = this.authService.user$;
  readonly basePath = computed(() => getRoleBasePath(this.user()?.role));
  readonly agentsPath = computed(() => `${this.basePath()}/agents`);
  readonly editPath = computed(() => {
    const agent = this.agent();
    return agent ? `${this.basePath()}/agents/${agent.id}/edit` : this.agentsPath();
  });
  readonly performanceItem = computed<AgentPerformanceReportItem | null>(() => {
    const report = this.performanceReport();
    const agent = this.agent();

    if (!report?.items?.length || !agent) {
      return report?.items?.[0] ?? null;
    }

    return report.items.find((item) => item.agentId === agent.id) ?? report.items[0] ?? null;
  });
  readonly performancePeriodLabel = computed(() => {
    const report = this.performanceReport();
    if (!report) {
      return `Last ${this.selectedWindowDays()} days`;
    }

    return `${report.period.startDate} to ${report.period.endDate}`;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map((params) => params.get('id') ?? ''),
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
          this.performanceReport.set(null);
          this.performanceError.set(null);
        }),
        switchMap((id) =>
          this.agentService.getAgent(id).pipe(
            catchError((error) => {
              this.agent.set(null);
              this.error.set(this.getErrorMessage(error, 'Unable to load this agent right now.'));
              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.agent.set(response.data);
          this.roleForm.patchValue({ role: response.data.role });
          this.loadPerformance(response.data.id);
        }
      });
  }

  selectPerformanceWindow(days: number): void {
    if (this.selectedWindowDays() === days) {
      return;
    }

    this.selectedWindowDays.set(days);
    const agentId = this.agent()?.id;
    if (agentId) {
      this.loadPerformance(agentId);
    }
  }

  assignRole(): void {
    const agentId = this.agent()?.id;
    if (!agentId || this.roleForm.invalid) {
      return;
    }

    this.isAssigningRole.set(true);
    this.assignRoleError.set(null);

    this.agentService
      .assignRole(agentId, this.roleForm.getRawValue().role)
      .pipe(
        catchError((error) => {
          this.assignRoleError.set(
            this.getErrorMessage(error, 'Unable to update this role right now.'),
          );
          return of(null);
        }),
        finalize(() => this.isAssigningRole.set(false)),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.agent.set(response.data);
          this.roleForm.patchValue({ role: response.data.role });
        }
      });
  }

  roleLabel(role: AgentRole): string {
    return (
      {
        ADMIN: 'Admin',
        SUPERVISOR: 'Supervisor',
        AGENT: 'Agent',
      }[role] ?? 'Agent'
    );
  }

  statusClasses(status: Agent['status']): string {
    return status === 'ACTIVE'
      ? 'bg-emerald-400/15 text-emerald-100'
      : 'bg-slate-100/15 text-slate-100';
  }

  private loadPerformance(agentId: string): void {
    this.isPerformanceLoading.set(true);
    this.performanceError.set(null);

    const { startDate, endDate } = this.buildDateRange(this.selectedWindowDays());

    this.agentService
      .getAgentPerformanceReport({ agentId, startDate, endDate })
      .pipe(
        catchError((error) => {
          this.performanceReport.set(null);
          this.performanceError.set(
            this.getErrorMessage(error, 'Unable to load performance right now.'),
          );
          return of(null);
        }),
        finalize(() => this.isPerformanceLoading.set(false)),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.performanceReport.set(response.data);
        }
      });
  }

  private buildDateRange(days: number): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      fallback
    );
  }
}
