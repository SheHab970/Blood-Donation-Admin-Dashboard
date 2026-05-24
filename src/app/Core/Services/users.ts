import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, PaginatedResponse, PaginationParams } from '../interface/api-models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly BASE_URL = environment.baseUrl;
  private http = inject(HttpClient);

  /**
   * GET /api/admin/users?PageNumber=&PageSize=
   * Role: AppAdmin
   */
  getAllUsers(
    pagination: PaginationParams
  ): Observable<PaginatedResponse<User>> {
    const params = new HttpParams()
      .set('PageNumber', pagination.currentPage.toString())
      .set('PageSize', pagination.pageSize.toString());

    return this.http.get<PaginatedResponse<User>>(
      `${this.BASE_URL}/api/admin/users`,
      { params }
    );
  }

  /**
   * GET /api/admin/users?Id={id}
   * Role: AppAdmin
   */
  getUserById(id: number): Observable<User> {
    const params = new HttpParams().set('Id', id.toString());

    return this.http.get<User>(`${this.BASE_URL}/api/admin/users`, { params });
  }
}
