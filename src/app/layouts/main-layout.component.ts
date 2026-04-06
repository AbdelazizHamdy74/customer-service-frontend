import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { getRoleBasePath } from '../core/utils/role-path.util';

interface NavigationItem {
  label: string;
  description: string;
  route: string;
  badge?: string;
  exact?: boolean;
}

interface NotificationItem {
  title: string;
  description: string;
  route: string;
  time: string;
  unread: boolean;
}

const NAVIGATION_BY_ROLE: Record<string, NavigationItem[]> = {
  ADMIN: [
    { label: 'Dashboard', description: 'Operational snapshot', route: 'dashboard', exact: true },
    { label: 'Customers', description: 'Search and profiles', route: 'customers', badge: 'Live' },
    { label: 'Agents', description: 'Invites and performance', route: 'agents', badge: 'Live' },
    { label: 'Reports', description: 'Service trends', route: 'reports', badge: 'Preview' },
    { label: 'Settings', description: 'Workspace controls', route: 'settings', badge: 'Preview' },
  ],
  SUPERVISOR: [
    { label: 'Dashboard', description: 'Queue and team view', route: 'dashboard', exact: true },
    { label: 'Customers', description: 'Search and assign', route: 'customers', badge: 'Live' },
    { label: 'Agents', description: 'Coverage and coaching', route: 'agents', badge: 'Live' },
    { label: 'Reports', description: 'Performance trends', route: 'reports', badge: 'Preview' },
  ],
  AGENT: [
    { label: 'Dashboard', description: 'Daily working set', route: 'dashboard', exact: true },
    {
      label: 'Customers',
      description: 'Search-first workspace',
      route: 'customers',
      badge: 'Live',
    },
    { label: 'Tickets', description: 'Issue queue', route: 'tickets', badge: 'Preview' },
    {
      label: 'Knowledge Base',
      description: 'Guides and playbooks',
      route: 'knowledge-base',
      badge: 'Preview',
    },
  ],
  CUSTOMER: [
    { label: 'Dashboard', description: 'My support view', route: 'dashboard', exact: true },
    {
      label: 'My Requests',
      description: 'Track open help items',
      route: 'requests',
      badge: 'Preview',
    },
    { label: 'Profile', description: 'Account preferences', route: 'profile', badge: 'Preview' },
    {
      label: 'Knowledge Base',
      description: 'Helpful resources',
      route: 'knowledge-base',
      badge: 'Preview',
    },
  ],
};

const NOTIFICATIONS_BY_ROLE: Record<string, NotificationItem[]> = {
  ADMIN: [
    {
      title: 'Customer directory is ready',
      description: 'Search, details, and create/edit flows are all wired together.',
      route: 'customers',
      time: 'Now',
      unread: true,
    },
    {
      title: 'Agents workspace is live',
      description: 'Invite, create, role assignment, and performance now sit in one staffing flow.',
      route: 'agents',
      time: '18 min ago',
      unread: true,
    },
    {
      title: 'Settings surface prepared',
      description: 'The shell already reserves a stable path for admin controls.',
      route: 'settings',
      time: '1 hr ago',
      unread: false,
    },
  ],
  SUPERVISOR: [
    {
      title: 'Customer search is live',
      description: 'Use the new workspace to find and review customer records quickly.',
      route: 'customers',
      time: 'Now',
      unread: true,
    },
    {
      title: 'Agents flow is ready',
      description:
        'Search, invite, edit, and role assignment are now part of the staffing workspace.',
      route: 'agents',
      time: '24 min ago',
      unread: true,
    },
  ],
  AGENT: [
    {
      title: 'Search-first customer flow ready',
      description: 'You can now move from search results to details and edit without friction.',
      route: 'customers',
      time: 'Now',
      unread: true,
    },
    {
      title: 'Knowledge base route reserved',
      description: 'The shell keeps the next content module available in the journey.',
      route: 'knowledge-base',
      time: '34 min ago',
      unread: false,
    },
  ],
  CUSTOMER: [
    {
      title: 'Dashboard refreshed',
      description: 'Your support workspace is easier to navigate across upcoming sections.',
      route: 'dashboard',
      time: 'Now',
      unread: true,
    },
    {
      title: 'Profile route prepared',
      description: 'Account updates now have a stable destination in the shell.',
      route: 'profile',
      time: '52 min ago',
      unread: false,
    },
  ],
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div
      class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-950"
    >
      <button
        *ngIf="sidebarOpen()"
        type="button"
        (click)="closePanels()"
        class="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        aria-label="Close sidebar"
      ></button>

      <aside
        class="fixed inset-y-0 left-0 z-40 w-72 transform transition duration-300 ease-out lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
      >
        <div class="flex h-full flex-col border-r border-white/10 bg-slate-950 text-slate-100">
          <div class="px-6 pb-5 pt-6">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-lg font-bold text-white"
              >
                CS
              </div>
              <div>
                <p class="text-sm font-semibold text-white">Customer Service</p>
                <p class="text-xs text-slate-400">Role-aware workspace shell</p>
              </div>
            </div>

            <div class="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white"
                >
                  {{ userInitials() }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">
                    {{ user()?.name || 'Workspace user' }}
                  </p>
                  <p class="truncate text-xs text-slate-400">{{ user()?.email }}</p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {{ roleLabel() }}
                </span>
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              </div>
            </div>
          </div>

          <nav class="flex-1 space-y-2 overflow-y-auto px-4 pb-4">
            <a
              *ngFor="let item of navigationItems()"
              [routerLink]="item.path"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              routerLinkActive="bg-white/10 text-white"
              class="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <div>
                <p class="font-semibold">{{ item.label }}</p>
                <p class="mt-1 text-xs text-slate-400 group-hover:text-slate-300">
                  {{ item.description }}
                </p>
              </div>
              <span
                *ngIf="item.badge"
                class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
              >
                {{ item.badge }}
              </span>
            </a>
          </nav>

          <div class="border-t border-white/10 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Workspace note
            </p>
            <p class="mt-2 text-sm leading-6 text-slate-300">
              The shell is fully navigable today, with mock-friendly sections reserved for the next
              frontend slices.
            </p>
          </div>
        </div>
      </aside>

      <div class="min-h-screen lg:pl-72">
        <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div class="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="toggleSidebar()"
                  class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950 lg:hidden"
                  aria-label="Toggle sidebar"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.75"
                      d="M4 7h16M4 12h16M4 17h16"
                    />
                  </svg>
                </button>

                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                    {{ pageMeta().eyebrow }}
                  </p>
                  <h1 class="text-xl font-semibold tracking-tight text-slate-950">
                    {{ pageMeta().title }}
                  </h1>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div
                  class="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:inline-flex"
                >
                  {{ roleLabel() }} view
                </div>

                <div class="relative">
                  <button
                    type="button"
                    (click)="toggleNotifications()"
                    class="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    aria-label="Open notifications"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.75"
                        d="M15 17h5l-1.405-1.405A2.03 2.03 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                      />
                    </svg>
                    <span
                      *ngIf="notificationCount()"
                      class="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-semibold text-white"
                    >
                      {{ notificationCount() }}
                    </span>
                  </button>

                  <div
                    *ngIf="notificationsOpen()"
                    class="absolute right-0 top-[calc(100%+0.75rem)] w-80 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-semibold text-slate-950">Notifications</p>
                      <span class="text-xs font-medium text-slate-500">{{ roleLabel() }} feed</span>
                    </div>

                    <div class="mt-4 space-y-3">
                      <a
                        *ngFor="let item of notifications()"
                        [routerLink]="buildRoute(item.route)"
                        class="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <p class="text-sm font-semibold text-slate-950">{{ item.title }}</p>
                          <span
                            class="h-2.5 w-2.5 rounded-full"
                            [class.bg-indigo-500]="item.unread"
                            [class.bg-slate-300]="!item.unread"
                          ></span>
                        </div>
                        <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.description }}</p>
                        <p
                          class="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400"
                        >
                          {{ item.time }}
                        </p>
                      </a>
                    </div>
                  </div>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    (click)="toggleUserMenu()"
                    class="inline-flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-left text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    aria-label="Open user menu"
                  >
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white"
                    >
                      {{ userInitials() }}
                    </div>
                    <div class="hidden sm:block">
                      <p class="text-sm font-semibold text-slate-950">
                        {{ user()?.name || 'Workspace user' }}
                      </p>
                      <p class="text-xs text-slate-500">{{ roleLabel() }}</p>
                    </div>
                  </button>

                  <div
                    *ngIf="userMenuOpen()"
                    class="absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
                  >
                    <div class="rounded-2xl bg-slate-50 p-4">
                      <p class="text-sm font-semibold text-slate-950">
                        {{ user()?.name || 'Workspace user' }}
                      </p>
                      <p class="mt-1 text-sm text-slate-500">{{ user()?.email }}</p>
                    </div>

                    <div class="mt-4 space-y-2">
                      <a
                        [routerLink]="buildRoute('dashboard')"
                        class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <span>Go to dashboard</span>
                        <span class="text-xs text-slate-400">Open</span>
                      </a>
                      <a
                        [routerLink]="secondaryMenuPath()"
                        class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <span>{{ secondaryMenuLabel() }}</span>
                        <span class="text-xs text-slate-400">Open</span>
                      </a>
                      <button
                        type="button"
                        (click)="logout()"
                        class="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <span>Sign out</span>
                        <span class="text-xs text-red-400">Exit</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p class="mt-4 max-w-3xl text-sm text-slate-500">{{ pageMeta().description }}</p>
          </div>
        </header>

        <main class="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly currentUrl = signal(this.router.url);
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
  readonly basePath = computed(() => getRoleBasePath(this.role()));
  readonly navigationItems = computed(() => this.buildNavigationItems());
  readonly notifications = computed(
    () => NOTIFICATIONS_BY_ROLE[this.role()] ?? NOTIFICATIONS_BY_ROLE['ADMIN'],
  );
  readonly notificationCount = computed(
    () => this.notifications().filter((item) => item.unread).length,
  );
  readonly userInitials = computed(() => {
    const name = this.user()?.name?.trim();
    if (!name) {
      return 'CS';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });
  readonly pageMeta = computed(() => this.resolvePageMeta(this.currentUrl()));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.sidebarOpen.set(false);
        this.notificationsOpen.set(false);
        this.userMenuOpen.set(false);
      });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
    this.notificationsOpen.set(false);
  }

  closePanels(): void {
    this.sidebarOpen.set(false);
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  buildRoute(route: string): string {
    return `${this.basePath()}/${route}`;
  }

  secondaryMenuPath(): string {
    const candidate = this.navigationItems().find((item) => item.route !== 'dashboard');
    return candidate?.path ?? this.buildRoute('dashboard');
  }

  secondaryMenuLabel(): string {
    const candidate = this.navigationItems().find((item) => item.route !== 'dashboard');
    return candidate?.label ?? 'Open workspace';
  }

  private buildNavigationItems(): Array<NavigationItem & { path: string }> {
    const basePath = this.basePath();
    const items = NAVIGATION_BY_ROLE[this.role()] ?? NAVIGATION_BY_ROLE['ADMIN'];

    return items.map((item) => ({
      ...item,
      path: `${basePath}/${item.route}`,
    }));
  }

  private resolvePageMeta(url: string): {
    eyebrow: string;
    title: string;
    description: string;
  } {
    if (url.includes('/customers/new')) {
      return {
        eyebrow: 'Customers',
        title: 'Create customer',
        description: 'Add a new record with contact, address, and status details.',
      };
    }

    if (/\/customers\/[^/]+\/edit(?:\?|$)/.test(url)) {
      return {
        eyebrow: 'Customers',
        title: 'Edit customer',
        description: 'Update the record while keeping search context nearby.',
      };
    }

    if (/\/customers\/[^/?]+(?:\?|$)/.test(url)) {
      return {
        eyebrow: 'Customers',
        title: 'Customer details',
        description: 'Review identity, address, and lifecycle data from a single place.',
      };
    }

    if (url.includes('/agents/invite')) {
      return {
        eyebrow: 'Agents',
        title: 'Invite agent',
        description:
          'Provision a teammate through the auth invite flow and keep staffing work moving.',
      };
    }

    if (url.includes('/agents/new')) {
      return {
        eyebrow: 'Agents',
        title: 'Create agent',
        description: 'Create a direct agent record for staffing, seeding, or operations setup.',
      };
    }

    if (/\/agents\/[^/]+\/edit(?:\?|$)/.test(url)) {
      return {
        eyebrow: 'Agents',
        title: 'Edit agent',
        description: 'Adjust role, team, and skills without losing the staffing context.',
      };
    }

    if (/\/agents\/[^/?]+(?:\?|$)/.test(url)) {
      return {
        eyebrow: 'Agents',
        title: 'Agent details',
        description:
          'Review profile, role assignment, and performance in a single staffing screen.',
      };
    }

    const matchedItem = this.navigationItems().find((item) => url.startsWith(item.path));
    if (matchedItem) {
      return {
        eyebrow: 'Workspace',
        title: matchedItem.label,
        description: matchedItem.description,
      };
    }

    return {
      eyebrow: 'Workspace',
      title: 'Customer Service',
      description: 'A role-aware app shell designed to keep navigation smooth while modules grow.',
    };
  }
}
