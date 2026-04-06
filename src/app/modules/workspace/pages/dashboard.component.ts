import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

interface DashboardCard {
  label: string;
  value: string;
  hint: string;
  trend: string;
  accent: string;
}

interface QuickAction {
  title: string;
  description: string;
  route: string;
  badge: string;
  accent: string;
}

interface ActivityItem {
  title: string;
  description: string;
  time: string;
}

interface DashboardPreset {
  eyebrow: string;
  title: string;
  description: string;
  cards: DashboardCard[];
  quickActions: QuickAction[];
  activity: ActivityItem[];
  focusList: string[];
}

const STAFF_DASHBOARDS: Record<string, DashboardPreset> = {
  ADMIN: {
    eyebrow: 'Command center',
    title: 'Operational visibility across every frontline workflow.',
    description:
      'Keep an eye on service load, customer activity, and what the team should tackle next without leaving the dashboard.',
    cards: [
      {
        label: 'Customers in workspace',
        value: '1,284',
        hint: 'Across all service channels',
        trend: '+9.2% vs last week',
        accent: 'border-indigo-200 bg-indigo-50/70',
      },
      {
        label: 'Open tickets',
        value: '148',
        hint: 'Awaiting action',
        trend: '12 high priority',
        accent: 'border-sky-200 bg-sky-50/70',
      },
      {
        label: 'SLA health',
        value: '94%',
        hint: 'Responses inside target',
        trend: '+3 points',
        accent: 'border-emerald-200 bg-emerald-50/70',
      },
      {
        label: 'Escalations today',
        value: '17',
        hint: 'Supervisor review needed',
        trend: '-4 since yesterday',
        accent: 'border-amber-200 bg-amber-50/70',
      },
    ],
    quickActions: [
      {
        title: 'Search customers',
        description: 'Jump straight into the search-first customer workspace.',
        route: 'customers',
        badge: 'Priority',
        accent: 'from-indigo-600 to-sky-600',
      },
      {
        title: 'Invite agent',
        description: 'Provision a new teammate and keep onboarding inside the operations shell.',
        route: 'agents/invite',
        badge: 'Fast path',
        accent: 'from-emerald-600 to-teal-600',
      },
      {
        title: 'Open agents',
        description: 'Review staffing, roles, and performance without leaving the dashboard.',
        route: 'agents',
        badge: 'Live',
        accent: 'from-slate-700 to-slate-900',
      },
    ],
    activity: [
      {
        title: 'Customer records synced',
        description: 'Search index and customer service are aligned for the latest registrations.',
        time: '10 min ago',
      },
      {
        title: 'Supervisor queue stabilized',
        description: 'Backlog dropped after a triage sweep on billing-related issues.',
        time: '28 min ago',
      },
      {
        title: 'Daily summary exported',
        description: 'Executive report snapshot is ready for the end-of-day review.',
        time: '1 hr ago',
      },
    ],
    focusList: [
      'Watch the customer directory for duplicate accounts before peak traffic starts.',
      'Use the agents workspace for invites, role changes, and coaching snapshots.',
      'Keep notification routing visible so admins can spot service bottlenecks quickly.',
    ],
  },
  SUPERVISOR: {
    eyebrow: 'Team oversight',
    title: 'Guide the team with a clearer view of queue pressure and follow-up work.',
    description:
      'The supervisor view highlights coaching, escalations, and the customer records that need attention right now.',
    cards: [
      {
        label: 'Customers touched today',
        value: '264',
        hint: 'Handled by active agents',
        trend: '+18 since morning',
        accent: 'border-indigo-200 bg-indigo-50/70',
      },
      {
        label: 'Pending callbacks',
        value: '23',
        hint: 'Needs assignment',
        trend: '6 due within 1h',
        accent: 'border-sky-200 bg-sky-50/70',
      },
      {
        label: 'Escalation queue',
        value: '9',
        hint: 'Requiring supervisor action',
        trend: '-2 since shift start',
        accent: 'border-amber-200 bg-amber-50/70',
      },
      {
        label: 'Team coverage',
        value: '92%',
        hint: 'Agents online and available',
        trend: 'Healthy staffing',
        accent: 'border-emerald-200 bg-emerald-50/70',
      },
    ],
    quickActions: [
      {
        title: 'Customer workspace',
        description: 'Search records and inspect recent changes before assigning follow-up.',
        route: 'customers',
        badge: 'Daily use',
        accent: 'from-indigo-600 to-sky-600',
      },
      {
        title: 'Invite agent',
        description: 'Bring a new teammate into the workspace with onboarding already prepared.',
        route: 'agents/invite',
        badge: 'Quick add',
        accent: 'from-emerald-600 to-teal-600',
      },
      {
        title: 'Agents workspace',
        description: 'Search the roster, review details, and update roles from one module.',
        route: 'agents',
        badge: 'Live',
        accent: 'from-slate-700 to-slate-900',
      },
    ],
    activity: [
      {
        title: 'Billing spike contained',
        description: 'Top queue categories were redistributed across available agents.',
        time: '12 min ago',
      },
      {
        title: 'Inactive customers flagged',
        description: 'Several dormant accounts are ready for reactivation outreach.',
        time: '36 min ago',
      },
      {
        title: 'Shift handoff notes updated',
        description: 'Key escalations are already summarized for the next lead.',
        time: '1 hr ago',
      },
    ],
    focusList: [
      'Use customer details pages during coaching to keep context visible.',
      'Track inactive accounts and route them for retention outreach.',
      'Use the agents module to keep role changes and staffing checks in one place.',
    ],
  },
  AGENT: {
    eyebrow: 'Frontline desk',
    title: 'A focused view for fast lookups, cleaner records, and confident next actions.',
    description:
      'Agents can move quickly between dashboard insight, customer search, and the next interaction without losing context.',
    cards: [
      {
        label: 'Customers in queue',
        value: '37',
        hint: 'Recent conversations',
        trend: '5 waiting on update',
        accent: 'border-indigo-200 bg-indigo-50/70',
      },
      {
        label: 'My callbacks',
        value: '8',
        hint: 'Scheduled for today',
        trend: '3 due this hour',
        accent: 'border-sky-200 bg-sky-50/70',
      },
      {
        label: 'Resolved today',
        value: '14',
        hint: 'Closed interactions',
        trend: '+4 vs yesterday',
        accent: 'border-emerald-200 bg-emerald-50/70',
      },
      {
        label: 'Knowledge hits',
        value: '21',
        hint: 'Useful help articles',
        trend: 'Most viewed: billing',
        accent: 'border-fuchsia-200 bg-fuchsia-50/70',
      },
    ],
    quickActions: [
      {
        title: 'Search customers',
        description: 'Find the customer first, then open the full profile and update details.',
        route: 'customers',
        badge: 'Main flow',
        accent: 'from-indigo-600 to-sky-600',
      },
      {
        title: 'Create customer',
        description: 'Capture a new contact while the interaction is still fresh.',
        route: 'customers/new',
        badge: 'New record',
        accent: 'from-emerald-600 to-teal-600',
      },
      {
        title: 'Knowledge base',
        description: 'Navigate to the placeholder content area for scripts and macros.',
        route: 'knowledge-base',
        badge: 'Preview',
        accent: 'from-slate-700 to-slate-900',
      },
    ],
    activity: [
      {
        title: 'Recent customer updates saved',
        description: 'Contact changes now appear instantly inside the details page.',
        time: '8 min ago',
      },
      {
        title: 'New customer path ready',
        description: 'Creation flow is live for both API and mock workspace fallback.',
        time: '22 min ago',
      },
      {
        title: 'Search filters synced',
        description: 'Name, phone, email, and status can all drive the results view.',
        time: '54 min ago',
      },
    ],
    focusList: [
      'Use the customer directory as the entry point for most workflows today.',
      'Keep callback notes nearby by opening details pages in a second tab when needed.',
      'Rely on the knowledge-base route as a navigable placeholder until content lands.',
    ],
  },
};

@Component({
  selector: 'app-workspace-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div
        class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
      >
        <div
          class="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.2),_transparent_32%),linear-gradient(135deg,_#111827_0%,_#312e81_45%,_#1d4ed8_100%)] px-6 py-8 text-white sm:px-8"
        >
          <div
            class="absolute -right-14 top-10 h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl"
          ></div>
          <div
            class="absolute left-8 top-full h-24 w-24 -translate-y-1/2 rounded-full bg-indigo-300/20 blur-2xl"
          ></div>

          <div class="relative grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div class="space-y-5">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
                {{ preset().eyebrow }}
              </div>

              <div class="space-y-3">
                <h1 class="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  {{ preset().title }}
                </h1>
                <p class="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  {{ preset().description }}
                </p>
              </div>

              <div class="flex flex-wrap gap-3">
                <a
                  [routerLink]="buildRoute('customers')"
                  class="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Open customers
                </a>
                <a
                  [routerLink]="buildRoute('customers/new')"
                  class="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create customer
                </a>
              </div>
            </div>

            <div class="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">Today</p>
              <p class="mt-2 text-2xl font-semibold">{{ todayLabel }}</p>
              <p class="mt-2 text-sm leading-6 text-slate-200">
                {{ user()?.name || 'Workspace user' }} signed in as {{ roleLabel() }}.
              </p>

              <div class="mt-5 space-y-3">
                <div
                  *ngFor="let item of preset().activity"
                  class="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                    <span class="text-xs text-slate-300">{{ item.time }}</span>
                  </div>
                  <p class="mt-1 text-sm text-slate-200">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          *ngFor="let card of preset().cards"
          class="rounded-3xl border p-5 shadow-sm"
          [ngClass]="card.accent"
        >
          <p class="text-sm font-medium text-slate-600">{{ card.label }}</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{{ card.value }}</p>
          <p class="mt-2 text-sm text-slate-500">{{ card.hint }}</p>
          <p class="mt-4 text-sm font-medium text-slate-700">{{ card.trend }}</p>
        </article>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                Quick actions
              </p>
              <h2 class="mt-2 text-xl font-semibold text-slate-950">Stay in flow</h2>
            </div>
            <a
              [routerLink]="buildRoute('customers')"
              class="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
            >
              Open workspace
            </a>
          </div>

          <div class="mt-6 grid gap-4 lg:grid-cols-3">
            <a
              *ngFor="let action of preset().quickActions"
              [routerLink]="buildRoute(action.route)"
              class="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
            >
              <div class="h-2 bg-gradient-to-r" [ngClass]="action.accent"></div>
              <div class="space-y-4 p-5">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-lg font-semibold text-slate-950">{{ action.title }}</h3>
                  <span
                    class="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    {{ action.badge }}
                  </span>
                </div>
                <p class="text-sm leading-6 text-slate-600">{{ action.description }}</p>
                <p
                  class="text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-500"
                >
                  Open module
                </p>
              </div>
            </a>
          </div>
        </div>

        <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Focus list
          </p>
          <h2 class="mt-2 text-xl font-semibold text-slate-950">What to keep visible today</h2>

          <div class="mt-6 space-y-3">
            <div
              *ngFor="let item of preset().focusList; let index = index"
              class="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white"
              >
                0{{ index + 1 }}
              </div>
              <p class="text-sm leading-6 text-slate-600">{{ item }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class WorkspaceDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.user$;
  readonly role = computed(() => this.user()?.role ?? 'ADMIN');
  readonly roleLabel = computed(
    () =>
      ({
        ADMIN: 'Admin',
        SUPERVISOR: 'Supervisor',
        AGENT: 'Agent',
        CUSTOMER: 'Customer',
      })[this.role()] ?? 'Workspace',
  );
  readonly preset = computed(() => STAFF_DASHBOARDS[this.role()] ?? STAFF_DASHBOARDS['ADMIN']);
  readonly basePath = computed(() => getRoleBasePath(this.role()));
  readonly todayLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date());

  buildRoute(path: string): string {
    return `${this.basePath()}/${path}`;
  }
}
