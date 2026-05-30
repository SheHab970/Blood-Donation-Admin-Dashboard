import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { RequestsService } from '../../../../Core/Services/requests';
import { BloodRequest } from '../../../../Core/interface/api-models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
})
export class Requests implements OnInit {
  private requestsService = inject(RequestsService);
  private messageService = inject(MessageService);

  /** Current page only — feeds the lazy p-table. */
  requests: BloodRequest[] = [];
  /** Full set — feeds the summary cards (counts must span ALL requests, not one page). */
  private allRequests: BloodRequest[] = [];

  isLoading = false;

  // Pagination state (server-side, for the table)
  totalRecords = 0;
  pageSize = 7;
  currentPage = 1;
  first = 0; // bound to p-table [first] so the active page stays highlighted

  /** One big pull to count across everything. Bump if you ever exceed it. */
  private readonly STATS_PAGE_SIZE = 1000;

  // ─── Summary counts (calculated client-side over the full set) ──────────────
  get pendingCount(): number {
    return this.allRequests.filter((r) => this.statusOf(r) === 'pending').length;
  }
  get emergencyCount(): number {
    return this.allRequests.filter((r) => {
      const u = this.urgencyOf(r);
      return u === 'emergency' || u === 'critical';
    }).length;
  }
  get completedCount(): number {
    return this.allRequests.filter((r) => {
      const s = this.statusOf(r);
      return s === 'completed' || s === 'approved' || s === 'fulfilled';
    }).length;
  }

  /** Normalised, case-insensitive accessors that tolerate field-name variance. */
  private statusOf(r: any): string {
    return (r?.status ?? '').toString().trim().toLowerCase();
  }
  private urgencyOf(r: any): string {
    return (r?.urgency ?? r?.priority ?? '').toString().trim().toLowerCase();
  }

  ngOnInit(): void {
    this.loadRequests(); // table page
    this.loadStats();    // summary cards
  }

  // ─── Table page (lazy) ──────────────────────────────────────────────────────
  loadRequests(): void {
    this.isLoading = true;
    this.requestsService
      .getAllRequests({ currentPage: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (res: any) => {
          const { data, total } = this.extractList<BloodRequest>(res);
          this.requests = data;
          this.totalRecords = total;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'Failed to load blood requests.',
            life: 4000,
          });
        },
      });
  }

  // ─── Full set for the summary cards ──────────────────────────────────────────
  loadStats(): void {
    this.requestsService
      .getAllRequests({ currentPage: 1, pageSize: this.STATS_PAGE_SIZE })
      .subscribe({
        next: (res: any) => {
          const { data } = this.extractList<BloodRequest>(res);
          this.allRequests = data;
          // TEMP: confirm the real status/priority values, then you can remove this.
          if (data.length) console.log('[Requests] sample row:', data[0]);
        },
        error: () => {
          // Cards just stay at 0 — no toast needed, the table already reports errors.
          this.allRequests = [];
        },
      });
  }

  /**
   * Shape-agnostic extractor for paginated list endpoints.
   * Handles: plain array, { data: [] }, { items: [] }, and single-key
   * wrappers like { requests: { data: [] } } or { donations: { data: [] } }.
   */
  private extractList<T>(res: any): { data: T[]; total: number } {
    if (!res) return { data: [], total: 0 };

    if (Array.isArray(res)) return { data: res, total: res.length };

    if (Array.isArray(res.data)) {
      return { data: res.data, total: res.totalCount ?? res.totalItems ?? res.data.length };
    }
    if (Array.isArray(res.items)) {
      return { data: res.items, total: res.totalCount ?? res.totalItems ?? res.items.length };
    }

    for (const key of Object.keys(res)) {
      const v = res[key];
      if (v && Array.isArray(v.data)) {
        return { data: v.data, total: v.totalCount ?? v.totalItems ?? v.data.length };
      }
      if (Array.isArray(v)) {
        return { data: v, total: v.length };
      }
    }

    return { data: [], total: 0 };
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.loadRequests();
  }

  /** Maps a status to your .status-pill modifier classes in styles.css. */
  getStatusClass(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'pending':
        return 's-pending';
      case 'approved':
        return 's-approved';
      case 'completed':
        return 's-completed';
      case 'rejected':
        return 's-emergency';
      default:
        return 's-inactive';
    }
  }
}