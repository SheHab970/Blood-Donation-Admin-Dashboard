import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { Subject, forkJoin, takeUntil } from 'rxjs';

import { RequestsService }  from '../../../../Core/Services/requests';
import { UsersService }     from '../../../../Core/Services/users';
import { DonationsService } from '../../../../Core/Services/donations';
import { InventoryService } from '../../../../Core/Services/inventory';
import { RewardsService }   from '../../../../Core/Services/rewards';
import { AuthService }      from '../../../../Core/Services/auth';
import { BloodUsageService } from '../../../../Core/Services/blood-usage';

import { BloodRequest, BloodInventoryItem, Reward } from '../../../../Core/interface/api-models';

const ALL_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

interface BloodTypeRow {
  type:     string;
  quantity: number;
  barWidth: number;
  status:   string;
}

@Component({
  selector:    'app-home',
  standalone:  true,
  imports:     [CommonModule, RouterLink, RouterModule],
  templateUrl: './home.html',
  styleUrl:    './home.css',
})
export class Home implements OnInit, OnDestroy {

  private requestsService  = inject(RequestsService);
  private usersService     = inject(UsersService);
  private donationsService = inject(DonationsService);
  private inventoryService = inject(InventoryService);
  private rewardsService   = inject(RewardsService);
  private bloodUsageService = inject(BloodUsageService);
  readonly auth            = inject(AuthService);

  private destroy$ = new Subject<void>();

  // ─── Stat cards ──────────────────────────────────────────────────────────────
  totalDonors    = 0;
  totalRequests  = 0;
  totalBags      = 0;
  todayDonations = 0;
  isLoadingStats = true;

  // ─── Blood type inventory (HospitalAdmin) ────────────────────────────────────
  bloodTypes:         BloodTypeRow[] = [];
  isLoadingInventory  = true;

  // ─── AI Predictions (HospitalAdmin) ──────────────────────────────────────────
  aiDemandLevel       = '—';
  aiConfidence        = 0;
  aiTotalExpected     = 0;
  isAiLoading         = true;

  // ─── Rewards (AppAdmin) ───────────────────────────────────────────────────────
  rewards:            Reward[] = [];
  isLoadingRewards    = true;

  get totalRewards(): number  { return this.rewards.length; }

  get pendingRedemptions(): number {
    // API doesn't expose a redemption status yet — derive from rewards
    // with pointsRequired > 0 as a proxy; swap this once the endpoint exists
    return this.rewards.filter(r => r.pointsRequired > 0).length;
  }

  get minPoints(): string {
    if (!this.rewards.length) return '—';
    return String(Math.min(...this.rewards.map(r => r.pointsRequired)));
  }

  get maxPoints(): string {
    if (!this.rewards.length) return '—';
    return String(Math.max(...this.rewards.map(r => r.pointsRequired)));
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats();
    if (this.auth.isHospitalAdmin()) {
      this.loadInventory();
      this.loadPredictions();
    }
    if (this.auth.isAppAdmin()) this.loadRewards();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Stats ────────────────────────────────────────────────────────────────────
  private loadStats(): void {
    this.isLoadingStats = true;

    forkJoin({
      users:     this.usersService.getAllUsers({ currentPage: 1, pageSize: 1 }),
      requests:  this.requestsService.getAllRequests({ currentPage: 1, pageSize: 1 }),
      donations: this.donationsService.getAllDonations({ currentPage: 1, pageSize: 1000 }),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ users, requests, donations }) => {
        this.totalDonors   = (users as any).totalCount ?? 0;

        const { total: reqTotal } = this.extractList(requests);
        this.totalRequests = reqTotal;

        const donRes       = donations as any;
        this.totalBags     = donRes?.donations?.totalCount ?? 0;

        const allDonations: any[] = donRes?.donations?.data ?? [];
        const today = new Date().toDateString();
        this.todayDonations = allDonations.filter(d => {
          const raw = d.donationDate ?? d.createdAt ?? d.date ?? '';
          return raw && new Date(raw).toDateString() === today;
        }).length;

        this.isLoadingStats = false;
      },
      error: (err) => {
        console.error('[Home] Failed to load stats:', err);
        this.isLoadingStats = false;
      },
    });
  }

  // ─── Blood inventory (HospitalAdmin only) ────────────────────────────────────
  private loadInventory(): void {
    this.isLoadingInventory = true;
    this.inventoryService.getHospitalInventory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const raw: BloodInventoryItem[] = Array.isArray(res?.inventory) ? res.inventory : [];
          this.bloodTypes         = this.buildBloodTypeRows(raw);
          this.isLoadingInventory = false;
        },
        error: (err) => {
          console.error('[Home] Failed to load inventory:', err);
          this.bloodTypes         = this.buildBloodTypeRows([]);
          this.isLoadingInventory = false;
        },
      });
  }

  private buildBloodTypeRows(data: BloodInventoryItem[]): BloodTypeRow[] {
    const rows = ALL_BLOOD_TYPES.map(type => {
      const found = data.find(b => b.bloodType?.replace('_', '') === type);
      return { type, quantity: found?.quantity ?? 0, status: found?.status ?? 'Empty', barWidth: 0 };
    });
    const max = Math.max(...rows.map(r => r.quantity), 1);
    rows.forEach(r => r.barWidth = Math.round((r.quantity / max) * 100));
    return rows;
  }

  // ─── AI Predictions (HospitalAdmin only) ─────────────────────────────────────
  private loadPredictions(): void {
    this.bloodUsageService.getPredictions(7)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.aiDemandLevel   = res.demandLevel;
          this.aiConfidence    = Math.round(res.overallAccuracy);
          this.aiTotalExpected = Math.round(res.totalExpectedUnits);
          this.isAiLoading     = false;
        },
        error: (err) => {
          console.error('[Home] Failed to load predictions:', err);
          this.isAiLoading = false;
        },
      });
  }

  // ─── Rewards (AppAdmin only) ──────────────────────────────────────────────────
  private loadRewards(): void {
    this.isLoadingRewards = true;
    this.rewardsService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rewards          = data ?? [];
          this.isLoadingRewards = false;
        },
        error: (err) => {
          console.error('[Home] Failed to load rewards:', err);
          this.isLoadingRewards = false;
        },
      });
  }

  // ─── Blood type helpers ───────────────────────────────────────────────────────
  isLowOrCritical(row: BloodTypeRow): boolean {
    const s = row.status.toLowerCase();
    return s === 'low' || s === 'critical' || s === 'empty';
  }

  isCritical(row: BloodTypeRow): boolean {
    return row.status.toLowerCase() === 'critical';
  }

  barColor(row: BloodTypeRow): string {
    const s = row.status.toLowerCase();
    if (s === 'critical' || s === 'empty') return '#E24B4A';
    if (s === 'low')  return '#E24B4A';
    if (s === 'high') return '#639922';
    return '#378ADD';
  }

  // ─── Shared extractor ────────────────────────────────────────────────────────
  private extractList<T>(res: any): { data: T[]; total: number } {
    if (!res) return { data: [], total: 0 };
    if (Array.isArray(res)) return { data: res, total: res.length };
    if (Array.isArray(res.data))
      return { data: res.data, total: res.totalCount ?? res.totalItems ?? res.data.length };
    if (Array.isArray(res.items))
      return { data: res.items, total: res.totalCount ?? res.totalItems ?? res.items.length };
    for (const key of Object.keys(res)) {
      const v = res[key];
      if (v && Array.isArray(v.data))
        return { data: v.data, total: v.totalCount ?? v.totalItems ?? v.data.length };
      if (Array.isArray(v)) return { data: v, total: v.length };
    }
    return { data: [], total: 0 };
  }
}