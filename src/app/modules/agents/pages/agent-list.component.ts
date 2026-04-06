import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  Agent,
  AgentRole,
  AgentSearchParams,
  AgentSearchResult,
} from '../../../core/models/agent.model';
import { AgentService } from '../../../core/services/agent.service';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Agents workspace
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">
            Invite, assign, and coach from one place
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Search by name, role, status, team, or skill. The results stay compact and action-led,
            so staffing work feels fast without dropping into a heavy operations table.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            [routerLink]="['invite']"
            queryParamsHandling="preserve"
            class="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Invite agent
          </a>
          <a
            [routerLink]="['new']"
            queryParamsHandling="preserve"
            class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create agent
          </a>
        </div>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        The agents workspace is using mock staffing data right now so invite, edit, and performance
        flows remain usable while the backend is unavailable.
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Search filters
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Find the right teammate fast</h2>
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
              form="agent-search-form"
              class="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Search agents
            </button>
          </div>
        </div>

        <form
          id="agent-search-form"
          [formGroup]="searchForm"
          (ngSubmit)="applyFilters()"
          class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <label class="space-y-2 xl:col-span-2">
            <span class="text-sm font-medium text-slate-700">Global search</span>
            <input
              formControlName="q"
              type="text"
              placeholder="Name, email, phone, team, or skill"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Role</span>
            <select
              formControlName="role"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="AGENT">Agent</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Status</span>
            <select
              formControlName="status"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Team</span>
            <input
              formControlName="team"
              type="text"
              placeholder="Billing, retention..."
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2 md:col-span-2 xl:col-span-2">
            <span class="text-sm font-medium text-slate-700">Skill</span>
            <input
              formControlName="skill"
              type="text"
              placeholder="Escalations, onboarding, QA..."
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>
        </form>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Visible results</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ agents().length }}
          </p>
          <p class="mt-2 text-sm text-slate-500">Agents on the current page</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Active coverage</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ activeCount() }}
          </p>
          <p class="mt-2 text-sm text-slate-500">Currently active team members</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Leadership</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ leadershipCount() }}
          </p>
          <p class="mt-2 text-sm text-slate-500">Admins and supervisors in the result set</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Avg. CSAT</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ averageSatisfaction() | number: '1.1-1' }}
          </p>
          <p class="mt-2 text-sm text-slate-500 uppercase">{{ result()?.source || 'api' }}</p>
        </article>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Results</h2>
            <p class="mt-1 text-sm text-slate-500">
              Page {{ pagination().page }} of {{ pagination().pages }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
            >
              {{ activeCount() }} active
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
            >
              {{ pagination().total }} matched
            </span>
          </div>
        </div>

        <div
          *ngIf="error()"
          class="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          {{ error() }}
        </div>

        <div *ngIf="isLoading()" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            *ngFor="let placeholder of [1, 2, 3, 4, 5, 6]"
            class="h-60 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
          ></div>
        </div>

        <ng-container *ngIf="!isLoading()">
          <div
            *ngIf="!agents().length"
            class="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          >
            <h3 class="text-lg font-semibold text-slate-950">No agents matched these filters</h3>
            <p class="mt-2 text-sm text-slate-500">
              Broaden the search or start a new staffing action with invite or direct create.
            </p>
            <div class="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                (click)="clearFilters()"
                class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                Clear filters
              </button>
              <a
                [routerLink]="['invite']"
                queryParamsHandling="preserve"
                class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Invite agent
              </a>
            </div>
          </div>

          <div *ngIf="agents().length" class="mt-6 space-y-4">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article
                *ngFor="let agent of agents(); trackBy: trackByAgent"
                class="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
              >
                <div
                  class="bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_38%),linear-gradient(135deg,_#0f172a_0%,_#312e81_55%,_#1d4ed8_100%)] px-5 py-5 text-white"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <a
                        [routerLink]="[agent.id]"
                        queryParamsHandling="preserve"
                        class="text-lg font-semibold transition hover:text-cyan-200"
                      >
                        {{ agent.fullName }}
                      </a>
                      <p class="mt-1 text-sm text-slate-200">
                        {{ agent.team || 'Unassigned team' }}
                      </p>
                    </div>

                    <span
                      class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100"
                    >
                      {{ roleLabel(agent.role) }}
                    </span>
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <span
                      class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      [ngClass]="statusClasses(agent.status)"
                    >
                      {{ agent.status }}
                    </span>
                    <span
                      class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200"
                    >
                      {{ agent.source }}
                    </span>
                  </div>
                </div>

                <div class="space-y-5 p-5">
                  <div class="space-y-2 text-sm text-slate-600">
                    <p>{{ agent.email || 'No email provided yet' }}</p>
                    <p>{{ agent.phone }}</p>
                    <p>
                      Last active
                      {{
                        agent.performance.lastActiveAt
                          ? (agent.performance.lastActiveAt | date: 'medium')
                          : 'not tracked yet'
                      }}
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-3xl border border-slate-200 bg-white p-3">
                      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Resolved
                      </p>
                      <p class="mt-2 text-xl font-semibold text-slate-950">
                        {{ agent.performance.ticketsResolved }}
                      </p>
                    </div>
                    <div class="rounded-3xl border border-slate-200 bg-white p-3">
                      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        CSAT
                      </p>
                      <p class="mt-2 text-xl font-semibold text-slate-950">
                        {{ agent.performance.customerSatisfaction | number: '1.1-1' }}
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2" *ngIf="agent.skills.length">
                    <span
                      *ngFor="let skill of agent.skills.slice(0, 3)"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {{ skill }}
                    </span>
                    <span
                      *ngIf="agent.skills.length > 3"
                      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      +{{ agent.skills.length - 3 }} more
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-3">
                    <a
                      [routerLink]="[agent.id]"
                      queryParamsHandling="preserve"
                      class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Details
                    </a>
                    <a
                      [routerLink]="[agent.id, 'edit']"
                      queryParamsHandling="preserve"
                      class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              </article>
            </div>

            <div
              class="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-sm text-slate-500">
                Showing {{ firstItemIndex() }} - {{ lastItemIndex() }} of {{ pagination().total }}
                matched agents
              </p>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  (click)="goToPage(pagination().page - 1)"
                  [disabled]="pagination().page <= 1"
                  class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  (click)="goToPage(pagination().page + 1)"
                  [disabled]="pagination().page >= pagination().pages"
                  class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </section>
  `,
})
export class AgentListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly agentService = inject(AgentService);

  readonly searchForm = this.formBuilder.nonNullable.group({
    q: '',
    role: '',
    status: '',
    team: '',
    skill: '',
  });
  readonly result = signal<AgentSearchResult | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly usingMock = this.agentService.usingMock$;
  readonly agents = computed(() => this.result()?.items ?? []);
  readonly pagination = computed(
    () =>
      this.result()?.pagination ?? {
        page: 1,
        limit: 9,
        total: 0,
        pages: 1,
      },
  );
  readonly activeCount = computed(
    () => this.agents().filter((agent) => agent.status === 'ACTIVE').length,
  );
  readonly leadershipCount = computed(
    () => this.agents().filter((agent) => agent.role !== 'AGENT').length,
  );
  readonly averageSatisfaction = computed(() => {
    if (!this.agents().length) {
      return 0;
    }

    const total = this.agents().reduce(
      (sum, agent) => sum + agent.performance.customerSatisfaction,
      0,
    );
    return total / this.agents().length;
  });
  readonly firstItemIndex = computed(() =>
    this.pagination().total ? (this.pagination().page - 1) * this.pagination().limit + 1 : 0,
  );
  readonly lastItemIndex = computed(() =>
    Math.min(this.pagination().page * this.pagination().limit, this.pagination().total),
  );

  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(),
        map((params) => this.readSearchParams(params)),
        tap((params) => {
          this.searchForm.patchValue(
            {
              q: params.q ?? '',
              role: params.role ?? '',
              status: params.status ?? '',
              team: params.team ?? '',
              skill: params.skill ?? '',
            },
            { emitEvent: false },
          );
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap((params) =>
          this.agentService.searchAgents(params).pipe(
            catchError((error) => {
              this.result.set(null);
              this.error.set(this.getErrorMessage(error));
              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.result.set(response.data);
        }
      });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(1),
    });
  }

  clearFilters(): void {
    this.searchForm.setValue({
      q: '',
      role: '',
      status: '',
      team: '',
      skill: '',
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination().pages) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(page),
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
      ? 'bg-emerald-400/15 text-emerald-50'
      : 'bg-slate-100/15 text-slate-100';
  }

  trackByAgent(_: number, agent: Agent): string {
    return agent.id;
  }

  private buildQueryParams(page: number): Record<string, string | number> {
    const value = this.searchForm.getRawValue();

    return Object.entries({
      q: value.q.trim(),
      role: value.role.trim(),
      status: value.status.trim(),
      team: value.team.trim(),
      skill: value.skill.trim(),
      page,
      limit: 9,
    }).reduce(
      (accumulator, [key, current]) => {
        if (current !== '') {
          accumulator[key] = current;
        }
        return accumulator;
      },
      {} as Record<string, string | number>,
    );
  }

  private readSearchParams(params: ParamMap): AgentSearchParams {
    const role = params.get('role');
    const status = params.get('status');

    return {
      q: params.get('q') ?? '',
      role: role === 'ADMIN' || role === 'SUPERVISOR' || role === 'AGENT' ? role : '',
      status: status === 'ACTIVE' || status === 'INACTIVE' ? status : '',
      team: params.get('team') ?? '',
      skill: params.get('skill') ?? '',
      page: Math.max(1, Number(params.get('page') ?? 1) || 1),
      limit: Math.max(1, Number(params.get('limit') ?? 9) || 9),
    };
  }

  private getErrorMessage(error: unknown): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      'Unable to load agents right now.'
    );
  }
}
