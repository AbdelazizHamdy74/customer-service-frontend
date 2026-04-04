import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getRoleBasePath } from '../../core/utils/role-path.util';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div
        class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
      >
        <div
          class="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_38%),linear-gradient(135deg,_#0f172a_0%,_#1e1b4b_50%,_#172554_100%)] px-6 py-8 text-white sm:px-8"
        >
          <div
            class="absolute -right-14 top-6 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl"
          ></div>
          <div
            class="absolute left-0 top-full h-24 w-24 -translate-x-10 -translate-y-1/2 rounded-full bg-indigo-400/20 blur-2xl"
          ></div>

          <div class="relative max-w-3xl space-y-4">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
              Workspace preview
            </div>

            <div class="space-y-2">
              <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">{{ title() }}</h1>
              <p class="max-w-2xl text-sm text-slate-200 sm:text-base">
                {{ description() }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a
                [routerLink]="primaryPath()"
                class="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                {{ primaryLabel() }}
              </a>
              <a
                [routerLink]="dashboardPath()"
                class="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <article
          *ngFor="let item of highlights()"
          class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            {{ item.label }}
          </p>
          <h2 class="mt-3 text-lg font-semibold text-slate-950">{{ item.title }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.description }}</p>
        </article>
      </div>

      <div class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <p class="text-sm font-medium text-slate-700">
          Signed in as {{ user()?.name || 'Workspace user' }}.
        </p>
        <p class="mt-1 text-sm text-slate-500">
          This page is intentionally light for now so the application remains fully navigable while
          we finish the rest of the modules.
        </p>
      </div>
    </section>
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  readonly user = this.authService.user$;
  readonly title = computed(() => this.route.snapshot.data['title'] ?? 'Module in progress');
  readonly description = computed(
    () =>
      this.route.snapshot.data['description'] ??
      'This section is ready for navigation and visual review while the full feature set is being completed.',
  );
  readonly primaryLabel = computed(
    () => this.route.snapshot.data['primaryLabel'] ?? 'Open customer workspace',
  );
  readonly primaryPath = computed(() => {
    const target = this.route.snapshot.data['primaryPath'] ?? 'customers';
    return `${this.basePath()}/${target}`;
  });
  readonly dashboardPath = computed(() => `${this.basePath()}/dashboard`);
  readonly highlights = computed(
    () =>
      this.route.snapshot.data['highlights'] ?? [
        {
          label: 'Ready',
          title: 'Navigation is wired',
          description: 'Routes, shell states, and placeholder surfaces are already connected.',
        },
        {
          label: 'Next',
          title: 'Feature depth comes next',
          description:
            'This card gives the team a stable target to extend without redesigning the flow.',
        },
        {
          label: 'Benefit',
          title: 'Design language stays consistent',
          description: 'The same spacing, cards, and actions carry across modules from day one.',
        },
      ],
  );
  private readonly basePath = computed(() => getRoleBasePath(this.user()?.role));
}
