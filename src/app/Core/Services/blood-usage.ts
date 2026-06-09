import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PredictionsResponse } from '../interface/api-models';

export type UsagePeriod = '1day' | '7days' | '1month' | '3months' | '6months' | '1year';

export interface BloodUsageEntry {
  bloodType: string;
  usedUnits: number;
  percentage: number;
}

export interface BloodUsageResponse {
  hospitalId: number;
  hospitalName: string;
  period: string;
  totalUsedUnits: number;
  bloodUsage: BloodUsageEntry[];
}

@Injectable({ providedIn: 'root' })
export class BloodUsageService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /**
   * GET /api/hospital/blood-usage?period=1month
   * Role: HospitalAdmin
   */
  getBloodUsage(period: UsagePeriod = '1month'): Observable<BloodUsageResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<BloodUsageResponse>(
      `${this.BASE_URL}/api/hospital/blood-usage`,
      { params }
    );
  }

  /**
   * GET /api/hospital/predictions?horizonDays=7
   * Role: HospitalAdmin
   */
  getPredictions(horizonDays: number = 7): Observable<PredictionsResponse> {
    const params = new HttpParams().set('horizonDays', horizonDays);
    return this.http.get<PredictionsResponse>(
      `${this.BASE_URL}/api/hospital/predictions`,
      { params }
    );
  }
}
