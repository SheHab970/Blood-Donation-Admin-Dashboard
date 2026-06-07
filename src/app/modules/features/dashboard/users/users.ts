import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, LazyLoadEvent } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UsersService } from '../../../../Core/Services/users';
import { User, UsersResponse } from '../../../../Core/interface/api-models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, FormsModule, ToastModule, ReactiveFormsModule],
  providers: [MessageService],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit, OnDestroy {
  private usersService   = inject(UsersService);
  private messageService = inject(MessageService);

  users: User[]         = [];
  filteredUsers: User[] = [];
  isLoading             = false;
  searchQuery           = '';

  // Pagination state
  totalRecords = 0;
  pageSize     = 8;
  currentPage  = 2;
  totalPages   = 0;

  // ─── Search stream ────────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();
  private destroy$      = new Subject<void>();

  ngOnInit(): void {
    console.log('[Users] Component initialized');
    
    // Debounce keystrokes by 300ms — avoids filtering on every single character
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((query) => this.applyFilter(query));

    this.loadUsers();
  }

  ngOnDestroy(): void {
    console.log('[Users] Component destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    const paginationParams = { 
      currentPage: this.currentPage, 
      pageSize: this.pageSize 
    };
    
    console.log('[Users] ========== LOADING PAGE ==========');
    console.log('[Users] currentPage:', this.currentPage);
    console.log('[Users] pageSize:', this.pageSize);
    console.log('[Users] Calling getAllUsers...');

    this.usersService
      .getAllUsers(paginationParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: UsersResponse) => {
          console.log('[Users] ===== RESPONSE RECEIVED =====');
          console.log('[Users] Response object:', res);
          console.log('[Users] data.length:', res.data?.length);
          console.log('[Users] totalCount:', res.totalCount);
          console.log('[Users] totalPages:', res.totalPages);
          console.log('[Users] currentPage (from server):', res.currentPage);
          console.log('[Users] hasNext:', res.hasNext);
          console.log('[Users] hasPrevious:', res.hasPrevious);

          this.users         = res.data ?? [];
          this.totalRecords  = res.totalCount ?? 0;
          this.totalPages    = res.totalPages ?? 1;
          this.filteredUsers = [...this.users];
          this.isLoading     = false;

          console.log('[Users] State updated. Showing', this.users.length, 'of', this.totalRecords, 'users');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('[Users] ERROR:', err);
          console.error('[Users] Error status:', err?.status);
          console.error('[Users] Error message:', err?.error?.message ?? err?.message);
          
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   err?.error?.message ?? 'Failed to load users.',
            life:     4000,
          });
        },
      });
  }

  // Called when user clicks pagination controls
  onPageChange(event: any): void {
    console.log('EVENT FIRED:', event);
    this.currentPage = Math.floor((event.first ?? 0) / (event.rows ?? 10)) + 1;
    this.pageSize = event.rows ?? 10;
    console.log('New page:', this.currentPage);
    this.loadUsers();
  }

  // Receives the raw input value directly from the template ref — no ngModel needed
  onSearch(value: string): void {
    console.log('[Users] Search input:', value);
    this.searchQuery = value; // sync for @if(searchQuery) clear button
    this.searchSubject.next(value);
  }

  // The actual filter logic — only called after debounce settles
  private applyFilter(query: string): void {
    console.log('[Users] Applying filter for query:', query);
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredUsers = [...this.users];
      console.log('[Users] Filter cleared, showing all', this.filteredUsers.length, 'users');
      return;
    }
    this.filteredUsers = this.users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.bloodType?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q)
    );
    console.log('[Users] Filter applied, showing', this.filteredUsers.length, 'users');
  }

  getSeverity(
    status: string
  ): 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast' {
    switch (status) {
      case 'ACTIVE':   return 'success';
      case 'INACTIVE': return 'danger';
      default:         return 'secondary';
    }
  }
}