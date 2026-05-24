import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-scanning',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './scaning.html',
  styleUrl: './scaning.css',
})
export class Scaning {

  @ViewChild('qrInput') qrInput!: ElementRef;

  mode: 'donor' | 'recipient' = 'donor';
  qrCode: string = '';

  lastScanned: string = 'Ahmed Hassan — 09:42 AM';
  lastBloodType: string = 'A+';
  lastStatus: string = 'Processed';
  lastStatusBg: string = '#eaf3de';
  lastStatusColor: string = '#27500A';

  setMode(m: 'donor' | 'recipient'): void {
    this.mode = m;
    this.qrCode = '';
    // reset last scan info per mode
    if (m === 'donor') {
      this.lastScanned = 'Ahmed Hassan — 09:42 AM';
      this.lastBloodType = 'A+';
      this.lastStatus = 'Processed';
      this.lastStatusBg = '#eaf3de';
      this.lastStatusColor = '#27500A';
    } else {
      this.lastScanned = 'Nour Saleh — 10:15 AM';
      this.lastBloodType = 'AB+';
      this.lastStatus = 'Pending';
      this.lastStatusBg = '#faeeda';
      this.lastStatusColor = '#633806';
    }
    setTimeout(() => this.qrInput?.nativeElement?.focus(), 50);
  }

  onSubmit(): void {
    if (!this.qrCode.trim()) return;

    if (this.mode === 'donor') {
      // this.donorService.processScan(this.qrCode).subscribe(...)
      console.log('Donor QR:', this.qrCode);
    } else {
      // this.recipientService.processScan(this.qrCode).subscribe(...)
      console.log('Recipient QR:', this.qrCode);
    }

    this.qrCode = '';
    this.qrInput?.nativeElement?.focus();
  }
}