import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login (only in browser)
  if (isBrowser) {
    sessionStorage.setItem('redirectUrl', state.url);
  }

  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    // Redirect to dashboard or home based on role
    const user = authService.getCurrentUser();
    const rolePath = getRoleBasedPath(user?.role || '');
    router.navigate([rolePath]);
    return false;
  }

  return true;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (authService.hasRole(allowedRoles)) {
      return true;
    }

    // User is authenticated but doesn't have the required role
    router.navigate(['/unauthorized']);
    return false;
  };
};

/**
 * Get path based on user role
 */
export function getRoleBasedPath(role: string): string {
  const rolePaths: { [key: string]: string } = {
    ADMIN: '/admin/dashboard',
    SUPERVISOR: '/supervisor/dashboard',
    AGENT: '/agent/dashboard',
    CUSTOMER: '/customer/dashboard',
  };

  return rolePaths[role] || '/dashboard';
}
