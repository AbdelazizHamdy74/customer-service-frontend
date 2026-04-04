export type CustomerStatus = 'ACTIVE' | 'INACTIVE';
export type CustomerSource = 'api' | 'mock';

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address: CustomerAddress;
  status: CustomerStatus;
  authUserId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  source: CustomerSource;
}

export interface CustomerUpsertPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  status?: CustomerStatus;
  address: CustomerAddress;
}

export interface CustomerSearchParams {
  q?: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: CustomerStatus | '';
  page?: number;
  limit?: number;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CustomerSearchResult {
  items: Customer[];
  pagination: CustomerPagination;
  source: CustomerSource;
}
