import { Routes } from '@angular/router';
import { authGuard, publicGuard, roleGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { LoginComponent } from './auth/pages/login.component';
import { ForgotPasswordComponent } from './auth/pages/forgot-password.component';
import { UnauthorizedComponent } from './auth/pages/unauthorized.component';
import { NotFoundComponent } from './auth/pages/not-found.component';
import { AdminDashboardComponent } from './modules/admin/pages/dashboard.component';
import { CustomerDashboardComponent } from './modules/customer/pages/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // Auth Layout Routes (Public)
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [publicGuard],
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
    ],
  },

  // Main Layout Routes (Protected)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        redirectTo: 'admin/dashboard',
        pathMatch: 'full',
      },

      // Admin Module
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        children: [
          { path: 'dashboard', component: AdminDashboardComponent },
          // Add more admin routes here
        ],
      },

      // Supervisor Module
      {
        path: 'supervisor',
        canActivate: [roleGuard(['SUPERVISOR', 'ADMIN'])],
        children: [
          // Add supervisor routes
          { path: 'dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
        ],
      },

      // Agent Module
      {
        path: 'agent',
        canActivate: [roleGuard(['AGENT', 'SUPERVISOR', 'ADMIN'])],
        children: [
          // Add agent routes
          { path: 'dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
        ],
      },

      // Customer Module
      {
        path: 'customer',
        canActivate: [roleGuard(['CUSTOMER'])],
        children: [
          { path: 'dashboard', component: CustomerDashboardComponent },
          // Add more customer routes here
        ],
      },
    ],
  },

  // Error Routes
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent },
];
