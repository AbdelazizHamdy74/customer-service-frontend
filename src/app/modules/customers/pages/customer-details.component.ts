import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

@Component({
  selector: 'app-customer-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <a
            [routerLink]="customersPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
          >
            Back to customers
          </a>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">Customer details</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Review contact data, address information, and the latest account activity in a single
            screen.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            [routerLink]="customersPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Directory
          </a>
          <a
            *ngIf="customer()"
            [routerLink]="editPath()"
            [queryParams]="queryParams"
            class="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit customer
          </a>
        </div>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        Customer details are being served from mock workspace data right now.
      </div>

      <div
        *ngIf="error()"
        class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        {{ error() }}
      </div>

      <div *ngIf="isLoading()" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div class="h-80 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
        <div class="space-y-6">
          <div class="h-36 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
          <div class="h-36 animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"></div>
        </div>
      </div>

      <ng-container *ngIf="!isLoading()">
        <ng-container *ngIf="customer() as currentCustomer">
          <div
            class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
          >
            <div
              class="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_36%),linear-gradient(135deg,_#0f172a_0%,_#312e81_48%,_#1d4ed8_100%)] px-6 py-8 text-white sm:px-8"
            >
              <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
                    Customer profile
                  </p>
                  <h2 class="mt-3 text-3xl font-semibold tracking-tight">
                    {{ currentCustomer.fullName }}
                  </h2>
                  <p class="mt-2 max-w-2xl text-sm text-slate-200">
                    {{ currentCustomer.email || 'Email not added yet' }}
                    <span class="mx-2 text-slate-400">•</span>
                    {{ currentCustomer.phone }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-3">
                  <span
                    class="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]"
                    [ngClass]="statusClasses(currentCustomer.status)"
                  >
                    {{ currentCustomer.status }}
                  </span>
                  <span
                    class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200"
                  >
                    {{ currentCustomer.source }}
                  </span>
                </div>
              </div>
            </div>

            <div class="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
              <article class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Contact snapshot
                </p>
                <div class="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p class="text-sm font-medium text-slate-500">First name</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.firstName }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-500">Last name</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.lastName }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-500">Email</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.email || 'Not provided' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-500">Phone</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.phone }}
                    </p>
                  </div>
                </div>
              </article>

              <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                  Lifecycle
                </p>
                <div class="mt-5 space-y-4">
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Created</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.createdAt | date: 'medium' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Updated</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.updatedAt || currentCustomer.createdAt | date: 'medium' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Created by</p>
                    <p class="mt-2 text-lg font-semibold text-slate-950">
                      {{ currentCustomer.createdBy || 'System workspace' }}
                    </p>
                  </div>
                </div>
              </article>

              <article class="rounded-[1.75rem] border border-slate-200 bg-white p-6 xl:col-span-2">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
                      Address
                    </p>
                    <h3 class="mt-2 text-xl font-semibold text-slate-950">
                      Where this customer lives
                    </h3>
                  </div>
                  <p class="text-sm text-slate-500">{{ formattedLocation(currentCustomer) }}</p>
                </div>

                <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Street</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentCustomer.address.street || 'Not provided' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">City</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentCustomer.address.city || 'Not provided' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">State</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentCustomer.address.state || 'Not provided' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Country</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentCustomer.address.country || 'Not provided' }}
                    </p>
                  </div>
                  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p class="text-sm font-medium text-slate-500">Postal code</p>
                    <p class="mt-2 text-base font-semibold text-slate-950">
                      {{ currentCustomer.address.zipCode || 'Not provided' }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </section>
  `,
})
export class CustomerDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  readonly queryParams = this.route.snapshot.queryParams;
  readonly customer = signal<Customer | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly usingMock = this.customerService.usingMock$;
  readonly user = this.authService.user$;
  readonly basePath = computed(() => getRoleBasePath(this.user()?.role));
  readonly customersPath = computed(() => `${this.basePath()}/customers`);
  readonly editPath = computed(() => {
    const customer = this.customer();
    return customer ? `${this.basePath()}/customers/${customer.id}/edit` : this.customersPath();
  });

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        map((params) => params.get('id') ?? ''),
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap((id) =>
          this.customerService.getCustomer(id).pipe(
            catchError((error) => {
              this.customer.set(null);
              this.error.set(this.getErrorMessage(error));
              return of(null);
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.customer.set(response.data);
        }
      });
  }

  formattedLocation(customer: Customer): string {
    const values = [
      customer.address.street,
      customer.address.city,
      customer.address.state,
      customer.address.country,
      customer.address.zipCode,
    ].filter(Boolean);

    return values.length ? values.join(', ') : 'Address not provided yet';
  }

  statusClasses(status: Customer['status']): string {
    return status === 'ACTIVE'
      ? 'bg-emerald-400/15 text-emerald-100'
      : 'bg-slate-100/15 text-slate-100';
  }

  private getErrorMessage(error: unknown): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      'Unable to load this customer right now.'
    );
  }
}
