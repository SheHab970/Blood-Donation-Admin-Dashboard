import { Component, ViewChild, ElementRef, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library'; // if this path fails to resolve, use '@zxing/browser'

import { DonationsService } from '../../../../Core/Services/donations';
import { RequestsService } from '../../../../Core/Services/requests';
import { QrScanResponse } from '../../../../Core/interface/api-models';

interface ParsedQr {
  id: number;
  qrToken: string;
}

@Component({
  selector: 'app-scanning',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ZXingScannerModule],
  templateUrl: './scaning.html',
  styleUrl: './scaning.css',
})
export class Scaning implements OnDestroy {
  private donationsService = inject(DonationsService);
  private requestsService = inject(RequestsService);

  @ViewChild('qrInput') qrInput?: ElementRef<HTMLInputElement>;

  // ─── Mode ───────────────────────────────────────────────────────────────────
  mode: 'donor' | 'recipient' = 'donor';

  // ─── Manual / hardware-scanner input ──────────────────────────────────────────
  qrCode = '';

  // ─── Camera ───────────────────────────────────────────────────────────────────
  scannerEnabled = true;
  formats = [BarcodeFormat.QR_CODE];
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice?: MediaDeviceInfo;
  hasCamera = true;

  // ─── Request lifecycle ─────────────────────────────────────────────────────────
  processing = false;
  errorMsg = '';

  // ─── Last-scan summary card ─────────────────────────────────────────────────────
  lastScanned = '—';
  lastBloodType = '—';
  lastStatus = 'Waiting';
  lastStatusClass = 's-inactive'; // maps to the .status-pill modifiers in styles.css

  // ─── Mode toggle ────────────────────────────────────────────────────────────────
  setMode(m: 'donor' | 'recipient'): void {
    this.mode = m;
    this.qrCode = '';
    this.errorMsg = '';
    setTimeout(() => this.qrInput?.nativeElement?.focus(), 50);
  }

  // ─── Camera lifecycle ─────────────────────────────────────────────────────────────
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasCamera = devices.length > 0;
    if (!this.selectedDevice && devices.length) {
      // Prefer the rear camera on phones, fall back to the first one.
      this.selectedDevice =
        devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];
    }
  }

  onCamerasNotFound(): void {
    this.hasCamera = false;
  }

  onDeviceChange(deviceId: string): void {
    this.selectedDevice = this.availableDevices.find((d) => d.deviceId === deviceId);
  }

  // ─── Scan entry points ────────────────────────────────────────────────────────────
  /** Fired continuously by the camera while a code is in frame. */
  onScanSuccess(text: string): void {
    if (this.processing) return; // ignore the scan-storm
    this.handlePayload(text);
  }

  /** Fired by the manual field (Enter) or the submit button. */
  onSubmit(): void {
    if (this.processing) return;
    this.handlePayload(this.qrCode);
  }

  // ─── Core flow ──────────────────────────────────────────────────────────────────────
  private handlePayload(raw: string): void {
    this.errorMsg = '';

    const parsed = this.parseQr(raw);
    if (!parsed) {
      this.errorMsg = 'Unrecognised QR code format.';
      return;
    }

    this.processing = true;
    this.scannerEnabled = false; // pause the camera while we POST

    const body = { qrToken: parsed.qrToken };
    const call$ =
      this.mode === 'donor'
        ? this.donationsService.scanGeneralDonation(parsed.id, body)
        : this.requestsService.pickupScan(parsed.id, body);

    call$.subscribe({
      next: (res) => this.onResult(res),
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Scan failed. Please try again.';
        this.resetAfter();
      },
    });
  }

  private onResult(res: QrScanResponse): void {
    this.lastScanned = res.donorName ?? 'Unknown';
    this.lastBloodType = res.bloodType ?? '—';

    if (res.success) {
      this.lastStatus = 'Processed';
      this.lastStatusClass = 's-approved';
    } else {
      this.lastStatus = 'Rejected';
      this.lastStatusClass = 's-emergency';
      this.errorMsg = res.message;
    }

    this.resetAfter();
  }

  private resetAfter(): void {
    this.qrCode = '';
    this.processing = false;
    // Re-enable after a beat so the same physical code doesn't instantly re-fire.
    setTimeout(() => (this.scannerEnabled = true), 1200);
  }

  // ─── QR payload parsing ───────────────────────────────────────────────────────────────
  /**
   * The scanned QR must carry BOTH the entity id and the qrToken, because the scan
   * endpoints are POST .../{id}/scan (or /pickup-scan) with body { qrToken }.
   *
   * Handles two encodings — confirm the real one with the backend, then you can
   * delete the branch you don't need:
   *   1. URL / deep-link:  https://.../qr-details?id=123&token=abc
   *   2. JSON:             {"id":123,"qrToken":"abc"}
   */
  private parseQr(raw: string): ParsedQr | null {
    const text = (raw ?? '').trim();
    if (!text) return null;

    // 1) URL / deep-link form
    try {
      const url = new URL(text);
      const id = Number(url.searchParams.get('id'));
      const qrToken = url.searchParams.get('token') ?? url.searchParams.get('qrToken');
      if (id && qrToken) return { id, qrToken };
    } catch {
      /* not a URL — fall through */
    }

    // 2) JSON form
    try {
      const obj = JSON.parse(text);
      const id = Number(obj.id);
      const qrToken = obj.qrToken ?? obj.token;
      if (id && qrToken) return { id, qrToken };
    } catch {
      /* not JSON — fall through */
    }

    return null;
  }

  ngOnDestroy(): void {
    this.scannerEnabled = false; // turn the camera light off when leaving the page
  }
}