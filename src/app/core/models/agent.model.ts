export type AgentRole = 'ADMIN' | 'SUPERVISOR' | 'AGENT';
export type AgentStatus = 'ACTIVE' | 'INACTIVE';
export type AgentSource = 'api' | 'mock';

export interface AgentPerformanceSnapshot {
  ticketsHandled: number;
  ticketsResolved: number;
  avgResponseTimeMinutes: number;
  avgResolutionTimeMinutes: number;
  customerSatisfaction: number;
  lastActiveAt?: string | null;
  lastUpdatedAt?: string | null;
  resolutionRate?: number;
}

export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: AgentRole;
  status: AgentStatus;
  team: string;
  skills: string[];
  performance: AgentPerformanceSnapshot;
  authUserId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  source: AgentSource;
}

export interface AgentUpsertPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role?: AgentRole;
  status?: AgentStatus;
  team?: string;
  skills: string[];
}

export interface AgentInvitePayload extends AgentUpsertPayload {
  email: string;
}

export interface AgentInviteResult {
  userId: string;
  inviteToken: string;
  inviteTokenExpiresAt: string;
}

export interface AgentSearchParams {
  q?: string;
  role?: AgentRole | '';
  status?: AgentStatus | '';
  team?: string;
  skill?: string;
  page?: number;
  limit?: number;
}

export interface AgentPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AgentSearchFilters {
  q: string;
  role: AgentRole | '';
  status: AgentStatus | '';
  team: string;
  skill: string;
}

export interface AgentSearchResult {
  items: Agent[];
  pagination: AgentPagination;
  filters: AgentSearchFilters;
  source: AgentSource;
}

export interface AgentPerformanceReportParams {
  agentId: string;
  startDate?: string;
  endDate?: string;
}

export interface AgentPerformanceReportItem {
  agentId: string;
  name: string;
  role: AgentRole;
  status: AgentStatus | 'UNKNOWN';
  team: string;
  isDeleted: boolean;
  ticketsAssigned: number;
  ticketsClosed: number;
  ticketsReopened: number;
  currentOpenTickets: number;
  resolutionRate: number;
  averageResolutionTimeMinutes: number;
  snapshotPerformance: AgentPerformanceSnapshot;
}

export interface AgentPerformanceReport {
  report: string;
  period: {
    startDate: string;
    endDate: string;
  };
  filters: {
    agentId: string | null;
  };
  summary: {
    totalAgents: number;
    totalAssignedTickets: number;
    totalClosedTickets: number;
    totalOpenTickets: number;
  };
  items: AgentPerformanceReportItem[];
  generatedAt: string;
  source: AgentSource;
}

export interface AgentPerformanceSnapshotResponse {
  agentId: string;
  name: string;
  role: AgentRole;
  performance: AgentPerformanceSnapshot;
  source: AgentSource;
}
