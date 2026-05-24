import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HospitalAdmin,
  CreateHospitalAdminRequest,
  UpdateHospitalAdminRequest,
} from '..//interface/api-models';

@Injectable({ providedIn: 'root' })
export class HospitalAdminsService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /** GET /api/admin/hospital-admins — AppAdmin */
  getAll(): Observable<HospitalAdmin[]> {
    return this.http.get<HospitalAdmin[]>(
      `${this.BASE_URL}/api/admin/hospital-admins`
    );
  }

  /** GET /api/admin/hospital-admins/{id} — AppAdmin */
  getById(id: string): Observable<HospitalAdmin> {
    return this.http.get<HospitalAdmin>(
      `${this.BASE_URL}/api/admin/hospital-admins/${id}`
    );
  }

  /** POST /api/admin/hospital-admins — AppAdmin */
  create(body: CreateHospitalAdminRequest): Observable<HospitalAdmin> {
    return this.http.post<HospitalAdmin>(
      `${this.BASE_URL}/api/admin/hospital-admins`,
      body
    );
  }

  /** PUT /api/admin/hospital-admins/{id} — AppAdmin */
  update(
    id: string,
    body: UpdateHospitalAdminRequest
  ): Observable<HospitalAdmin> {
    return this.http.put<HospitalAdmin>(
      `${this.BASE_URL}/api/admin/hospital-admins/${id}`,
      body
    );
  }

  /** DELETE /api/admin/hospital-admins/{id} — AppAdmin */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/api/admin/hospital-admins/${id}`
    );
  }
}
