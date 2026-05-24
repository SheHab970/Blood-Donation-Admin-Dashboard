import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { RequestsService } from '../../../../Core/Services/requests';
import { BloodRequest } from '../../../../Core/interface/api-models';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
})
export class Requests implements OnInit {
  private requestsService = inject(RequestsService);
  private messageService = inject(MessageService);

  requests: BloodRequest[] = [];
  isLoading = false;

  // Pagination state
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;

  // Derived summary counts
  get pendingCount(): number {
    return this.requests.filter((r) => r.status === 'Pending').length;
  }
  get emergencyCount(): number {
    return this.requests.filter((r) => r.urgency === 'Emergency').length;
  }
  get completedCount(): number {
    return this.requests.filter((r) => r.status === 'Completed' || r.status === 'Approved').length;
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading = true;
    this.requestsService
      .getAllRequests({ currentPage: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (res) => {
          // Handle both paginated response and plain array from API
          if (Array.isArray(res)) {
            this.requests = res as BloodRequest[];
            this.totalRecords = this.requests.length;
          } else {
            this.requests = res.donations?.data ?? [];
            this.totalRecords = res.donations?.totalCount ?? this.requests.length;
          }
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

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.loadRequests();
  }

  getSeverity(
    status: string
  ): 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast' {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warn';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
