import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly BASE_URL = environment.baseUrl;

  private http = inject(HttpClient);
  private router = inject(Router);

  // ─── Login ────────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.BASE_URL}/api/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res?.accessToken) {
            this.storeToken(res.accessToken);
          }
        })
      );
  }

  // ─── Token Management ─────────────────────────────────────────────────────

  storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  // ─── JWT Decode ───────────────────────────────────────────────────────────

  /**
   * Decodes the JWT payload without any external library.
   * JWT structure: header.payload.signature (all base64url encoded)
   */
  private decodeToken(token: string): Record<string, any> | null {
    try {
      const payload = token.split('.')[1];
      // base64url → base64 → decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.['exp']) return true;
    // exp is in seconds, Date.now() in ms
    return Date.now() >= payload['exp'] * 1000;
  }

  /**
   * Extracts the role claim from the JWT.
   * ASP.NET Core Identity uses the full claim URI or 'role' key.
   */
  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload) return null;

    // ASP.NET Core emits role under this claim URI
    const roleClaimKey =
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    return payload[roleClaimKey] ?? payload['role'] ?? null;
  }

  isAppAdmin(): boolean {
    return this.getRole() === 'AppAdmin';
  }

  isHospitalAdmin(): boolean {
    return this.getRole() === 'HospitalAdmin';
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload) return null;

    const subClaim =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
    return payload[subClaim] ?? payload['sub'] ?? null;
  }

  getFullName(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload) return null;

    const nameClaim =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
    return payload[nameClaim] ?? payload['name'] ?? null;
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
