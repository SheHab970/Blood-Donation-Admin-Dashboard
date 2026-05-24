import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Donation,
  PaginatedResponse,
  PaginationParams,
  QrTokenResponse,
  QrScanRequest,
  QrScanResponse,
} from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class DonationsService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /**
   * GET /api/admin/donations?PageNumber=&PageSize=
   * Role: AppAdmin
   */
  getAllDonations(
    pagination: PaginationParams
  ): Observable<PaginatedResponse<Donation>> {
    const params = new HttpParams()
      .set('PageNumber', pagination.currentPage.toString())
      .set('PageSize', pagination.pageSize.toString());
  

    return this.http.get<PaginatedResponse<Donation>>(
      `${this.BASE_URL}/api/admin/donations`,  // ✅ was /api/hospital/donations
      { params }
    ) as Observable<PaginatedResponse<Donation>>;
  }

  /**
   * GET /api/hospital/donations/{id}/pickup-qr
   * Role: User (donor)
   * Generates a QR for a general (walk-in) donation.
   */
  getGeneralDonationQr(donationId: number): Observable<QrTokenResponse> {
    return this.http.get<QrTokenResponse>(
      `${this.BASE_URL}/api/hospital/donations/${donationId}/pickup-qr`
    );
  }

  /**
   * POST /api/hospital/donations/{id}/scan
   * Role: HospitalAdmin or authenticated user
   * Validates and confirms a general (walk-in) donation via QR.
   */
  scanGeneralDonation(
    donationId: number,
    body: QrScanRequest
  ): Observable<QrScanResponse> {
    return this.http.post<QrScanResponse>(
      `${this.BASE_URL}/api/hospital/donations/${donationId}/scan`,
      body
    );
  }
}
