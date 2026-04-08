import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  Customer,
  CustomerAddress,
  CustomerPagination,
  CustomerSearchParams,
  CustomerSearchResult,
  CustomerSource,
  CustomerStatus,
  CustomerUpsertPayload,
} from '../models/customer.model';

type RawCustomer = Partial<Customer> & {
  _id?: string;
  address?: Partial<CustomerAddress> | null;
};

type RawSearchResponse = {
  items?: RawCustomer[];
  pagination?: Partial<CustomerPagination>;
};

const DEFAULT_ADDRESS: CustomerAddress = {
  street: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
};

const MOCK_CUSTOMERS: RawCustomer[] = [
  {
    id: 'cust-1001',
    firstName: 'Lina',
    lastName: 'Hassan',
    email: 'lina.hassan@example.com',
    phone: '+20 100 234 8891',
    status: 'ACTIVE',
    address: {
      street: '15 Palm Avenue',
      city: 'Cairo',
      state: 'Cairo',
      country: 'Egypt',
      zipCode: '11865',
    },
    createdBy: 'seed',
    createdAt: '2026-03-29T09:10:00.000Z',
    updatedAt: '2026-04-03T12:20:00.000Z',
  },
  {
    id: 'cust-1002',
    firstName: 'Omar',
    lastName: 'Khaled',
    email: 'omar.khaled@example.com',
    phone: '+20 109 551 0042',
    status: 'ACTIVE',
    address: {
      street: '22 Nile Corniche',
      city: 'Giza',
      state: 'Giza',
      country: 'Egypt',
      zipCode: '12511',
    },
    createdBy: 'seed',
    createdAt: '2026-03-26T11:05:00.000Z',
    updatedAt: '2026-04-02T08:45:00.000Z',
  },
  {
    id: 'cust-1003',
    firstName: 'Sara',
    lastName: 'Mahmoud',
    email: 'sara.mahmoud@example.com',
    phone: '+20 111 902 5540',
    status: 'INACTIVE',
    address: {
      street: '7 Garden District',
      city: 'Alexandria',
      state: 'Alexandria',
      country: 'Egypt',
      zipCode: '21526',
    },
    createdBy: 'seed',
    createdAt: '2026-03-21T16:40:00.000Z',
    updatedAt: '2026-03-28T10:15:00.000Z',
  },
  {
    id: 'cust-1004',
    firstName: 'Mariam',
    lastName: 'Youssef',
    email: 'mariam.youssef@example.com',
    phone: '+20 120 881 3367',
    status: 'ACTIVE',
    address: {
      street: '44 Coastline Road',
      city: 'Hurghada',
      state: 'Red Sea',
      country: 'Egypt',
      zipCode: '84511',
    },
    createdBy: 'seed',
    createdAt: '2026-03-18T14:30:00.000Z',
    updatedAt: '2026-04-01T09:50:00.000Z',
  },
  {
    id: 'cust-1005',
    firstName: 'Yassin',
    lastName: 'Nabil',
    email: 'yassin.nabil@example.com',
    phone: '+20 122 780 7710',
    status: 'ACTIVE',
    address: {
      street: '6 Industrial Square',
      city: 'Mansoura',
      state: 'Dakahlia',
      country: 'Egypt',
      zipCode: '35516',
    },
    createdBy: 'seed',
    createdAt: '2026-03-13T07:25:00.000Z',
    updatedAt: '2026-03-30T15:00:00.000Z',
  },
  {
    id: 'cust-1006',
    firstName: 'Noha',
    lastName: 'Adel',
    email: 'noha.adel@example.com',
    phone: '+20 127 431 2288',
    status: 'ACTIVE',
    address: {
      street: '13 Lotus Compound',
      city: 'New Cairo',
      state: 'Cairo',
      country: 'Egypt',
      zipCode: '11835',
    },
    createdBy: 'seed',
    createdAt: '2026-03-11T12:00:00.000Z',
    updatedAt: '2026-03-27T18:15:00.000Z',
  },
  {
    id: 'cust-1007',
    firstName: 'Karim',
    lastName: 'Samir',
    email: 'karim.samir@example.com',
    phone: '+20 110 610 4401',
    status: 'INACTIVE',
    address: {
      street: '55 Upper Hill',
      city: 'Assiut',
      state: 'Assiut',
      country: 'Egypt',
      zipCode: '71511',
    },
    createdBy: 'seed',
    createdAt: '2026-03-08T17:40:00.000Z',
    updatedAt: '2026-03-24T13:35:00.000Z',
  },
  {
    id: 'cust-1008',
    firstName: 'Dina',
    lastName: 'Fouad',
    email: 'dina.fouad@example.com',
    phone: '+20 101 220 9191',
    status: 'ACTIVE',
    address: {
      street: '90 Harbor Street',
      city: 'Port Said',
      state: 'Port Said',
      country: 'Egypt',
      zipCode: '42523',
    },
    createdBy: 'seed',
    createdAt: '2026-03-04T10:18:00.000Z',
    updatedAt: '2026-03-22T09:05:00.000Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/customers`;
  private readonly usingMockSignal = signal(false);
  private readonly mockCustomersSignal = signal(
    MOCK_CUSTOMERS.map((customer) => this.normalizeCustomer(customer, 'mock')),
  );

  readonly usingMock$ = this.usingMockSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  searchCustomers(params: CustomerSearchParams): Observable<ApiResponse<CustomerSearchResult>> {
    return this.http
      .get<ApiResponse<RawSearchResponse>>(`${this.apiUrl}/search`, {
        params: this.buildSearchParams(params),
      })
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: {
            items: (response.data?.items ?? []).map((customer) =>
              this.normalizeCustomer(customer, 'api'),
            ),
            pagination: this.normalizePagination(
              response.data?.pagination,
              params.limit ?? 12,
              (response.data?.items ?? []).length,
            ),
            source: 'api' as CustomerSource,
          },
        })),
        catchError((error) =>
          this.shouldUseMock(error) ? this.searchCustomersMock(params) : throwError(() => error),
        ),
      );
  }

  getCustomer(id: string): Observable<ApiResponse<Customer>> {
    if (id.startsWith('mock-')) {
      return this.getCustomerMock(id);
    }

    return this.http.get<ApiResponse<RawCustomer>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.usingMockSignal.set(false)),
      map((response) => ({
        ...response,
        data: response.data ? this.normalizeCustomer(response.data, 'api') : undefined,
      })),
      catchError((error) =>
        this.shouldUseMock(error) ? this.getCustomerMock(id) : throwError(() => error),
      ),
    ) as Observable<ApiResponse<Customer>>;
  }

  createCustomer(payload: CustomerUpsertPayload): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<RawCustomer>>(this.apiUrl, this.toApiPayload(payload)).pipe(
      tap(() => this.usingMockSignal.set(false)),
      map((response) => ({
        ...response,
        data: response.data ? this.normalizeCustomer(response.data, 'api') : undefined,
      })),
      catchError((error) =>
        this.shouldUseMock(error) ? this.createCustomerMock(payload) : throwError(() => error),
      ),
    ) as Observable<ApiResponse<Customer>>;
  }

  updateCustomer(id: string, payload: CustomerUpsertPayload): Observable<ApiResponse<Customer>> {
    if (id.startsWith('mock-')) {
      return this.updateCustomerMock(id, payload);
    }

    return this.http
      .put<ApiResponse<RawCustomer>>(`${this.apiUrl}/${id}`, this.toApiPayload(payload))
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: response.data ? this.normalizeCustomer(response.data, 'api') : undefined,
        })),
        catchError((error) =>
          this.shouldUseMock(error)
            ? this.updateCustomerMock(id, payload)
            : throwError(() => error),
        ),
      ) as Observable<ApiResponse<Customer>>;
  }

  private searchCustomersMock(
    params: CustomerSearchParams,
  ): Observable<ApiResponse<CustomerSearchResult>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 12);
    const query = (params.q ?? '').trim().toLowerCase();
    const name = (params.name ?? '').trim().toLowerCase();
    const phone = (params.phone ?? '').trim().toLowerCase();
    const email = (params.email ?? '').trim().toLowerCase();
    const status = (params.status ?? '').trim().toUpperCase();

    const filtered = this.mockCustomersSignal()
      .filter((customer) => {
        const haystack = [
          customer.fullName,
          customer.email,
          customer.phone,
          customer.address.city,
          customer.address.country,
        ]
          .join(' ')
          .toLowerCase();

        const matchesQuery = !query || haystack.includes(query);
        const matchesName = !name || customer.fullName.toLowerCase().includes(name);
        const matchesPhone = !phone || customer.phone.toLowerCase().includes(phone);
        const matchesEmail = !email || customer.email.toLowerCase() === email;
        const matchesStatus = !status || customer.status === status;

        return matchesQuery && matchesName && matchesPhone && matchesEmail && matchesStatus;
      })
      .sort((left, right) => {
        const rightDate = new Date(right.createdAt ?? 0).getTime();
        const leftDate = new Date(left.createdAt ?? 0).getTime();
        return rightDate - leftDate;
      });

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    const items = filtered.slice((safePage - 1) * limit, safePage * limit);

    return of({
      success: true,
      message: 'Customers loaded from mock workspace',
      data: {
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          pages,
        },
        source: 'mock' as CustomerSource,
      },
    }).pipe(
      delay(240),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private getCustomerMock(id: string): Observable<ApiResponse<Customer>> {
    const customer = this.mockCustomersSignal().find((entry) => entry.id === id);

    if (!customer) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Customer not found' },
          }),
      );
    }

    return of({
      success: true,
      message: 'Customer loaded from mock workspace',
      data: customer,
    }).pipe(
      delay(180),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private createCustomerMock(payload: CustomerUpsertPayload): Observable<ApiResponse<Customer>> {
    const timestamp = new Date().toISOString();
    const customer = this.normalizeCustomer(
      {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...this.toApiPayload(payload),
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: 'mock-workspace',
      },
      'mock',
    );

    this.mockCustomersSignal.update((customers) => [customer, ...customers]);

    return of({
      success: true,
      message: 'Customer created in mock workspace',
      data: customer,
    }).pipe(
      delay(200),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private updateCustomerMock(
    id: string,
    payload: CustomerUpsertPayload,
  ): Observable<ApiResponse<Customer>> {
    const existing = this.mockCustomersSignal().find((entry) => entry.id === id);

    if (!existing) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Customer not found' },
          }),
      );
    }

    const updated = this.normalizeCustomer(
      {
        ...existing,
        ...this.toApiPayload(payload),
        id,
        updatedAt: new Date().toISOString(),
      },
      'mock',
    );

    this.mockCustomersSignal.update((customers) =>
      customers.map((customer) => (customer.id === id ? updated : customer)),
    );

    return of({
      success: true,
      message: 'Customer updated in mock workspace',
      data: updated,
    }).pipe(
      delay(200),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private buildSearchParams(params: CustomerSearchParams): HttpParams {
    let httpParams = new HttpParams();

    const values: Record<string, string | number | undefined> = {
      q: params.q?.trim(),
      name: params.name?.trim(),
      phone: params.phone?.trim(),
      email: params.email?.trim(),
      status: params.status?.trim(),
      page: params.page ?? 1,
      limit: params.limit ?? 12,
    };

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, `${value}`);
      }
    });

    return httpParams;
  }

  private normalizeCustomer(raw: RawCustomer, source: CustomerSource): Customer {
    const firstName = (raw.firstName ?? '').trim();
    const lastName = (raw.lastName ?? '').trim();

    return {
      id: raw.id ?? raw._id ?? '',
      firstName,
      lastName,
      fullName: raw.fullName?.trim() || `${firstName} ${lastName}`.trim(),
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      address: this.normalizeAddress(raw.address),
      status: raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      authUserId: raw.authUserId ?? null,
      createdBy: raw.createdBy ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      source,
    };
  }

  private normalizeAddress(address?: Partial<CustomerAddress> | null): CustomerAddress {
    return {
      ...DEFAULT_ADDRESS,
      ...(address ?? {}),
    };
  }

  private normalizePagination(
    pagination: Partial<CustomerPagination> | undefined,
    fallbackLimit: number,
    fallbackTotal: number,
  ): CustomerPagination {
    const page = Math.max(1, Number(pagination?.page) || 1);
    const limit = Math.max(1, Number(pagination?.limit) || fallbackLimit);
    const total = Math.max(0, Number(pagination?.total) || fallbackTotal);
    const pages = Math.max(1, Number(pagination?.pages) || Math.ceil(total / limit) || 1);

    return {
      page,
      limit,
      total,
      pages,
    };
  }

  private toApiPayload(payload: CustomerUpsertPayload): CustomerUpsertPayload {
    const normalizedStatus: CustomerStatus = payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const email = payload.email?.trim();

    return {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      ...(email ? { email } : {}),
      phone: payload.phone.trim(),
      status: normalizedStatus,
      address: {
        street: payload.address.street.trim(),
        city: payload.address.city.trim(),
        state: payload.address.state.trim(),
        country: payload.address.country.trim(),
        zipCode: payload.address.zipCode.trim(),
      },
    };
  }

  private shouldUseMock(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
  }
}
