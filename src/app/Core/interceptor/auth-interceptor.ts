import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../Services/auth';

/**
 * Functional HTTP interceptor (Angular 17+ style).
 * 1. Attaches the JWT Bearer token to every outgoing request.
 * 2. Handles 401 → logout, 403 → redirect to unauthorised page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Clone the request and attach the Authorization header if a token exists
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Token expired or invalid — clear and redirect to login
          authService.logout();
          break;
        case 403:
          // Authenticated but not authorised for this resource
          router.navigate(['/login']);
          break;
        default:
          break;
      }
      return throwError(() => error);
    })
  );
};
