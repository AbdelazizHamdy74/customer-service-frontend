import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import {
  Agent,
  AgentInvitePayload,
  AgentInviteResult,
  AgentPagination,
  AgentPerformanceReport,
  AgentPerformanceReportItem,
  AgentPerformanceReportParams,
  AgentPerformanceSnapshot,
  AgentPerformanceSnapshotResponse,
  AgentRole,
  AgentSearchFilters,
  AgentSearchParams,
  AgentSearchResult,
  AgentSource,
  AgentUpsertPayload,
} from '../models/agent.model';

type RawAgent = Partial<Omit<Agent, 'fullName' | 'source'>> & {
  _id?: string;
  fullName?: string;
  performance?: Partial<AgentPerformanceSnapshot> | null;
  skills?: string[] | null;
};

type RawSearchResponse = {
  items?: RawAgent[];
  pagination?: Partial<AgentPagination>;
  filters?: Partial<AgentSearchFilters>;
};

type RawInviteResult = Partial<AgentInviteResult>;

type RawPerformanceSnapshotResponse = {
  agentId?: string;
  name?: string;
  role?: string;
  performance?: Partial<AgentPerformanceSnapshot> | null;
};

type RawPerformanceReportItem = Partial<AgentPerformanceReportItem> & {
  snapshotPerformance?: Partial<AgentPerformanceSnapshot> | null;
};

type RawPerformanceReport = {
  report?: string;
  period?: Partial<AgentPerformanceReport['period']>;
  filters?: Partial<AgentPerformanceReport['filters']>;
  summary?: Partial<AgentPerformanceReport['summary']>;
  items?: RawPerformanceReportItem[];
  generatedAt?: string;
};

const DEFAULT_FILTERS: AgentSearchFilters = {
  q: '',
  role: '',
  status: '',
  team: '',
  skill: '',
};

const DEFAULT_PERFORMANCE: AgentPerformanceSnapshot = {
  ticketsHandled: 0,
  ticketsResolved: 0,
  avgResponseTimeMinutes: 0,
  avgResolutionTimeMinutes: 0,
  customerSatisfaction: 0,
  lastActiveAt: null,
  lastUpdatedAt: null,
  resolutionRate: 0,
};

const MOCK_AGENTS: RawAgent[] = [
  {
    id: 'agt-2001',
    firstName: 'Nour',
    lastName: 'Selim',
    email: 'nour.selim@example.com',
    phone: '+20 101 334 2100',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
    team: 'Billing Escalations',
    skills: ['Escalations', 'VIP accounts', 'Renewals'],
    performance: {
      ticketsHandled: 82,
      ticketsResolved: 74,
      avgResponseTimeMinutes: 9,
      avgResolutionTimeMinutes: 38,
      customerSatisfaction: 4.8,
      lastActiveAt: '2026-04-06T09:45:00.000Z',
      lastUpdatedAt: '2026-04-06T09:50:00.000Z',
    },
    authUserId: 'auth-2001',
    createdBy: 'seed',
    createdAt: '2026-03-09T08:20:00.000Z',
    updatedAt: '2026-04-05T13:15:00.000Z',
  },
  {
    id: 'agt-2002',
    firstName: 'Mostafa',
    lastName: 'Adham',
    email: 'mostafa.adham@example.com',
    phone: '+20 100 882 5541',
    role: 'AGENT',
    status: 'ACTIVE',
    team: 'Billing',
    skills: ['Refunds', 'Invoices', 'Cross-sell'],
    performance: {
      ticketsHandled: 96,
      ticketsResolved: 88,
      avgResponseTimeMinutes: 11,
      avgResolutionTimeMinutes: 42,
      customerSatisfaction: 4.6,
      lastActiveAt: '2026-04-06T10:12:00.000Z',
      lastUpdatedAt: '2026-04-06T10:20:00.000Z',
    },
    authUserId: 'auth-2002',
    createdBy: 'seed',
    createdAt: '2026-03-11T10:10:00.000Z',
    updatedAt: '2026-04-05T17:05:00.000Z',
  },
  {
    id: 'agt-2003',
    firstName: 'Farah',
    lastName: 'Tarek',
    email: 'farah.tarek@example.com',
    phone: '+20 127 501 3320',
    role: 'AGENT',
    status: 'ACTIVE',
    team: 'Onboarding',
    skills: ['Welcome calls', 'KYC', 'Account setup'],
    performance: {
      ticketsHandled: 64,
      ticketsResolved: 58,
      avgResponseTimeMinutes: 8,
      avgResolutionTimeMinutes: 29,
      customerSatisfaction: 4.9,
      lastActiveAt: '2026-04-06T08:55:00.000Z',
      lastUpdatedAt: '2026-04-06T09:00:00.000Z',
    },
    authUserId: 'auth-2003',
    createdBy: 'seed',
    createdAt: '2026-03-14T12:25:00.000Z',
    updatedAt: '2026-04-04T16:40:00.000Z',
  },
  {
    id: 'agt-2004',
    firstName: 'Alya',
    lastName: 'Maged',
    email: 'alya.maged@example.com',
    phone: '+20 110 770 9184',
    role: 'AGENT',
    status: 'INACTIVE',
    team: 'Technical Support',
    skills: ['Connectivity', 'Diagnostics'],
    performance: {
      ticketsHandled: 41,
      ticketsResolved: 36,
      avgResponseTimeMinutes: 14,
      avgResolutionTimeMinutes: 51,
      customerSatisfaction: 4.1,
      lastActiveAt: '2026-04-03T14:10:00.000Z',
      lastUpdatedAt: '2026-04-03T14:30:00.000Z',
    },
    authUserId: 'auth-2004',
    createdBy: 'seed',
    createdAt: '2026-03-20T09:40:00.000Z',
    updatedAt: '2026-04-03T14:30:00.000Z',
  },
  {
    id: 'agt-2005',
    firstName: 'Kareem',
    lastName: 'Raouf',
    email: 'kareem.raouf@example.com',
    phone: '+20 111 904 2235',
    role: 'ADMIN',
    status: 'ACTIVE',
    team: 'Operations',
    skills: ['Workforce planning', 'QA', 'Escalations'],
    performance: {
      ticketsHandled: 27,
      ticketsResolved: 25,
      avgResponseTimeMinutes: 7,
      avgResolutionTimeMinutes: 24,
      customerSatisfaction: 4.7,
      lastActiveAt: '2026-04-06T07:30:00.000Z',
      lastUpdatedAt: '2026-04-06T08:00:00.000Z',
    },
    authUserId: 'auth-2005',
    createdBy: 'seed',
    createdAt: '2026-03-04T11:15:00.000Z',
    updatedAt: '2026-04-06T08:00:00.000Z',
  },
  {
    id: 'agt-2006',
    firstName: 'Maha',
    lastName: 'Essam',
    email: 'maha.essam@example.com',
    phone: '+20 122 660 4014',
    role: 'AGENT',
    status: 'ACTIVE',
    team: 'Retention',
    skills: ['Renewals', 'Save offers', 'Follow-up'],
    performance: {
      ticketsHandled: 73,
      ticketsResolved: 62,
      avgResponseTimeMinutes: 12,
      avgResolutionTimeMinutes: 46,
      customerSatisfaction: 4.4,
      lastActiveAt: '2026-04-06T10:05:00.000Z',
      lastUpdatedAt: '2026-04-06T10:09:00.000Z',
    },
    authUserId: 'auth-2006',
    createdBy: 'seed',
    createdAt: '2026-03-18T15:30:00.000Z',
    updatedAt: '2026-04-05T18:10:00.000Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private readonly apiUrl = `${environment.apiUrl}/agents`;
  private readonly inviteUrl = `${environment.authServiceUrl}/invite/agent`;
  private readonly reportUrl = `${environment.apiUrl}/reports/agent-performance`;
  private readonly usingMockSignal = signal(false);
  private readonly mockAgentsSignal = signal(
    MOCK_AGENTS.map((agent) => this.normalizeAgent(agent, 'mock')),
  );

  readonly usingMock$ = this.usingMockSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  searchAgents(params: AgentSearchParams): Observable<ApiResponse<AgentSearchResult>> {
    return this.http
      .get<ApiResponse<RawSearchResponse>>(`${this.apiUrl}/search`, {
        params: this.buildSearchParams(params),
      })
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: {
            items: (response.data?.items ?? []).map((agent) => this.normalizeAgent(agent, 'api')),
            pagination: this.normalizePagination(
              response.data?.pagination,
              params.limit ?? 12,
              (response.data?.items ?? []).length,
            ),
            filters: this.normalizeFilters(response.data?.filters, params),
            source: 'api' as AgentSource,
          },
        })),
        catchError((error) =>
          this.shouldUseMock(error) ? this.searchAgentsMock(params) : throwError(() => error),
        ),
      );
  }

  getAgent(id: string): Observable<ApiResponse<Agent>> {
    return this.http.get<ApiResponse<RawAgent>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.usingMockSignal.set(false)),
      map((response) => ({
        ...response,
        data: response.data ? this.normalizeAgent(response.data, 'api') : undefined,
      })),
      catchError((error) =>
        this.shouldUseMock(error) ? this.getAgentMock(id) : throwError(() => error),
      ),
    ) as Observable<ApiResponse<Agent>>;
  }

  createAgent(payload: AgentUpsertPayload): Observable<ApiResponse<Agent>> {
    return this.http.post<ApiResponse<RawAgent>>(this.apiUrl, this.toApiPayload(payload)).pipe(
      tap(() => this.usingMockSignal.set(false)),
      map((response) => ({
        ...response,
        data: response.data ? this.normalizeAgent(response.data, 'api') : undefined,
      })),
      catchError((error) =>
        this.shouldUseMock(error) ? this.createAgentMock(payload) : throwError(() => error),
      ),
    ) as Observable<ApiResponse<Agent>>;
  }

  inviteAgent(payload: AgentInvitePayload): Observable<ApiResponse<AgentInviteResult>> {
    return this.http
      .post<ApiResponse<RawInviteResult>>(this.inviteUrl, this.toInvitePayload(payload))
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: this.normalizeInviteResult(response.data),
        })),
        catchError((error) =>
          this.shouldUseMock(error) ? this.inviteAgentMock(payload) : throwError(() => error),
        ),
      ) as Observable<ApiResponse<AgentInviteResult>>;
  }

  updateAgent(id: string, payload: AgentUpsertPayload): Observable<ApiResponse<Agent>> {
    return this.http
      .put<ApiResponse<RawAgent>>(`${this.apiUrl}/${id}`, this.toApiPayload(payload))
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: response.data ? this.normalizeAgent(response.data, 'api') : undefined,
        })),
        catchError((error) =>
          this.shouldUseMock(error) ? this.updateAgentMock(id, payload) : throwError(() => error),
        ),
      ) as Observable<ApiResponse<Agent>>;
  }

  assignRole(id: string, role: AgentRole): Observable<ApiResponse<Agent>> {
    return this.http.put<ApiResponse<RawAgent>>(`${this.apiUrl}/${id}/role`, { role }).pipe(
      tap(() => this.usingMockSignal.set(false)),
      map((response) => ({
        ...response,
        data: response.data ? this.normalizeAgent(response.data, 'api') : undefined,
      })),
      catchError((error) =>
        this.shouldUseMock(error) ? this.assignRoleMock(id, role) : throwError(() => error),
      ),
    ) as Observable<ApiResponse<Agent>>;
  }

  getAgentPerformanceSnapshot(
    id: string,
  ): Observable<ApiResponse<AgentPerformanceSnapshotResponse>> {
    return this.http
      .get<ApiResponse<RawPerformanceSnapshotResponse>>(`${this.apiUrl}/${id}/performance`)
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: this.normalizePerformanceSnapshotResponse(response.data, 'api', id),
        })),
        catchError((error) =>
          this.shouldUseMock(error)
            ? this.getAgentPerformanceSnapshotMock(id)
            : throwError(() => error),
        ),
      ) as Observable<ApiResponse<AgentPerformanceSnapshotResponse>>;
  }

  getAgentPerformanceReport(
    params: AgentPerformanceReportParams,
  ): Observable<ApiResponse<AgentPerformanceReport>> {
    return this.http
      .get<ApiResponse<RawPerformanceReport>>(this.reportUrl, {
        params: this.buildPerformanceParams(params),
      })
      .pipe(
        tap(() => this.usingMockSignal.set(false)),
        map((response) => ({
          ...response,
          data: this.normalizePerformanceReport(response.data, 'api', params),
        })),
        catchError((error) =>
          this.shouldUseMock(error)
            ? this.getAgentPerformanceReportMock(params)
            : throwError(() => error),
        ),
      ) as Observable<ApiResponse<AgentPerformanceReport>>;
  }

  private searchAgentsMock(params: AgentSearchParams): Observable<ApiResponse<AgentSearchResult>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 12);
    const query = (params.q ?? '').trim().toLowerCase();
    const role = (params.role ?? '').trim().toUpperCase();
    const status = (params.status ?? '').trim().toUpperCase();
    const team = (params.team ?? '').trim().toLowerCase();
    const skill = (params.skill ?? '').trim().toLowerCase();

    const filtered = this.mockAgentsSignal()
      .filter((agent) => {
        const haystack = [
          agent.fullName,
          agent.email,
          agent.phone,
          agent.team,
          agent.skills.join(' '),
        ]
          .join(' ')
          .toLowerCase();

        const matchesQuery = !query || haystack.includes(query);
        const matchesRole = !role || agent.role === role;
        const matchesStatus = !status || agent.status === status;
        const matchesTeam = !team || agent.team.toLowerCase().includes(team);
        const matchesSkill =
          !skill || agent.skills.some((entry) => entry.toLowerCase().includes(skill));

        return matchesQuery && matchesRole && matchesStatus && matchesTeam && matchesSkill;
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
      message: 'Agents loaded from mock workspace',
      data: {
        items,
        pagination: {
          page: safePage,
          limit,
          total,
          pages,
        },
        filters: this.normalizeFilters(undefined, params),
        source: 'mock' as AgentSource,
      },
    }).pipe(
      delay(220),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private getAgentMock(id: string): Observable<ApiResponse<Agent>> {
    const agent = this.mockAgentsSignal().find((entry) => entry.id === id);

    if (!agent) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Agent not found' },
          }),
      );
    }

    return of({
      success: true,
      message: 'Agent loaded from mock workspace',
      data: agent,
    }).pipe(
      delay(180),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private createAgentMock(payload: AgentUpsertPayload): Observable<ApiResponse<Agent>> {
    const timestamp = new Date().toISOString();
    const agent = this.normalizeAgent(
      {
        id: `mock-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...this.toApiPayload(payload),
        authUserId: null,
        createdBy: 'mock-workspace',
        createdAt: timestamp,
        updatedAt: timestamp,
        performance: {
          ...DEFAULT_PERFORMANCE,
          lastUpdatedAt: timestamp,
        },
      },
      'mock',
    );

    this.mockAgentsSignal.update((agents) => [agent, ...agents]);

    return of({
      success: true,
      message: 'Agent created in mock workspace',
      data: agent,
    }).pipe(
      delay(200),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private inviteAgentMock(payload: AgentInvitePayload): Observable<ApiResponse<AgentInviteResult>> {
    const timestamp = new Date();
    const expiresAt = new Date(timestamp.getTime() + 10 * 60 * 1000).toISOString();
    const userId = `mock-auth-${Date.now()}`;
    const inviteToken = `mock-${Math.random().toString(36).slice(2, 10)}`;

    const agent = this.normalizeAgent(
      {
        id: `mock-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...this.toApiPayload(payload),
        authUserId: userId,
        createdBy: 'mock-invite',
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
        performance: {
          ...DEFAULT_PERFORMANCE,
          lastUpdatedAt: timestamp.toISOString(),
        },
      },
      'mock',
    );

    this.mockAgentsSignal.update((agents) => [agent, ...agents]);

    return of({
      success: true,
      message: 'Agent invited in mock workspace',
      data: {
        userId,
        inviteToken,
        inviteTokenExpiresAt: expiresAt,
      },
    }).pipe(
      delay(240),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private updateAgentMock(id: string, payload: AgentUpsertPayload): Observable<ApiResponse<Agent>> {
    const existing = this.mockAgentsSignal().find((entry) => entry.id === id);

    if (!existing) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Agent not found' },
          }),
      );
    }

    const updated = this.normalizeAgent(
      {
        ...existing,
        ...this.toApiPayload(payload),
        id,
        updatedAt: new Date().toISOString(),
      },
      'mock',
    );

    this.mockAgentsSignal.update((agents) =>
      agents.map((agent) => (agent.id === id ? updated : agent)),
    );

    return of({
      success: true,
      message: 'Agent updated in mock workspace',
      data: updated,
    }).pipe(
      delay(180),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private assignRoleMock(id: string, role: AgentRole): Observable<ApiResponse<Agent>> {
    const existing = this.mockAgentsSignal().find((entry) => entry.id === id);

    if (!existing) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Agent not found' },
          }),
      );
    }

    const updated = this.normalizeAgent(
      {
        ...existing,
        role,
        updatedAt: new Date().toISOString(),
      },
      'mock',
    );

    this.mockAgentsSignal.update((agents) =>
      agents.map((agent) => (agent.id === id ? updated : agent)),
    );

    return of({
      success: true,
      message: 'Agent role updated in mock workspace',
      data: updated,
    }).pipe(
      delay(140),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private getAgentPerformanceSnapshotMock(
    id: string,
  ): Observable<ApiResponse<AgentPerformanceSnapshotResponse>> {
    const agent = this.mockAgentsSignal().find((entry) => entry.id === id);

    if (!agent) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Agent not found' },
          }),
      );
    }

    return of({
      success: true,
      message: 'Agent performance loaded from mock workspace',
      data: {
        agentId: agent.id,
        name: agent.fullName,
        role: agent.role,
        performance: {
          ...agent.performance,
          resolutionRate: this.computeResolutionRate(
            agent.performance.ticketsHandled,
            agent.performance.ticketsResolved,
          ),
        },
        source: 'mock' as AgentSource,
      },
    }).pipe(
      delay(160),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private getAgentPerformanceReportMock(
    params: AgentPerformanceReportParams,
  ): Observable<ApiResponse<AgentPerformanceReport>> {
    const agent = this.mockAgentsSignal().find((entry) => entry.id === params.agentId);

    if (!agent) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { message: 'Agent not found' },
          }),
      );
    }

    const ticketsAssigned = Math.max(
      agent.performance.ticketsHandled,
      agent.performance.ticketsResolved + (agent.status === 'ACTIVE' ? 6 : 3),
    );
    const ticketsClosed = agent.performance.ticketsResolved;
    const ticketsReopened = Math.max(0, Math.round(ticketsAssigned * 0.08));
    const currentOpenTickets = Math.max(0, ticketsAssigned - ticketsClosed);

    const item: AgentPerformanceReportItem = {
      agentId: agent.id,
      name: agent.fullName,
      role: agent.role,
      status: agent.status,
      team: agent.team,
      isDeleted: false,
      ticketsAssigned,
      ticketsClosed,
      ticketsReopened,
      currentOpenTickets,
      resolutionRate: this.computeResolutionRate(ticketsAssigned, ticketsClosed),
      averageResolutionTimeMinutes: agent.performance.avgResolutionTimeMinutes,
      snapshotPerformance: {
        ...agent.performance,
        resolutionRate: this.computeResolutionRate(
          agent.performance.ticketsHandled,
          agent.performance.ticketsResolved,
        ),
      },
    };

    const report = this.normalizePerformanceReport(
      {
        report: 'agentPerformance',
        period: {
          startDate: params.startDate || this.defaultStartDate(30),
          endDate: params.endDate || this.todayDate(),
        },
        filters: {
          agentId: agent.id,
        },
        summary: {
          totalAgents: 1,
          totalAssignedTickets: item.ticketsAssigned,
          totalClosedTickets: item.ticketsClosed,
          totalOpenTickets: item.currentOpenTickets,
        },
        items: [item],
        generatedAt: new Date().toISOString(),
      },
      'mock',
      params,
    );

    return of({
      success: true,
      message: 'Agent performance report loaded from mock workspace',
      data: report,
    }).pipe(
      delay(200),
      tap(() => this.usingMockSignal.set(true)),
    );
  }

  private buildSearchParams(params: AgentSearchParams): HttpParams {
    let httpParams = new HttpParams();

    const values: Record<string, string | number | undefined> = {
      q: params.q?.trim(),
      role: params.role?.trim(),
      status: params.status?.trim(),
      team: params.team?.trim(),
      skill: params.skill?.trim(),
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

  private buildPerformanceParams(params: AgentPerformanceReportParams): HttpParams {
    let httpParams = new HttpParams().set('agentId', params.agentId);

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }

    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return httpParams;
  }

  private normalizeAgent(raw: RawAgent, source: AgentSource): Agent {
    const firstName = (raw.firstName ?? '').trim();
    const lastName = (raw.lastName ?? '').trim();
    const ticketsHandled = Number(raw.performance?.ticketsHandled ?? 0);
    const ticketsResolved = Number(raw.performance?.ticketsResolved ?? 0);

    return {
      id: raw.id ?? raw._id ?? '',
      firstName,
      lastName,
      fullName: raw.fullName?.trim() || `${firstName} ${lastName}`.trim(),
      email: raw.email ?? '',
      phone: raw.phone ?? '',
      role: this.normalizeRole(raw.role),
      status: raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      team: raw.team?.trim() ?? '',
      skills: Array.isArray(raw.skills) ? raw.skills.filter(Boolean) : [],
      performance: {
        ...this.normalizePerformance(raw.performance),
        resolutionRate: this.computeResolutionRate(ticketsHandled, ticketsResolved),
      },
      authUserId: raw.authUserId ?? null,
      createdBy: raw.createdBy ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      source,
    };
  }

  private normalizeFilters(
    filters: Partial<AgentSearchFilters> | undefined,
    params: AgentSearchParams,
  ): AgentSearchFilters {
    const role =
      filters?.role === 'ADMIN' || filters?.role === 'SUPERVISOR' || filters?.role === 'AGENT'
        ? filters.role
        : params.role === 'ADMIN' || params.role === 'SUPERVISOR' || params.role === 'AGENT'
          ? params.role
          : '';

    return {
      q: filters?.q?.trim() ?? params.q?.trim() ?? DEFAULT_FILTERS.q,
      role,
      status:
        filters?.status === 'ACTIVE' || filters?.status === 'INACTIVE'
          ? filters.status
          : params.status === 'ACTIVE' || params.status === 'INACTIVE'
            ? params.status
            : '',
      team: filters?.team?.trim() ?? params.team?.trim() ?? DEFAULT_FILTERS.team,
      skill: filters?.skill?.trim() ?? params.skill?.trim() ?? DEFAULT_FILTERS.skill,
    };
  }

  private normalizePagination(
    pagination: Partial<AgentPagination> | undefined,
    fallbackLimit: number,
    fallbackTotal: number,
  ): AgentPagination {
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

  private normalizePerformance(
    performance?: Partial<AgentPerformanceSnapshot> | null,
  ): AgentPerformanceSnapshot {
    const ticketsHandled = Number(
      performance?.ticketsHandled ?? DEFAULT_PERFORMANCE.ticketsHandled,
    );
    const ticketsResolved = Number(
      performance?.ticketsResolved ?? DEFAULT_PERFORMANCE.ticketsResolved,
    );

    return {
      ticketsHandled,
      ticketsResolved,
      avgResponseTimeMinutes: Number(
        performance?.avgResponseTimeMinutes ?? DEFAULT_PERFORMANCE.avgResponseTimeMinutes,
      ),
      avgResolutionTimeMinutes: Number(
        performance?.avgResolutionTimeMinutes ?? DEFAULT_PERFORMANCE.avgResolutionTimeMinutes,
      ),
      customerSatisfaction: Number(
        performance?.customerSatisfaction ?? DEFAULT_PERFORMANCE.customerSatisfaction,
      ),
      lastActiveAt: performance?.lastActiveAt ?? DEFAULT_PERFORMANCE.lastActiveAt,
      lastUpdatedAt: performance?.lastUpdatedAt ?? DEFAULT_PERFORMANCE.lastUpdatedAt,
      resolutionRate: this.computeResolutionRate(ticketsHandled, ticketsResolved),
    };
  }

  private normalizeInviteResult(raw?: RawInviteResult): AgentInviteResult {
    return {
      userId: raw?.userId ?? '',
      inviteToken: raw?.inviteToken ?? '',
      inviteTokenExpiresAt: raw?.inviteTokenExpiresAt ?? new Date().toISOString(),
    };
  }

  private normalizePerformanceSnapshotResponse(
    raw: RawPerformanceSnapshotResponse | undefined,
    source: AgentSource,
    fallbackAgentId: string,
  ): AgentPerformanceSnapshotResponse {
    return {
      agentId: raw?.agentId ?? fallbackAgentId,
      name: raw?.name?.trim() ?? 'Agent',
      role: this.normalizeRole(raw?.role),
      performance: this.normalizePerformance(raw?.performance),
      source,
    };
  }

  private normalizePerformanceReport(
    raw: RawPerformanceReport | undefined,
    source: AgentSource,
    params: AgentPerformanceReportParams,
  ): AgentPerformanceReport {
    const items = (raw?.items ?? []).map((item) => this.normalizePerformanceReportItem(item));
    const totalAssignedTickets = items.reduce((sum, item) => sum + item.ticketsAssigned, 0);
    const totalClosedTickets = items.reduce((sum, item) => sum + item.ticketsClosed, 0);
    const totalOpenTickets = items.reduce((sum, item) => sum + item.currentOpenTickets, 0);

    return {
      report: raw?.report ?? 'agentPerformance',
      period: {
        startDate: raw?.period?.startDate ?? params.startDate ?? this.defaultStartDate(30),
        endDate: raw?.period?.endDate ?? params.endDate ?? this.todayDate(),
      },
      filters: {
        agentId: raw?.filters?.agentId ?? params.agentId ?? null,
      },
      summary: {
        totalAgents: Number(raw?.summary?.totalAgents) || items.length,
        totalAssignedTickets: Number(raw?.summary?.totalAssignedTickets) || totalAssignedTickets,
        totalClosedTickets: Number(raw?.summary?.totalClosedTickets) || totalClosedTickets,
        totalOpenTickets: Number(raw?.summary?.totalOpenTickets) || totalOpenTickets,
      },
      items,
      generatedAt: raw?.generatedAt ?? new Date().toISOString(),
      source,
    };
  }

  private normalizePerformanceReportItem(
    item: RawPerformanceReportItem,
  ): AgentPerformanceReportItem {
    const ticketsAssigned = Number(item.ticketsAssigned ?? 0);
    const ticketsClosed = Number(item.ticketsClosed ?? 0);

    return {
      agentId: item.agentId ?? '',
      name: item.name?.trim() ?? 'Agent',
      role: this.normalizeRole(item.role),
      status: item.status === 'ACTIVE' || item.status === 'INACTIVE' ? item.status : 'UNKNOWN',
      team: item.team?.trim() ?? '',
      isDeleted: Boolean(item.isDeleted),
      ticketsAssigned,
      ticketsClosed,
      ticketsReopened: Number(item.ticketsReopened ?? 0),
      currentOpenTickets: Number(item.currentOpenTickets ?? 0),
      resolutionRate:
        Number(item.resolutionRate) || this.computeResolutionRate(ticketsAssigned, ticketsClosed),
      averageResolutionTimeMinutes: Number(item.averageResolutionTimeMinutes ?? 0),
      snapshotPerformance: this.normalizePerformance(item.snapshotPerformance),
    };
  }

  private toApiPayload(payload: AgentUpsertPayload): AgentUpsertPayload {
    const email = payload.email?.trim();

    return {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      ...(email ? { email } : {}),
      phone: payload.phone.trim(),
      role: this.normalizeRole(payload.role),
      status: payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      team: payload.team?.trim() ?? '',
      skills: payload.skills.map((skill) => skill.trim()).filter(Boolean),
    };
  }

  private toInvitePayload(payload: AgentInvitePayload): AgentInvitePayload {
    return {
      ...this.toApiPayload(payload),
      email: payload.email.trim(),
    };
  }

  private normalizeRole(role: unknown): AgentRole {
    if (role === 'ADMIN' || role === 'SUPERVISOR') {
      return role;
    }

    return 'AGENT';
  }

  private computeResolutionRate(ticketsHandled: number, ticketsResolved: number): number {
    return ticketsHandled ? Number(((ticketsResolved / ticketsHandled) * 100).toFixed(2)) : 0;
  }

  private todayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private defaultStartDate(days: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (days - 1));
    return date.toISOString().slice(0, 10);
  }

  private shouldUseMock(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
  }
}
