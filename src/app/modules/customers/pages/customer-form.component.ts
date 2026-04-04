import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import {
  Customer,
  CustomerStatus,
  CustomerUpsertPayload,
} from '../../../core/models/customer.model';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { getRoleBasePath } from '../../../core/utils/role-path.util';

@Component({
  selector: 'app-customer-form',
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
            {{ isEditMode() ? 'Back to details' : 'Back to customers' }}
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
            form="customer-form"
            [disabled]="isSaving()"
            class="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSaving() ? 'Saving...' : isEditMode() ? 'Save changes' : 'Create customer' }}
          </button>
        </div>
      </div>

      <div
        *ngIf="usingMock()"
        class="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        Create and edit actions are using mock workspace persistence until the customer API becomes
        reachable again.
      </div>

      <div
        *ngIf="error()"
        class="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
      >
        {{ error() }}
      </div>

      <div *ngIf="isLoading()" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div
          class="h-[30rem] animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
        ></div>
        <div
          class="h-[22rem] animate-pulse rounded-[2rem] border border-slate-200 bg-slate-100"
        ></div>
      </div>

      <form
        *ngIf="!isLoading()"
        id="customer-form"
        [formGroup]="form"
        (ngSubmit)="submit()"
        class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div class="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">
              Identity
            </p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Core customer details</h2>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
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

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Email</span>
              <input
                formControlName="email"
                type="email"
                placeholder="customer@example.com"
                class="w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition"
                [ngClass]="inputClasses('email')"
              />
              <p *ngIf="isInvalid('email')" class="text-sm text-red-600">
                Enter a valid email address.
              </p>
            </label>

            <label class="space-y-2">
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

        <div class="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Status</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">
              Availability and account health
            </h2>
          </div>

          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-700">Customer status</span>
            <select
              formControlName="status"
              class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
            >
              <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
            </select>
          </label>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-700">Form mode</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              {{
                isEditMode()
                  ? 'You are updating an existing record.'
                  : 'You are creating a new customer record.'
              }}
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-medium text-slate-700">Tips</p>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Keep names readable, phone numbers normalized, and addresses good enough for the team
              to identify the customer quickly.
            </p>
          </div>
        </div>

        <div
          class="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500">Address</p>
            <h2 class="mt-2 text-xl font-semibold text-slate-950">Location details</h2>
          </div>

          <div formGroupName="address" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <label class="space-y-2 sm:col-span-2 xl:col-span-2">
              <span class="text-sm font-medium text-slate-700">Street</span>
              <input
                formControlName="street"
                type="text"
                placeholder="Street and building"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">City</span>
              <input
                formControlName="city"
                type="text"
                placeholder="City"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">State</span>
              <input
                formControlName="state"
                type="text"
                placeholder="State"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Country</span>
              <input
                formControlName="country"
                type="text"
                placeholder="Country"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-medium text-slate-700">Postal code</span>
              <input
                formControlName="zipCode"
                type="text"
                placeholder="Zip code"
                class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>
          </div>
        </div>
      </form>
    </section>
  `,
})
export class CustomerFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  readonly queryParams = this.route.snapshot.queryParams;
  readonly customerId = signal(this.route.snapshot.paramMap.get('id'));
  readonly user = this.authService.user$;
  readonly basePath = computed(() => getRoleBasePath(this.user()?.role));
  readonly isEditMode = computed(() => !!this.customerId());
  readonly pageTitle = computed(() =>
    this.isEditMode() ? 'Edit customer profile' : 'Create customer profile',
  );
  readonly pageDescription = computed(() =>
    this.isEditMode()
      ? 'Update this customer while keeping the same search-first flow and layout language.'
      : 'Capture a new customer with enough detail for the team to search, review, and serve them immediately.',
  );
  readonly cancelPath = computed(() => {
    const customerId = this.customerId();
    return this.isEditMode() && customerId
      ? `${this.basePath()}/customers/${customerId}`
      : `${this.basePath()}/customers`;
  });
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly usingMock = this.customerService.usingMock$;
  readonly statuses: CustomerStatus[] = ['ACTIVE', 'INACTIVE'];
  private hasHandledParams = false;

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', Validators.email],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    status: 'ACTIVE' as CustomerStatus,
    address: this.formBuilder.nonNullable.group({
      street: '',
      city: '',
      state: '',
      country: 'Egypt',
      zipCode: '',
    }),
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const latestId = params.get('id');
      const currentId = this.customerId();

      if (this.hasHandledParams && latestId === currentId) {
        if (!latestId) {
          this.isLoading.set(false);
        }
        return;
      }

      this.hasHandledParams = true;
      this.customerId.set(latestId);

      if (latestId) {
        this.loadCustomer(latestId);
        return;
      }

      this.isLoading.set(false);
      this.form.reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        address: {
          street: '',
          city: '',
          state: '',
          country: 'Egypt',
          zipCode: '',
        },
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const payload = this.buildPayload();
    const customerId = this.customerId();
    const request$ = customerId
      ? this.customerService.updateCustomer(customerId, payload)
      : this.customerService.createCustomer(payload);

    request$
      .pipe(
        catchError((error) => {
          this.error.set(this.getErrorMessage(error));
          return of(null);
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe((response) => {
        const savedCustomerId = response?.data?.id ?? customerId;
        if (!savedCustomerId) {
          return;
        }

        this.router.navigateByUrl(this.buildUrl(`${this.basePath()}/customers/${savedCustomerId}`));
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

  private loadCustomer(customerId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.customerService
      .getCustomer(customerId)
      .pipe(
        catchError((error) => {
          this.error.set(this.getErrorMessage(error));
          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((response) => {
        if (response?.data) {
          this.patchCustomer(response.data);
        }
      });
  }

  private patchCustomer(customer: Customer): void {
    this.form.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      address: {
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        country: customer.address.country,
        zipCode: customer.address.zipCode,
      },
    });
  }

  private buildPayload(): CustomerUpsertPayload {
    const value = this.form.getRawValue();

    return {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      phone: value.phone,
      status: value.status,
      address: {
        street: value.address.street,
        city: value.address.city,
        state: value.address.state,
        country: value.address.country,
        zipCode: value.address.zipCode,
      },
    };
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

  private getErrorMessage(error: unknown): string {
    return (
      (error as { error?: { message?: string }; message?: string })?.error?.message ||
      (error as { message?: string })?.message ||
      'Unable to save this customer right now.'
    );
  }
}
