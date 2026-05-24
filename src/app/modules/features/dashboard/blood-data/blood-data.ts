import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { DonationsService } from '../../../../Core/Services/donations';
import { Donation } from '../../../../Core/interface/api-models';



@Component({
  selector: 'app-blood-data',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './blood-data.html',
  styleUrl: './blood-data.css',
})
export class BloodData implements OnInit {
  private donationsService = inject(DonationsService);
  private messageService = inject(MessageService);

  blood_data: Donation[] = [];
  isLoading = false;

  // Pagination
  totalRecords = 0;
  pageSize = 6;
  currentPage = 1;
  totalDonations = 0;
  totalQuantity = 0;

  // Derived stats
  get totalVolume(): number {
    return this.blood_data.reduce((sum, d) => sum + (d.quantity ?? 0), 0);
  }
  get averagePerDonation(): number {
    if (!this.blood_data.length) return 0;
    return Math.round(this.totalVolume / this.blood_data.length);
  }

  ngOnInit(): void {
    this.loadDonations();
  }

  loadDonations(): void {
    this.isLoading = true;
    
    this.donationsService
      .getAllDonations({ currentPage: this.currentPage, pageSize: this.pageSize })
      .subscribe({
        next: (res) => {
          this.blood_data = res.donations.data ?? [];           // ✅ nested path
          this.totalRecords = res.donations.totalCount ?? 0;   // ✅ correct key
        
          // ✅ Real stats from API — wire to stat cards
          console.log('Total donations:', res.statistics.totalDonations);
          console.log('Total quantity:', res.statistics.totalQuantity);
          this.totalDonations = res.statistics.totalDonations;
          this.totalQuantity = res.statistics.totalQuantity;
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err?.error?.message ?? 'Failed to load donation data.',
            life: 4000,
          });
        },
      });
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.pageSize = event.rows;
    this.loadDonations();
  }
}
