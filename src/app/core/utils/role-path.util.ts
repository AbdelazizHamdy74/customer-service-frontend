const ROLE_SEGMENTS: Record<string, string> = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  AGENT: 'agent',
  CUSTOMER: 'customer',
};

export function getRoleSegment(role?: string | null): string | null {
  if (!role) {
    return null;
  }

  return ROLE_SEGMENTS[role] ?? null;
}

export function getRoleBasePath(role?: string | null): string {
  const segment = getRoleSegment(role);
  return segment ? `/${segment}` : '/dashboard';
}

export function getRoleDashboardPath(role?: string | null): string {
  const segment = getRoleSegment(role);
  return segment ? `/${segment}/dashboard` : '/dashboard';
}
