import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UsersService } from '../../../../Core/Services/users';
import { User } from '../../../../Core/interface/api-models';

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
  pageSize     = 10;
  currentPage  = 1;

  // ─── Search stream ────────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();
  private destroy$      = new Subject<void>();

  ngOnInit(): void {
    // Debounce keystrokes by 300ms — avoids filtering on every single character
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((query) => this.applyFilter(query));

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.usersService
      .getAllUsers({ currentPage: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (res) => {
          this.users         = res.data ?? [];
          this.totalRecords  = res.totalCount ?? this.users.length;
          this.filteredUsers = [...this.users];
          this.isLoading     = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   err?.error?.message ?? 'Failed to load users.',
            life:     4000,
          });
        },
      });
  }

  // Receives the raw input value directly from the template ref — no ngModel needed
  onSearch(value: string): void {
    this.searchQuery = value; // sync for @if(searchQuery) clear button
    this.searchSubject.next(value);
  }

  // The actual filter logic — only called after debounce settles
  private applyFilter(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.bloodType?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q)
    );
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize    = event.rows;
    this.loadUsers();
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