import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BloodInventoryItem } from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /**
   * GET /api/hospital/inventory
   * Role: HospitalAdmin
   * Returns the blood inventory for the authenticated hospital admin's hospital.
   */
  getHospitalInventory(): Observable<BloodInventoryItem[]> {
    return this.http.get<BloodInventoryItem[]>(
      `${this.BASE_URL}/api/hospital/inventory`
    );
  }
}
