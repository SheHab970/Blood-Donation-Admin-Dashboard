import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BloodRequest,
  PaginatedResponse,
  PaginationParams,
  QrTokenResponse,
  QrScanRequest,
  QrScanResponse,
} from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /**
   * GET /api/admin/requests?PageNumber=&PageSize=
   * Role: AppAdmin
   */
  getAllRequests(
    pagination: PaginationParams
  ): Observable<PaginatedResponse<BloodRequest>> {
    const params = new HttpParams()
      .set('PageNumber', pagination.currentPage.toString())
      .set('PageSize', pagination.pageSize.toString());

    return this.http.get<PaginatedResponse<BloodRequest>>(
      `${this.BASE_URL}/api/admin/requests`,
      { params }
    );
  }

  /**
   * GET /api/requests/{id}/pickup-qr
   * Role: HospitalAdmin
   * Generates a QR code for a specific blood request.
   */
  getPickupQr(requestId: number): Observable<QrTokenResponse> {
    return this.http.get<QrTokenResponse>(
      `${this.BASE_URL}/api/requests/${requestId}/pickup-qr`
    );
  }

  /**
   * POST /api/requests/{id}/pickup-scan
   * Role: HospitalAdmin
   * Validates the donor QR token and confirms blood pickup.
   */
  pickupScan(
    requestId: number,
    body: QrScanRequest
  ): Observable<QrScanResponse> {
    return this.http.post<QrScanResponse>(
      `${this.BASE_URL}/api/requests/${requestId}/pickup-scan`,
      body
    );
  }
}
