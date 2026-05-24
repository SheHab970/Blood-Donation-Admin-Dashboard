import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RefreshTokenResponse } from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly TOKEN_KEY         = 'auth_token';
  private readonly USER_KEY          = 'auth_user';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';

  /** Fire 5 minutes (300 000 ms) before the access token expires */
  private readonly REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

  private readonly BASE_URL = environment.baseUrl;

  private http   = inject(HttpClient);
  private router = inject(Router);

  /** Holds the setTimeout handle so we can cancel it on logout */
  private refreshTimerHandle: ReturnType<typeof setTimeout> | null = null;

  // ─── Login ────────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.BASE_URL}/api/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res?.accessToken) {
            this.storeToken(res.accessToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          }
          if (res?.refreshToken) {
            this.storeRefreshToken(res.refreshToken);
          }
        }),
      );
  }

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse['user']) : null;
  }

  getFullName(): string | null {
    return this.getUser()?.fullName ?? null;
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

  storeRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  // ─── Proactive Token Refresh ───────────────────────────────────────────────

  /**
   * Schedules a silent token refresh 5 minutes before the access token expires.
   * Call this:
   *   1. Right after a successful login.
   *   2. On app bootstrap (AppComponent.ngOnInit) if the user is already logged in.
   *   3. After every successful refresh, to re-arm the timer for the new token.
   */
  scheduleTokenRefresh(): void {
    this.cancelScheduledRefresh(); // clear any existing timer first

    const token = this.getToken();
    if (!token) return;

    const payload = this.decodeToken(token);
    if (!payload?.['exp']) return;

    const expiresAtMs = payload['exp'] * 1000;
    const nowMs       = Date.now();
    const delayMs     = expiresAtMs - nowMs - this.REFRESH_THRESHOLD_MS;

    if (delayMs <= 0) {
      // Token is already within the threshold (or expired) — refresh immediately
      this.executeRefresh();
      return;
    }

    console.log(
      `[AuthService] Token refresh scheduled in ${Math.round(delayMs / 1000)}s ` +
      `(5 min before expiry at ${new Date(expiresAtMs).toLocaleTimeString()})`,
    );

    this.refreshTimerHandle = setTimeout(() => this.executeRefresh(), delayMs);
  }

  /** Cancels a pending proactive refresh timer */
  cancelScheduledRefresh(): void {
    if (this.refreshTimerHandle !== null) {
      clearTimeout(this.refreshTimerHandle);
      this.refreshTimerHandle = null;
    }
  }

  /**
   * Calls the refresh endpoint, stores the new tokens, and re-arms the timer.
   * On failure it falls back to logout so the user is never stuck with a
   * silently-broken session.
   */
  private executeRefresh(): void {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return;
    }

    this.refreshAccessToken(refreshToken).subscribe({
      next: () => {
        console.log('[AuthService] Access token refreshed successfully.');
        this.scheduleTokenRefresh(); // re-arm for the new token
      },
      error: (err) => {
        console.error('[AuthService] Token refresh failed — logging out.', err);
        this.logout();
      },
    });
  }

  /**
   * Calls POST /api/auth/refresh-token with the stored refresh token.
   * Stores the new access token (and refresh token if the backend rotates it).
   */
  refreshAccessToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http
      .post<RefreshTokenResponse>(
        `${this.BASE_URL}/api/auth/refresh-token`,
        { refreshToken },
      )
      .pipe(
        tap((res) => {
          if (res?.accessToken) {
            this.storeToken(res.accessToken);
          }
          // Store rotated refresh token if the backend sends a new one
          if (res?.refreshToken) {
            this.storeRefreshToken(res.refreshToken);
          }
        }),
      );
  }

  // ─── JWT Decode ───────────────────────────────────────────────────────────

  private decodeToken(token: string): Record<string, any> | null {
    try {
      const payload = token.split('.')[1];
      const base64  = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json    = atob(base64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.['exp']) return true;
    return Date.now() >= payload['exp'] * 1000;
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload) return null;

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

  // ─── Logout ───────────────────────────────────────────────────────────────

  logout(): void {
    this.cancelScheduledRefresh();
    this.clearToken();
    this.clearRefreshToken();
    localStorage.removeItem('auth_user');
    this.router.navigate(['/login']);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.cancelScheduledRefresh();
  }
}