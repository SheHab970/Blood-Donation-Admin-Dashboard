import { Component, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { MessageService } from 'primeng/api';
import { DonationsService } from '../../../../Core/Services/donations';
import { RequestsService } from '../../../../Core/Services/requests';
import { RewardsService } from '../../../../Core/Services/rewards';
import { ChangeDetectorRef } from '@angular/core';
import { QrScanResponse } from '../../../../Core/interface/api-models';
import { ToastModule } from 'primeng/toast';

interface ParsedQr {
  id?: number;
  qrToken: string;
}

@Component({
  selector: 'app-scanning',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZXingScannerModule, ToastModule],
  providers: [MessageService],
  templateUrl: './scaning.html',
  styleUrl: './scaning.css',
})
export class Scaning implements OnDestroy {
  private donationsService = inject(DonationsService);
  private requestsService  = inject(RequestsService);
  private rewardsService   = inject(RewardsService);
  private messageService = inject(MessageService);

  @ViewChild('qrInput') qrInput?: ElementRef<HTMLInputElement>;

  // ─── Mode ────────────────────────────────────────────────────────────────────
  mode: 'donor' | 'recipient' | 'reward' = 'donor';

  // ─── Manual / hardware-scanner input ─────────────────────────────────────────
  qrCode   = '';
  entityId: number | null = null;

  // ─── Camera ───────────────────────────────────────────────────────────────────
  scannerEnabled  = true;
  formats         = [BarcodeFormat.QR_CODE];
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice?: MediaDeviceInfo;
  hasCamera       = true;
  private cdr = inject(ChangeDetectorRef);
  // ─── Request lifecycle ────────────────────────────────────────────────────────
  processing = false;
  errorMsg   = '';

  // ─── Last-scan summary card ───────────────────────────────────────────────────
  lastScanned     = '—';
  lastBloodType   = '—';
  lastStatus      = 'Waiting';
  lastStatusClass = 's-inactive';

  // ─── Mode toggle ──────────────────────────────────────────────────────────────
  setMode(m: 'donor' | 'recipient' | 'reward'): void {
    this.mode      = m;
    this.qrCode    = '';
    this.entityId  = null;
    this.errorMsg  = '';
    setTimeout(() => this.qrInput?.nativeElement?.focus(), 50);
  }

  // ─── Camera lifecycle ─────────────────────────────────────────────────────────
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasCamera        = devices.length > 0;
  
    if (!this.selectedDevice && devices.length) {
      this.selectedDevice =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];
    }
  
    this.cdr.detectChanges();
  }



  onCamerasNotFound(): void { this.hasCamera = false; }

  onDeviceChange(deviceId: string): void {
    const next = this.availableDevices.find((d) => d.deviceId === deviceId);
    if (!next || next.deviceId === this.selectedDevice?.deviceId) return; // ← guard
    this.selectedDevice = next;
    this.cdr.detectChanges();
  }


  onPermissionResponse(permission: boolean): void {
    if (!permission) {
      this.hasCamera      = false;
      this.scannerEnabled = false;
    }
    this.cdr.detectChanges();
  }


  // ─── Scan entry points ────────────────────────────────────────────────────────
  onScanSuccess(text: string): void {
    if (this.processing) return;
    this.handlePayload(text);
  }

  onSubmit(): void {
    if (this.processing) return;
    this.handlePayload(this.qrCode);
  }

  // ─── Core flow ────────────────────────────────────────────────────────────────
  private handlePayload(raw: string): void {
    this.errorMsg = '';

    const parsed = this.parseQr(raw);
    if (!parsed) {
      this.errorMsg = 'No QR code detected.';
      return;
    }

    this.processing    = true;
    this.scannerEnabled = false;

    const body    = { qrToken: parsed.qrToken };
    const call$   =
      this.mode === 'donor'
        ? this.donationsService.scanGeneralDonation(body)
        : this.mode === 'recipient'
          ? this.requestsService.pickupScan(body)
          : this.rewardsService.scanReward(parsed.qrToken);

    call$.subscribe({
      next:  (res) => this.onResult(res),
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Scan failed. Please try again.';
        this.messageService.add({ severity: 'error', summary: 'Error Occurred', detail: this.errorMsg ?? 'failed scan QR please try again', life: 4000 });
        this.resetAfter();
      },
    });
  }
  private onResult(res: QrScanResponse): void {
    this.lastScanned   = res.donorName ?? res.userName ?? 'Unknown';
    this.lastBloodType = res.bloodType ?? '—';
  
    // API has no `success` boolean — infer from message or status field
    const isSuccess = res.success === true
      || (typeof res.message === 'string' && /success/i.test(res.message))
      || res.status === 'Used';
  
    if (isSuccess) {
      console.log('scan success peeeeep')
      // PLAY AUDIO
      const audio = new Audio("assets/mp3/beep.mp3");
      audio.play();
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'QR code scanned successfully.', life: 4000 });
      this.lastStatus      = this.mode === 'reward' ? 'Rewarded' : 'Processed';
      this.lastStatusClass = 's-approved';
      this.errorMsg        = 'QR code scanned successfully.';          // ← clear any stale error
    } else {
      this.lastStatus      = 'Rejected';
      this.lastStatusClass = 's-emergency';
      this.errorMsg        = res.message ?? 'Scan failed.';
      this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMsg ?? 'failed scan QR please try again', life: 4000 });
      
    }
  
    this.resetAfter();
  }

  private resetAfter(): void {
    this.qrCode    = '';
    this.entityId  = null;
    this.processing = false;
    setTimeout(() => (this.scannerEnabled = true), 1200);
  }

  // ─── QR payload parsing ───────────────────────────────────────────────────────
  private parseQr(raw: string): ParsedQr | null {
    const text = (raw ?? '').trim();
    if (!text) return null;

    try {
      const url     = new URL(text);
      const qrToken = url.searchParams.get('token') ?? url.searchParams.get('qrToken');
      if (qrToken) {
        const id = Number(url.searchParams.get('id'));
        return { id: id || undefined, qrToken };
      }
    } catch { /* not a URL */ }

    try {
      const obj     = JSON.parse(text);
      const qrToken = obj.qrToken ?? obj.token;
      if (qrToken) {
        const id = Number(obj.id);
        return { id: id || undefined, qrToken };
      }
    } catch { /* not JSON */ }

    return { qrToken: text };
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  ngOnDestroy(): void { this.scannerEnabled = false; }
}