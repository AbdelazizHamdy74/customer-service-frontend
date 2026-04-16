export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketSource = 'api' | 'mock';

export interface TicketComment {
  authorId?: string | null;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface TicketHistory {
  action: string;
  actorId?: string | null;
  actorRole: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note: string;
  meta?: any;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  customerId: string;
  assignedAgentId?: string | null;
  status: TicketStatus;
  priority?: TicketPriority;
  slaDueAt?: string | null;
  comments: TicketComment[];
  history: TicketHistory[];
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  source: TicketSource;
}

export interface TicketUpsertPayload {
  subject: string;
  description: string;
  /** Set automatically for customer users by the API when omitted. */
  customerId?: string;
  assignedAgentId?: string | null;
  status?: TicketStatus;
  priority?: TicketPriority;
}

export interface TicketAssignPayload {
  assignedAgentId: string;
  note?: string;
}

export interface TicketSearchParams {
  q?: string;
  subject?: string;
  customerId?: string;
  assignedAgentId?: string;
  status?: TicketStatus | '';
  priority?: string;
  overdue?: boolean | string;
  page?: number;
  limit?: number;
}

export interface CannedResponseItem {
  id: string;
  title: string;
  body: string;
  category: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  resourceType: string;
  resourceId?: string | null;
  meta?: unknown;
  createdAt: string;
}

export interface TicketPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketSearchResult {
  tickets: Ticket[];
  pagination: TicketPagination;
}
