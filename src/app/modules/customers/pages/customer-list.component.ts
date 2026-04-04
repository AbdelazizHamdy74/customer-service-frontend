import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  Customer,
  CustomerSearchParams,
  CustomerSearchResult,
} from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
            Customers workspace
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950">
            Search-first directory
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600">
            Start broad with a global search, then narrow by name, phone, email, or status. The
            results view and details screens stay aligned with the customer service API shape.
          </p>
        </div>

        <a
          [routerLink]="['new']"
          queryParamsHandling="preserve"
          class="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create customer
        </a>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        The customer service is currently falling back to mock workspace data so navigation remains
        usable while the API is unavailable.
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Search filters
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Find the right customer fast</h2>
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
              form="customer-search-form"
              class="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Search customers
            </button>
          </div>
        </div>

        <form
          id="customer-search-form"
          [formGroup]="searchForm"
          (ngSubmit)="applyFilters()"
          class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <label class="space-y-2 xl:col-span-2">
            <span class="text-sm font-medium text-slate-700">Global search</span>
            <input
              formControlName="q"
              type="text"
              placeholder="Name, email, phone, or city"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Name</span>
            <input
              formControlName="name"
              type="text"
              placeholder="First or last name"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Phone</span>
            <input
              formControlName="phone"
              type="text"
              placeholder="+20..."
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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          <label class="space-y-2 md:col-span-2 xl:col-span-2">
            <span class="text-sm font-medium text-slate-700">Email</span>
            <input
              formControlName="email"
              type="email"
              placeholder="customer@example.com"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            />
          </label>
        </form>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Visible results</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ customers().length }}
          </p>
          <p class="mt-2 text-sm text-slate-500">Current page inventory</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Total matches</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {{ pagination().total }}
          </p>
          <p class="mt-2 text-sm text-slate-500">Across every matched customer record</p>
        </article>

        <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-slate-600">Source</p>
          <p class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 uppercase">
            {{ result()?.source || 'api' }}
          </p>
          <p class="mt-2 text-sm text-slate-500">
            Keeps the flow alive even during backend downtime
          </p>
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
              {{ inactiveCount() }} inactive
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
            class="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
          ></div>
        </div>

        <ng-container *ngIf="!isLoading()">
          <div
            *ngIf="!customers().length"
            class="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
          >
            <h3 class="text-lg font-semibold text-slate-950">No customers matched these filters</h3>
            <p class="mt-2 text-sm text-slate-500">
              Try broadening the query or create a new customer record to continue the workflow.
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
                [routerLink]="['new']"
                queryParamsHandling="preserve"
                class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create customer
              </a>
            </div>
          </div>

          <div *ngIf="customers().length" class="mt-6 space-y-4">
            <div class="grid gap-4 md:hidden">
              <article
                *ngFor="let customer of customers(); trackBy: trackByCustomer"
                class="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <a
                      [routerLink]="[customer.id]"
                      queryParamsHandling="preserve"
                      class="text-lg font-semibold text-slate-950 transition hover:text-indigo-600"
                    >
                      {{ customer.fullName }}
                    </a>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ customer.email || 'No email provided' }}
                    </p>
                  </div>
                  <span
                    class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    [ngClass]="statusClasses(customer.status)"
                  >
                    {{ customer.status }}
                  </span>
                </div>

                <div class="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>{{ customer.phone }}</p>
                  <p>{{ formatLocation(customer) }}</p>
                  <p>Updated {{ customer.updatedAt || customer.createdAt | date: 'mediumDate' }}</p>
                </div>

                <div class="mt-5 flex gap-3">
                  <a
                    [routerLink]="[customer.id]"
                    queryParamsHandling="preserve"
                    class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Details
                  </a>
                  <a
                    [routerLink]="[customer.id, 'edit']"
                    queryParamsHandling="preserve"
                    class="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    Edit
                  </a>
                </div>
              </article>
            </div>

            <div class="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Customer
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Contact
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Location
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Status
                    </th>
                    <th
                      class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                    >
                      Updated
                    </th>
                    <th class="px-5 py-4"></th>
                  </tr>
                </thead>

                <tbody class="divide-y divide-slate-200 bg-white">
                  <tr
                    *ngFor="let customer of customers(); trackBy: trackByCustomer"
                    class="hover:bg-slate-50"
                  >
                    <td class="px-5 py-4 align-top">
                      <a
                        [routerLink]="[customer.id]"
                        queryParamsHandling="preserve"
                        class="text-sm font-semibold text-slate-950 transition hover:text-indigo-600"
                      >
                        {{ customer.fullName }}
                      </a>
                      <p class="mt-1 text-xs text-slate-500">{{ customer.id }}</p>
                    </td>
                    <td class="px-5 py-4 align-top text-sm text-slate-600">
                      <p>{{ customer.email || 'No email provided' }}</p>
                      <p class="mt-1">{{ customer.phone }}</p>
                    </td>
                    <td class="px-5 py-4 align-top text-sm text-slate-600">
                      {{ formatLocation(customer) }}
                    </td>
                    <td class="px-5 py-4 align-top">
                      <span
                        class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                        [ngClass]="statusClasses(customer.status)"
                      >
                        {{ customer.status }}
                      </span>
                    </td>
                    <td class="px-5 py-4 align-top text-sm text-slate-600">
                      {{ customer.updatedAt || customer.createdAt | date: 'mediumDate' }}
                    </td>
                    <td class="px-5 py-4 align-top">
                      <div class="flex items-center justify-end gap-2">
                        <a
                          [routerLink]="[customer.id]"
                          queryParamsHandling="preserve"
                          class="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          Details
                        </a>
                        <a
                          [routerLink]="[customer.id, 'edit']"
                          queryParamsHandling="preserve"
                          class="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              class="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p class="text-sm text-slate-500">
                Showing
                {{ firstItemIndex() }}
                -
                {{ lastItemIndex() }}
                of
                {{ pagination().total }}
                matched customers
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
export class CustomerListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  readonly searchForm = this.formBuilder.nonNullable.group({
    q: '',
    name: '',
    phone: '',
    email: '',
    status: '',
  });
  readonly result = signal<CustomerSearchResult | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly usingMock = this.customerService.usingMock$;
  readonly customers = computed(() => this.result()?.items ?? []);
  readonly pagination = computed(
    () =>
      this.result()?.pagination ?? {
        page: 1,
        limit: 12,
        total: 0,
        pages: 1,
      },
  );
  readonly activeCount = computed(
    () => this.customers().filter((customer) => customer.status === 'ACTIVE').length,
  );
  readonly inactiveCount = computed(
    () => this.customers().filter((customer) => customer.status === 'INACTIVE').length,
  );
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
              name: params.name ?? '',
              phone: params.phone ?? '',
              email: params.email ?? '',
              status: params.status ?? '',
            },
            { emitEvent: false },
          );
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap((params) =>
          this.customerService.searchCustomers(params).pipe(
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
      name: '',
      phone: '',
      email: '',
      status: '',
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

  formatLocation(customer: Customer): string {
    const values = [customer.address.city, customer.address.state, customer.address.country].filter(
      Boolean,
    );
    return values.length ? values.join(', ') : 'Address pending';
  }

  statusClasses(status: Customer['status']): string {
    return status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }

  trackByCustomer(_: number, customer: Customer): string {
    return customer.id;
  }

  private buildQueryParams(page: number): Record<string, string | number> {
    const value = this.searchForm.getRawValue();

    return Object.entries({
      q: value.q.trim(),
      name: value.name.trim(),
      phone: value.phone.trim(),
      email: value.email.trim(),
      status: value.status.trim(),
      page,
      limit: 12,
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

  private readSearchParams(params: ParamMap): CustomerSearchParams {
    const status = params.get('status');

    return {
      q: params.get('q') ?? '',
      name: params.get('name') ?? '',
      phone: params.get('phone') ?? '',
      email: params.get('email') ?? '',
      status: status === 'ACTIVE' || status === 'INACTIVE' ? status : '',
      page: Math.max(1, Number(params.get('page') ?? 1) || 1),
      limit: Math.max(1, Number(params.get('limit') ?? 12) || 12),
    };
  }

  private getErrorMessage(error: unknown): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      'Unable to load customers right now.'
    );
  }
}
