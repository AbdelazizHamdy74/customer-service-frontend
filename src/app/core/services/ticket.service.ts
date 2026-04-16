import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  AuditLogItem,
  CannedResponseItem,
  Ticket,
  TicketAssignPayload,
  TicketComment,
  TicketHistory,
  TicketPagination,
  TicketPriority,
  TicketSearchParams,
  TicketSearchResult,
  TicketSource,
  TicketStatus,
  TicketUpsertPayload,
} from '../models/ticket.model';

type RawTicket = Partial<Ticket> & {
  _id?: string;
  priority?: TicketPriority | string;
  slaDueAt?: string | Date | null;
  comments?: Partial<TicketComment>[];
  history?: Partial<TicketHistory>[];
};

type RawSearchResponse = {
  items?: RawTicket[];
  pagination?: Partial<TicketPagination> & { pages?: number };
};

type RawCanned = { _id?: string; id?: string; title?: string; body?: string; category?: string };

type RawAudit = {
  _id?: string;
  id?: string;
  action?: string;
  actorId?: string | null;
  actorRole?: string | null;
  resourceType?: string;
  resourceId?: string | null;
  meta?: unknown;
  createdAt?: string;
};

const MOCK_TICKETS: RawTicket[] = [
  {
    id: 'ticket-1001',
    subject: 'Unable to access account',
    description: 'Customer cannot log in to their account after password reset.',
    customerId: 'cust-1001',
    assignedAgentId: 'agent-1001',
    status: 'OPEN',
    comments: [
      {
        authorId: 'agent-1001',
        authorRole: 'AGENT',
        message: 'Please provide more details about the error message.',
        createdAt: '2026-04-01T10:00:00.000Z',
      },
    ],
    history: [
      {
        action: 'CREATED',
        actorId: 'cust-1001',
        actorRole: 'CUSTOMER',
        toStatus: 'OPEN',
        note: 'Ticket created',
        createdAt: '2026-04-01T09:00:00.000Z',
      },
    ],
    createdBy: 'cust-1001',
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'ticket-1002',
    subject: 'Billing inquiry',
    description: 'Question about recent charges on the bill.',
    customerId: 'cust-1002',
    assignedAgentId: 'agent-1002',
    status: 'IN_PROGRESS',
    comments: [],
    history: [
      {
        action: 'CREATED',
        actorId: 'cust-1002',
        actorRole: 'CUSTOMER',
        toStatus: 'OPEN',
        note: 'Ticket created',
        createdAt: '2026-03-30T14:00:00.000Z',
      },
      {
        action: 'STATUS_CHANGED',
        actorId: 'agent-1002',
        actorRole: 'AGENT',
        fromStatus: 'OPEN',
        toStatus: 'IN_PROGRESS',
        note: 'Started working on the inquiry',
        createdAt: '2026-03-31T11:00:00.000Z',
      },
    ],
    createdBy: 'cust-1002',
    createdAt: '2026-03-30T14:00:00.000Z',
    updatedAt: '2026-03-31T11:00:00.000Z',
  },
  {
    id: 'ticket-1003',
    subject: 'Feature request: Dark mode',
    description: 'Would like to have a dark mode option in the app.',
    customerId: 'cust-1003',
    status: 'WAITING_CUSTOMER',
    comments: [
      {
        authorId: 'agent-1003',
        authorRole: 'AGENT',
        message:
          'This is a great suggestion! Can you tell us more about how you would use dark mode?',
        createdAt: '2026-03-28T16:00:00.000Z',
      },
    ],
    history: [
      {
        action: 'CREATED',
        actorId: 'cust-1003',
        actorRole: 'CUSTOMER',
        toStatus: 'OPEN',
        note: 'Ticket created',
        createdAt: '2026-03-28T15:00:00.000Z',
      },
      {
        action: 'STATUS_CHANGED',
        actorId: 'agent-1003',
        actorRole: 'AGENT',
        fromStatus: 'OPEN',
        toStatus: 'WAITING_CUSTOMER',
        note: 'Waiting for more details',
        createdAt: '2026-03-28T16:00:00.000Z',
      },
    ],
    createdBy: 'cust-1003',
    createdAt: '2026-03-28T15:00:00.000Z',
    updatedAt: '2026-03-28T16:00:00.000Z',
  },
  {
    id: 'ticket-1004',
    subject: 'App crashes on startup',
    description: 'The app crashes immediately when trying to open it.',
    customerId: 'cust-1004',
    assignedAgentId: 'agent-1001',
    status: 'RESOLVED',
    comments: [
      {
        authorId: 'agent-1001',
        authorRole: 'AGENT',
        message: 'This was caused by a corrupted cache. Clearing the app data should fix it.',
        createdAt: '2026-03-25T12:00:00.000Z',
      },
    ],
    history: [
      {
        action: 'CREATED',
        actorId: 'cust-1004',
        actorRole: 'CUSTOMER',
        toStatus: 'OPEN',
        note: 'Ticket created',
        createdAt: '2026-03-24T09:00:00.000Z',
      },
      {
        action: 'ASSIGNED',
        actorId: 'agent-1001',
        actorRole: 'AGENT',
        note: 'Assigned to agent',
        createdAt: '2026-03-24T10:00:00.000Z',
      },
      {
        action: 'STATUS_CHANGED',
        actorId: 'agent-1001',
        actorRole: 'AGENT',
        fromStatus: 'OPEN',
        toStatus: 'RESOLVED',
        note: 'Issue resolved',
        createdAt: '2026-03-25T12:00:00.000Z',
      },
    ],
    createdBy: 'cust-1004',
    createdAt: '2026-03-24T09:00:00.000Z',
    updatedAt: '2026-03-25T12:00:00.000Z',
  },
  {
    id: 'ticket-1005',
    subject: 'Password reset not working',
    description: 'Reset link is not being sent to email.',
    customerId: 'cust-1005',
    status: 'CLOSED',
    comments: [],
    history: [
      {
        action: 'CREATED',
        actorId: 'cust-1005',
        actorRole: 'CUSTOMER',
        toStatus: 'OPEN',
        note: 'Ticket created',
        createdAt: '2026-03-20T08:00:00.000Z',
      },
      {
        action: 'STATUS_CHANGED',
        actorId: 'system',
        actorRole: 'SYSTEM',
        fromStatus: 'OPEN',
        toStatus: 'CLOSED',
        note: 'Auto-closed due to inactivity',
        createdAt: '2026-03-27T08:00:00.000Z',
      },
    ],
    createdBy: 'cust-1005',
    createdAt: '2026-03-20T08:00:00.000Z',
    updatedAt: '2026-03-27T08:00:00.000Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly apiUrl = `${environment.apiUrl}/tickets`;
  private readonly usingMockSignal = signal(false);

  constructor(private readonly http: HttpClient) {}

  usingMock() {
    return this.usingMockSignal.asReadonly();
  }

  search(params: TicketSearchParams = {}): Observable<TicketSearchResult> {
    const httpParams = this.buildSearchParams(params);

    return this.http
      .get<ApiResponse<RawSearchResponse>>(`${this.apiUrl}/filter`, { params: httpParams })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0 || error.status >= 500) {
            this.usingMockSignal.set(true);
            return this.mockSearch(params);
          }
          return throwError(() => error);
        }),
        map((response) =>
          this.transformSearchResponse(
            response.data || {
              items: [],
              pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            },
          ),
        ),
        tap(() => this.usingMockSignal.set(false)),
      );
  }

  getById(id: string): Observable<Ticket> {
    return this.http.get<ApiResponse<RawTicket>>(`${this.apiUrl}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0 || error.status >= 500) {
          this.usingMockSignal.set(true);
          return this.mockGetById(id);
        }
        return throwError(() => error);
      }),
      map((response) => this.transformTicket(response.data || {})),
      tap(() => this.usingMockSignal.set(false)),
    );
  }

  create(payload: TicketUpsertPayload): Observable<Ticket> {
    return this.http
      .post<ApiResponse<RawTicket>>(this.apiUrl, payload)
      .pipe(map((response) => this.transformTicket(response.data || {})));
  }

  update(id: string, payload: Partial<TicketUpsertPayload>): Observable<Ticket> {
    return this.http
      .put<ApiResponse<RawTicket>>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.transformTicket(response.data || {})));
  }

  assign(id: string, payload: TicketAssignPayload): Observable<Ticket> {
    return this.http
      .put<ApiResponse<RawTicket>>(`${this.apiUrl}/${id}/assign`, payload)
      .pipe(map((response) => this.transformTicket(response.data || {})));
  }

  addComment(id: string, message: string): Observable<TicketComment> {
    return this.http
      .post<ApiResponse<Partial<TicketComment> & { _id?: string }>>(
        `${this.apiUrl}/${id}/comments`,
        { message },
      )
      .pipe(
        map((response) => ({
          authorId: response.data?.authorId ?? null,
          authorRole: response.data?.authorRole || 'SYSTEM',
          message: response.data?.message || '',
          createdAt: response.data?.createdAt || new Date().toISOString(),
        })),
      );
  }

  listCannedResponses(category?: string): Observable<CannedResponseItem[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http
      .get<ApiResponse<{ items?: RawCanned[] }>>(`${this.apiUrl}/canned-responses`, { params })
      .pipe(map((res) => (res.data?.items || []).map((c) => this.transformCanned(c))));
  }

  getAuditLogs(page = 1, limit = 50): Observable<{ items: AuditLogItem[]; pagination: TicketPagination }> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http
      .get<ApiResponse<{ items?: RawAudit[]; pagination?: Partial<TicketPagination> & { pages?: number } }>>(
        `${this.apiUrl}/audit-logs`,
        { params },
      )
      .pipe(
        map((res) => ({
          items: (res.data?.items || []).map((a) => this.transformAudit(a)),
          pagination: {
            page: res.data?.pagination?.page || page,
            limit: res.data?.pagination?.limit || limit,
            total: res.data?.pagination?.total || 0,
            totalPages:
              res.data?.pagination?.totalPages ??
              res.data?.pagination?.pages ??
              0,
          },
        })),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => undefined));
  }

  private buildSearchParams(params: TicketSearchParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.subject) httpParams = httpParams.set('subject', params.subject);
    if (params.customerId) httpParams = httpParams.set('customerId', params.customerId);
    if (params.assignedAgentId)
      httpParams = httpParams.set('assignedAgentId', params.assignedAgentId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.overdue !== undefined && params.overdue !== '') {
      const o = params.overdue === true || params.overdue === 'true' || params.overdue === '1';
      if (o) httpParams = httpParams.set('overdue', 'true');
    }
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return httpParams;
  }

  private mockSearch(params: TicketSearchParams): Observable<ApiResponse<RawSearchResponse>> {
    return of(true).pipe(
      delay(500),
      map(() => {
        let filteredTickets = [...MOCK_TICKETS];

        if (params.q) {
          const query = params.q.toLowerCase();
          filteredTickets = filteredTickets.filter(
            (ticket) =>
              ticket.subject?.toLowerCase().includes(query) ||
              ticket.description?.toLowerCase().includes(query),
          );
        }

        if (params.status) {
          filteredTickets = filteredTickets.filter((ticket) => ticket.status === params.status);
        }

        if (params.customerId) {
          filteredTickets = filteredTickets.filter(
            (ticket) => ticket.customerId === params.customerId,
          );
        }

        if (params.assignedAgentId) {
          filteredTickets = filteredTickets.filter(
            (ticket) => ticket.assignedAgentId === params.assignedAgentId,
          );
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

        return {
          success: true,
          message: 'Mock data loaded successfully',
          data: {
            items: paginatedTickets,
            pagination: {
              page,
              limit,
              total: filteredTickets.length,
              totalPages: Math.ceil(filteredTickets.length / limit),
            },
          },
        };
      }),
    );
  }

  private mockGetById(id: string): Observable<ApiResponse<RawTicket>> {
    return of(true).pipe(
      delay(300),
      map(() => {
        const ticket = MOCK_TICKETS.find((t) => t.id === id);
        if (!ticket) {
          throw new Error('Ticket not found');
        }
        return {
          success: true,
          message: 'Mock ticket loaded successfully',
          data: ticket,
        };
      }),
    );
  }

  private transformSearchResponse(response: RawSearchResponse): TicketSearchResult {
    const tickets = (response.items || []).map((item) => this.transformTicket(item));
    const totalPages =
      response.pagination?.totalPages ??
      response.pagination?.pages ??
      (response.pagination?.total && response.pagination?.limit
        ? Math.ceil(response.pagination.total / response.pagination.limit)
        : 0);
    const pagination = {
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 10,
      total: response.pagination?.total || 0,
      totalPages,
    };

    return { tickets, pagination };
  }

  private transformCanned(raw: RawCanned): CannedResponseItem {
    const id = String(raw._id || raw.id || '');
    return {
      id,
      title: raw.title || '',
      body: raw.body || '',
      category: raw.category || 'general',
    };
  }

  private transformAudit(raw: RawAudit): AuditLogItem {
    return {
      id: String(raw._id || raw.id || ''),
      action: raw.action || '',
      actorId: raw.actorId ?? null,
      actorRole: raw.actorRole ?? null,
      resourceType: raw.resourceType || '',
      resourceId: raw.resourceId ?? null,
      meta: raw.meta,
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  }

  private transformTicket(raw: RawTicket): Ticket {
    const p = raw.priority as TicketPriority | undefined;
    const sla =
      raw.slaDueAt === undefined || raw.slaDueAt === null
        ? null
        : typeof raw.slaDueAt === 'string'
          ? raw.slaDueAt
          : new Date(raw.slaDueAt as unknown as Date).toISOString();

    return {
      id: raw._id || raw.id || '',
      subject: raw.subject || '',
      description: raw.description || '',
      customerId: raw.customerId || '',
      assignedAgentId: raw.assignedAgentId || null,
      status: (raw.status as TicketStatus) || 'OPEN',
      priority: p || 'MEDIUM',
      slaDueAt: sla,
      comments: (raw.comments || []).map((c) => ({
        authorId: c.authorId || null,
        authorRole: c.authorRole || 'SYSTEM',
        message: c.message || '',
        createdAt: c.createdAt || new Date().toISOString(),
      })),
      history: (raw.history || []).map((h) => ({
        action: h.action || '',
        actorId: h.actorId || null,
        actorRole: h.actorRole || 'SYSTEM',
        fromStatus: h.fromStatus || null,
        toStatus: h.toStatus || null,
        note: h.note || '',
        meta: h.meta || null,
        createdAt: h.createdAt || new Date().toISOString(),
      })),
      createdBy: raw.createdBy || null,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      source: 'api',
    };
  }
}

