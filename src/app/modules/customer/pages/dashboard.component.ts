import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div
        class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
      >
        <div
          class="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.18),_transparent_34%),linear-gradient(135deg,_#0f172a_0%,_#312e81_48%,_#1d4ed8_100%)] px-6 py-8 text-white sm:px-8"
        >
          <div class="relative max-w-3xl space-y-4">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
              Customer workspace
            </div>

            <div class="space-y-2">
              <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back, {{ user()?.name }}.
              </h1>
              <p class="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Your dashboard keeps the next support steps visible even while other modules are
                still growing around it.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a
                [routerLink]="buildRoute('requests')"
                class="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                View requests
              </a>
              <a
                [routerLink]="buildRoute('profile')"
                class="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open profile
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Open requests</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">3</p>
          <p class="mt-2 text-sm text-slate-500">Waiting for team follow-up</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Resolved this month</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">12</p>
          <p class="mt-2 text-sm text-slate-500">Closed support conversations</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Average response</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">2h 30m</p>
          <p class="mt-2 text-sm text-slate-500">Current service estimate</p>
        </article>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Quick actions
          </p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">Where to go next</h2>

          <div class="mt-6 grid gap-4">
            <a
              [routerLink]="buildRoute('requests')"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              <p class="text-lg font-semibold text-slate-950">My requests</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Keep the route ready for your ticket history, upcoming updates, and open support
                work.
              </p>
            </a>

            <a
              [routerLink]="buildRoute('profile')"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              <p class="text-lg font-semibold text-slate-950">My profile</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Review account details and keep your personal workspace path easy to reach.
              </p>
            </a>

            <a
              [routerLink]="buildRoute('knowledge-base')"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              <p class="text-lg font-semibold text-slate-950">Knowledge base</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Browse the placeholder content area reserved for FAQs and self-service guides.
              </p>
            </a>
          </div>
        </div>

        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">This week</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">Helpful reminders</h2>

          <div class="mt-6 space-y-4">
            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-950">Keep contact data current</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Updated profile details help support agents verify your account faster.
              </p>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-950">Watch for follow-up notifications</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The topbar badge keeps the next status change easy to notice.
              </p>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-950">More modules can land here cleanly</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                The customer-facing shell is already structured so new pages can be added without a
                redesign.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CustomerDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.user$;
  readonly basePath = computed(() => getRoleBasePath(this.user()?.role));

  buildRoute(route: string): string {
    return `${this.basePath()}/${route}`;
  }
}
