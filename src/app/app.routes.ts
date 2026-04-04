import { inject } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { ForgotPasswordComponent } from './auth/pages/forgot-password.component';
import { LoginComponent } from './auth/pages/login.component';
import { NotFoundComponent } from './auth/pages/not-found.component';
import { UnauthorizedComponent } from './auth/pages/unauthorized.component';
import { authGuard, publicGuard, roleGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { getRoleDashboardPath } from './core/utils/role-path.util';
import { CustomerDashboardComponent } from './modules/customer/pages/dashboard.component';
import { CustomerDetailsComponent } from './modules/customers/pages/customer-details.component';
import { CustomerFormComponent } from './modules/customers/pages/customer-form.component';
import { CustomerListComponent } from './modules/customers/pages/customer-list.component';
import { WorkspaceDashboardComponent } from './modules/workspace/pages/dashboard.component';
import { PlaceholderPageComponent } from './shared/pages/placeholder-page.component';

const createPlaceholderRoute = (
  path: string,
  title: string,
  description: string,
  primaryPath = 'customers',
  primaryLabel = 'Open customer workspace',
): Route => ({
  path,
  component: PlaceholderPageComponent,
  data: {
    title,
    description,
    primaryPath,
    primaryLabel,
  },
});

const createStaffChildren = (roleLabel: string): Routes => [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: WorkspaceDashboardComponent,
  },
  {
    path: 'customers',
    children: [
      {
        path: '',
        component: CustomerListComponent,
      },
      {
        path: 'new',
        component: CustomerFormComponent,
      },
      {
        path: ':id/edit',
        component: CustomerFormComponent,
      },
      {
        path: ':id',
        component: CustomerDetailsComponent,
      },
    ],
  },
  createPlaceholderRoute(
    'team',
    `${roleLabel} team`,
    'The team area is ready in the shell so staffing, coaching, and coordination features can drop in cleanly next.',
  ),
  createPlaceholderRoute(
    'reports',
    `${roleLabel} reports`,
    'Reports are intentionally lightweight for now, but the route is in place to keep the workspace fully navigable.',
  ),
];

const adminChildren: Routes = [
  ...createStaffChildren('Admin'),
  createPlaceholderRoute(
    'settings',
    'Admin settings',
    'Settings have a reserved destination inside the shell, keeping the admin journey coherent as more controls are added.',
  ),
];

const agentChildren: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: WorkspaceDashboardComponent,
  },
  {
    path: 'customers',
    children: [
      {
        path: '',
        component: CustomerListComponent,
      },
      {
        path: 'new',
        component: CustomerFormComponent,
      },
      {
        path: ':id/edit',
        component: CustomerFormComponent,
      },
      {
        path: ':id',
        component: CustomerDetailsComponent,
      },
    ],
  },
  createPlaceholderRoute(
    'tickets',
    'Agent tickets',
    'Ticket navigation is available today so the workspace still feels complete while that module is implemented next.',
  ),
  createPlaceholderRoute(
    'knowledge-base',
    'Knowledge base',
    'Helpful articles and internal guides will live here, but the path is already part of the day-to-day journey.',
  ),
];

const customerChildren: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: CustomerDashboardComponent,
  },
  createPlaceholderRoute(
    'requests',
    'My requests',
    'This route is ready for support request history, follow-ups, and status tracking as the customer-facing modules expand.',
    'dashboard',
    'Open dashboard',
  ),
  createPlaceholderRoute(
    'profile',
    'My profile',
    'Profile settings and personal preferences can land here without changing the shell structure later.',
    'dashboard',
    'Open dashboard',
  ),
  createPlaceholderRoute(
    'knowledge-base',
    'Help center',
    'Self-service help content has a reserved location so the customer experience keeps a clear shape from day one.',
    'dashboard',
    'Open dashboard',
  ),
];

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [publicGuard],
    children: [
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
      },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: () => getRoleDashboardPath(inject(AuthService).getCurrentUser()?.role),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        children: adminChildren,
      },
      {
        path: 'supervisor',
        canActivate: [roleGuard(['SUPERVISOR', 'ADMIN'])],
        children: createStaffChildren('Supervisor'),
      },
      {
        path: 'agent',
        canActivate: [roleGuard(['AGENT', 'SUPERVISOR', 'ADMIN'])],
        children: agentChildren,
      },
      {
        path: 'customer',
        canActivate: [roleGuard(['CUSTOMER'])],
        children: customerChildren,
      },
    ],
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
