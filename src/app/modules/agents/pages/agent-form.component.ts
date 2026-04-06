import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, of } from 'rxjs';
import {
  Agent,
  AgentInvitePayload,
  AgentInviteResult,
  AgentRole,
  AgentUpsertPayload,
} from '../../../core/models/agent.model';
import { AgentService } from '../../../core/services/agent.service';
import { AuthService } from '../../../core/services/auth.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

type AgentFormMode = 'invite' | 'create' | 'edit';

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <a
            [routerLink]="cancelPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            {{ isEditMode() ? 'Back to details' : 'Back to agents' }}
          </a>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">{{ pageTitle() }}</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            {{ pageDescription() }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            [routerLink]="cancelPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Cancel
          </a>
          <button
            type="submit"
            form="agent-form"
            [disabled]="isSaving()"
            class="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ submitLabel() }}
          </button>
        </div>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        Agent form actions are using mock persistence right now so the workflow stays testable even
        if the live services are offline.
      </div>

      <div
        *ngIf="inviteResult()"
        class="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
          Invite sent
        </p>
        <h2 class="mt-2 text-2xl font-semibold text-slate-950">The agent invitation is ready</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          The auth user has been created and the onboarding link is active until the expiry time
          below.
        </p>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <div class="rounded-3xl border border-emerald-200 bg-white p-4">
            <p class="text-sm font-medium text-slate-500">Auth user</p>
            <p class="mt-2 break-all text-base font-semibold text-slate-950">
              {{ inviteResult()?.userId }}
            </p>
          </div>
          <div class="rounded-3xl border border-emerald-200 bg-white p-4">
            <p class="text-sm font-medium text-slate-500">Invite token</p>
            <p class="mt-2 break-all text-base font-semibold text-slate-950">
              {{ inviteResult()?.inviteToken }}
            </p>
          </div>
          <div class="rounded-3xl border border-emerald-200 bg-white p-4">
            <p class="text-sm font-medium text-slate-500">Expires</p>
            <p class="mt-2 text-base font-semibold text-slate-950">
              {{ inviteResult()?.inviteTokenExpiresAt | date: 'medium' }}
            </p>
          </div>
        </div>
      </div>

      <div
        *ngIf="error()"
        class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        {{ error() }}
      </div>

      <div *ngIf="isLoading()" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div
          class="h-[34rem] animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
        ></div>
        <div class="space-y-6">
          <div class="h-56 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
          <div class="h-48 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
        </div>
      </div>

      <form
        *ngIf="!isLoading()"
        id="agent-form"
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div class="space-y-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Identity
              </p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950">Core agent details</h2>
            </div>

            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">First name</span>
                <input
                  formControlName="firstName"
                  type="text"
                  placeholder="First name"
                  class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition"
                  [ngClass]="inputClasses('firstName')"
                />
                <p *ngIf="isInvalid('firstName')" class="text-sm text-red-600">
                  First name must be at least 2 characters.
                </p>
              </label>

              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Last name</span>
                <input
                  formControlName="lastName"
                  type="text"
                  placeholder="Last name"
                  class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition"
                  [ngClass]="inputClasses('lastName')"
                />
                <p *ngIf="isInvalid('lastName')" class="text-sm text-red-600">
                  Last name must be at least 2 characters.
                </p>
              </label>

              <label class="space-y-2 sm:col-span-2">
                <span class="text-sm font-medium text-slate-700">
                  Email {{ isInviteMode() ? '(required)' : '(optional)' }}
                </span>
                <input
                  formControlName="email"
                  type="email"
                  placeholder="agent@example.com"
                  class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition"
                  [ngClass]="inputClasses('email')"
                />
                <p *ngIf="isInvalid('email')" class="text-sm text-red-600">
                  {{
                    isInviteMode()
                      ? 'Email is required and must be valid.'
                      : 'Enter a valid email address.'
                  }}
                </p>
              </label>

              <label class="space-y-2 sm:col-span-2">
                <span class="text-sm font-medium text-slate-700">Phone</span>
                <input
                  formControlName="phone"
                  type="text"
                  placeholder="+20..."
                  class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition"
                  [ngClass]="inputClasses('phone')"
                />
                <p *ngIf="isInvalid('phone')" class="text-sm text-red-600">
                  Phone must be at least 6 characters.
                </p>
              </label>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Skills
              </p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950">Coverage and strengths</h2>
            </div>

            <div class="mt-6 space-y-2">
              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Skills</span>
                <textarea
                  formControlName="skills"
                  rows="4"
                  placeholder="Escalations, billing, onboarding..."
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                ></textarea>
              </label>
              <p class="text-sm text-slate-500">
                Separate skills with commas so the directory search can match them later.
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Access
              </p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950">Role and coverage setup</h2>
            </div>

            <div class="mt-6 grid gap-4">
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

              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Status</span>
                <select
                  formControlName="status"
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>

              <label class="space-y-2">
                <span class="text-sm font-medium text-slate-700">Team</span>
                <input
                  formControlName="team"
                  type="text"
                  placeholder="Billing, onboarding..."
                  class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </label>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Form mode
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ modeHeading() }}</h2>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ modeHint() }}
            </p>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Notes</p>
            <div class="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <p>Use invite when the teammate still needs account activation and password setup.</p>
              <p>Create is useful for direct provisioning or data seeding inside operations.</p>
              <p>Edit keeps role, team, and skills aligned with what the directory exposes.</p>
            </div>
          </div>
        </div>
      </form>
    </section>
  `,
})
export class AgentFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly agentService = inject(AgentService);

  readonly queryParams = this.route.snapshot.queryParams;
  readonly mode = signal<AgentFormMode>('create');
  readonly agentId = signal<string | null>(null);
  readonly user = this.authService.user$;
  readonly basePath = computed(() => getRoleBasePath(this.user()?.role));
  readonly isInviteMode = computed(() => this.mode() === 'invite');
  readonly isEditMode = computed(() => this.mode() === 'edit' && !!this.agentId());
  readonly pageTitle = computed(() => {
    if (this.isEditMode()) {
      return 'Edit agent profile';
    }

    return this.isInviteMode() ? 'Invite a new agent' : 'Create agent profile';
  });
  readonly pageDescription = computed(() => {
    if (this.isEditMode()) {
      return 'Update this teammate profile while keeping role, team, and performance context aligned.';
    }

    return this.isInviteMode()
      ? 'Send an onboarding invite that provisions both the auth user and the agent record.'
      : 'Create an agent record directly for operational setup or seeded workspace data.';
  });
  readonly submitLabel = computed(() => {
    if (this.isSaving()) {
      return this.isInviteMode()
        ? 'Sending invite...'
        : this.isEditMode()
          ? 'Saving...'
          : 'Creating...';
    }

    return this.isInviteMode()
      ? 'Send invite'
      : this.isEditMode()
        ? 'Save changes'
        : 'Create agent';
  });
  readonly modeHeading = computed(() =>
    this.isEditMode()
      ? 'You are updating an existing teammate.'
      : this.isInviteMode()
        ? 'You are provisioning access through the invite flow.'
        : 'You are creating an agent directly in the workspace.',
  );
  readonly modeHint = computed(() =>
    this.isInviteMode()
      ? 'This uses the auth invite endpoint, which creates the user account first and then provisions the agent through the existing event flow.'
      : this.isEditMode()
        ? 'Keep names readable, teams consistent, and skills specific enough for managers to search quickly.'
        : 'Direct create skips password setup and writes the agent record immediately using the user-service endpoint.',
  );
  readonly cancelPath = computed(() => {
    const agentId = this.agentId();
    return this.isEditMode() && agentId
      ? `${this.basePath()}/agents/${agentId}`
      : `${this.basePath()}/agents`;
  });
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly inviteResult = signal<AgentInviteResult | null>(null);
  readonly usingMock = this.agentService.usingMock$;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', Validators.email],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    role: 'AGENT' as AgentRole,
    status: 'ACTIVE' as Agent['status'],
    team: '',
    skills: '',
  });

  constructor() {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([data, params]) => {
        const mode = data['mode'] === 'invite' ? 'invite' : params.get('id') ? 'edit' : 'create';
        const latestId = params.get('id');

        this.mode.set(mode);
        this.agentId.set(latestId);
        this.inviteResult.set(null);
        this.error.set(null);
        this.syncEmailValidators();

        if (latestId) {
          this.loadAgent(latestId);
          return;
        }

        this.isLoading.set(false);
        this.resetForm();
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    if (this.isInviteMode()) {
      this.submitInvite();
      return;
    }

    const payload = this.buildPayload();
    const agentId = this.agentId();
    const request$ = agentId
      ? this.agentService.updateAgent(agentId, payload)
      : this.agentService.createAgent(payload);

    request$
      .pipe(
        catchError((error) => {
          this.error.set(this.getErrorMessage(error, 'Unable to save this agent right now.'));
          return of(null);
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe((response) => {
        const savedAgentId = response?.data?.id ?? agentId;
        if (!savedAgentId) {
          return;
        }

        this.router.navigateByUrl(this.buildUrl(`${this.basePath()}/agents/${savedAgentId}`));
      });
  }

  isInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  inputClasses(path: string): string {
    return this.isInvalid(path)
      ? 'border-red-300 bg-red-50 focus:border-red-500'
      : 'border-slate-300 bg-slate-50 focus:border-indigo-500 focus:bg-white';
  }

  private submitInvite(): void {
    const email = this.form.getRawValue().email.trim();
    const payload: AgentInvitePayload = {
      ...this.buildPayload(),
      email,
    };

    this.agentService
      .inviteAgent(payload)
      .pipe(
        catchError((error) => {
          this.error.set(this.getErrorMessage(error, 'Unable to send this invite right now.'));
          return of(null);
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.inviteResult.set(response.data);
        }
      });
  }

  private loadAgent(agentId: string): void {
    this.isLoading.set(true);

    this.agentService
      .getAgent(agentId)
      .pipe(
        catchError((error) => {
          this.error.set(this.getErrorMessage(error, 'Unable to load this agent right now.'));
          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.patchAgent(response.data);
        }
      });
  }

  private patchAgent(agent: Agent): void {
    this.form.patchValue({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone,
      role: agent.role,
      status: agent.status,
      team: agent.team,
      skills: agent.skills.join(', '),
    });
  }

  private buildPayload(): AgentUpsertPayload {
    const value = this.form.getRawValue();

    return {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email.trim() || undefined,
      phone: value.phone,
      role: value.role,
      status: value.status,
      team: value.team,
      skills: value.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };
  }

  private syncEmailValidators(): void {
    const emailControl = this.form.controls.email;

    emailControl.setValidators(
      this.isInviteMode() ? [Validators.required, Validators.email] : [Validators.email],
    );
    emailControl.updateValueAndValidity({ emitEvent: false });
  }

  private resetForm(): void {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'AGENT',
      status: 'ACTIVE',
      team: '',
      skills: '',
    });
  }

  private buildUrl(path: string): string {
    const searchParams = new URLSearchParams();

    Object.entries(this.queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, `${value}`);
      }
    });

    const query = searchParams.toString();
    return query ? `${path}?${query}` : path;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      fallback
    );
  }
}
