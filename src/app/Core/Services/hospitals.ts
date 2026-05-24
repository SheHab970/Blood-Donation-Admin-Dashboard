import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Hospital,
  CreateHospitalRequest,
  UpdateHospitalRequest,
} from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class HospitalsService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /** GET /api/admin/hospitals — AppAdmin */
  getAll(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.BASE_URL}/api/admin/hospitals`);
  }

  /** POST /api/admin/hospitals — AppAdmin */
  create(body: CreateHospitalRequest): Observable<Hospital> {
    return this.http.post<Hospital>(
      `${this.BASE_URL}/api/admin/hospitals`,
      body
    );
  }

  /** PUT /api/admin/hospitals/{id} — AppAdmin */
  update(id: number, body: UpdateHospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(
      `${this.BASE_URL}/api/admin/hospitals/${id}`,
      body
    );
  }

  /** DELETE /api/admin/hospitals/{id} — AppAdmin */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/api/admin/hospitals/${id}`
    );
  }
}
