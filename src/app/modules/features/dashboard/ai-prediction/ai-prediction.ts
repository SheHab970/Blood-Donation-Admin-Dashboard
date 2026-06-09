import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

import {
  BloodUsageService,
  BloodUsageResponse,
  UsagePeriod,
} from '../../../../Core/Services/blood-usage';
import { PredictionsResponse } from '../../../../Core/interface/api-models';

const LABELS: Record<string, string> = {
  APositive:  'A+',  ANegative:  'A−',
  BPositive:  'B+',  BNegative:  'B−',
  ABPositive: 'AB+', ABNegative: 'AB−',
  OPositive:  'O+',  ONegative:  'O−',
};

const COLORS: string[] = [
  '#A32D2D', '#378ADD', '#639922', '#BA7517',
  '#534AB7', '#993556', '#0891B2', '#D97706',
];

interface HorizonOption {
  label:       string;
  horizonDays: number;
  usagePeriod: UsagePeriod;
}

@Component({
  selector: 'app-ai-prediction',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './ai-prediction.html',
  styleUrl: './ai-prediction.css',
})
export class AiPrediction implements OnInit {
  private bloodUsageService = inject(BloodUsageService);

  readonly periods: HorizonOption[] = [
    { label: '7 Days',  horizonDays: 7,  usagePeriod: '7days'  },
    { label: '14 Days', horizonDays: 14, usagePeriod: '1month' },
    { label: '1 Month', horizonDays: 30, usagePeriod: '1month' },
  ];

  selectedPeriod: HorizonOption = this.periods[0];

  // Chart loading flags
  isLoading           = false;
  isPredictionLoading = false;

  // Stat card skeleton flag
  isStatsLoading = false;

  // Stat card values
  demandLevel        = '—';
  totalExpectedUnits = 0;
  overallAccuracy    = 0;

  // Chart data
  data: any             = {};
  options: any          = {};
  barChart_data: any    = {};
  barChart_options: any = {};

  ngOnInit(): void {
    this.load();
    this.loadPredictions();
  }

  selectPeriod(p: HorizonOption): void {
    this.selectedPeriod = p;
    this.load();
    this.loadPredictions();
  }

  private load(): void {
    this.isLoading = true;
    this.bloodUsageService.getBloodUsage(this.selectedPeriod.usagePeriod).subscribe({
      next:  (res) => { this.buildUsageChart(res); this.isLoading = false; },
      error: (err) => { console.error(err);         this.isLoading = false; },
    });
  }

  private loadPredictions(): void {
    this.isPredictionLoading = true;
    this.isStatsLoading      = true;
    this.bloodUsageService.getPredictions(this.selectedPeriod.horizonDays).subscribe({
      next: (res) => {
        this.buildPredictionChart(res);
        this.isPredictionLoading = false;
        this.isStatsLoading      = false;
      },
      error: (err) => {
        console.error(err);
        this.isPredictionLoading = false;
        this.isStatsLoading      = false;
      },
    });
  }

  private buildUsageChart(res: BloodUsageResponse): void {
    const mutedColor = '#9CA3AF';
    const textColor  = '#374151';

    const labels = res.bloodUsage.map((e) => LABELS[e.bloodType] ?? e.bloodType);
    const units  = res.bloodUsage.map((e) => e.usedUnits);
    const bgs    = res.bloodUsage.map((_, i) => COLORS[i % COLORS.length]);

    this.data = {
      labels,
      datasets: [{
        label:           'Units used',
        data:            units,
        backgroundColor: bgs,
        borderColor:     bgs.map((c) => c + 'CC'),
        borderWidth:     4,
        borderRadius:    6,
      }],
    };

    this.options = {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: textColor } },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ` ${ctx.parsed.y} units`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#A32D2D', font: { size: 12, weight: '600' } },
          grid:  { display: true },
        },
        y: {
          beginAtZero: true,
          ticks: { color: mutedColor, stepSize: 2 },
          grid:  { color: '#f0ebe5' },
          title: { display: true, text: 'Units used', color: mutedColor, font: { size: 11 } },
        },
      },
    };
  }

  private buildPredictionChart(res: PredictionsResponse): void {
    const mutedColor = '#9CA3AF';
    const textColor  = '#374151';

    this.demandLevel        = res.demandLevel;
    this.totalExpectedUnits = Math.round(res.totalExpectedUnits);
    this.overallAccuracy    = Math.round(res.overallAccuracy);

    const labels       = res.predictions.map((e) => e.bloodType);
    const required     = res.predictions.map((e) => e.requiredUnits);
    const currentStock = res.predictions.map((e) => e.currentStock);

    this.barChart_data = {
      labels,
      datasets: [
        {
          label:           'Required units',
          data:            required,
          backgroundColor: '#A32D2D',
          borderColor:     '#791F1F',
          borderWidth:     1,
          borderRadius:    6,
        },
        {
          label:           'Current stock',
          data:            currentStock,
          backgroundColor: '#378ADD',
          borderColor:     '#1D5FA8',
          borderWidth:     1,
          borderRadius:    6,
        },
      ],
    };

    this.barChart_options = {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: {
          callbacks: {
            label: (ctx: any) => ` ${ctx.parsed.y} units`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#A32D2D', font: { size: 14, weight: '600' } },
          grid:  { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: mutedColor, font: { size: 14, weight: '500' } },
          grid:  { color: '#f0ebe5' },
          title: { display: true, text: 'Units', color: mutedColor, font: { size: 11 } },
        },
      },
    };
  }
}
