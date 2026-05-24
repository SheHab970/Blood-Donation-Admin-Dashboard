import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../Services/auth';

/**
 * Functional route guard (Angular 17+ style).
 * Redirects unauthenticated users to /login.
 * Use on the dashboard parent route in app.routes.ts.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guard that only allows AppAdmin role.
 * Use on AppAdmin-only routes.
 */
export const appAdminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAppAdmin()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * Guard that only allows HospitalAdmin role.
 */
export const hospitalAdminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isHospitalAdmin()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
