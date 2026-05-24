import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Reward,
  CreateRewardRequest,
  UpdateRewardRequest,
} from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class RewardsService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /** GET /api/rewards — all authenticated roles */
  getAll(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.BASE_URL}/api/rewards`);
  }

  /** POST /api/admin/rewards — AppAdmin */
  create(body: CreateRewardRequest): Observable<Reward> {
    return this.http.post<Reward>(`${this.BASE_URL}/api/admin/rewards`, body);
  }

  /** PUT /api/admin/rewards/{id} — AppAdmin */
  update(id: number, body: UpdateRewardRequest): Observable<Reward> {
    return this.http.put<Reward>(
      `${this.BASE_URL}/api/admin/rewards/${id}`,
      body
    );
  }

  /** DELETE /api/admin/rewards/{id} — AppAdmin */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}/api/admin/rewards/${id}`
    );
  }
}
