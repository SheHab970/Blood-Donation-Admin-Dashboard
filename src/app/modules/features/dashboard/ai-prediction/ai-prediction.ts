import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';

import {
  BloodUsageService,
  BloodUsageResponse,
  UsagePeriod,
} from '../../../../Core/Services/blood-usage';

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

@Component({
  selector: 'app-ai-prediction',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './ai-prediction.html',
  styleUrl: './ai-prediction.css',
})
export class AiPrediction implements OnInit {
  private bloodUsageService = inject(BloodUsageService);

  // Period filter state
  selectedPeriod: UsagePeriod = '1month';
  isLoading = false;

  readonly periods: { label: string; value: UsagePeriod }[] = [
    { label: '1 day',     value: '1day'    },
    { label: '7 days',    value: '7days'   },
    { label: '1 month',   value: '1month'  },
    { label: '3 months',  value: '3months' },
    { label: '6 months',  value: '6months' },
  ];

  // Exact variable names the HTML already binds to
  data: any             = {};
  options: any          = {};
  barChart_data: any    = {};
  barChart_options: any = {};

  ngOnInit(): void {
    this.load();
  }

  selectPeriod(p: UsagePeriod): void {
    this.selectedPeriod = p;
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.bloodUsageService.getBloodUsage(this.selectedPeriod).subscribe({
      next:  (res) => { this.buildCharts(res); this.isLoading = false; },
      error: (err) => { console.error(err);    this.isLoading = false; },
    });
  }

  private buildCharts(res: BloodUsageResponse): void {
    const mutedColor = '#9CA3AF';
    const textColor  = '#374151';

    const labels = res.bloodUsage.map((e) => LABELS[e.bloodType] ?? e.bloodType);
    const units  = res.bloodUsage.map((e) => e.usedUnits);
    const pcts   = res.bloodUsage.map((e) => e.percentage);
    const bgs    = res.bloodUsage.map((_, i) => COLORS[i % COLORS.length]);

    // ── "Line" chart — rendered as bar so all blood types show as columns,
    //    not isolated dots. A true line needs multiple time points which
    //    this single-snapshot API cannot provide.
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

    // ── Bar chart — percentage breakdown ─────────────────────────────────
    this.barChart_data = {
      labels,
      datasets: [{
        label:           'Usage %',
        data:            pcts,
        backgroundColor: '#A32D2D',
        borderColor:     '#791F1F',
        borderWidth:     1,
        borderRadius:    6,
      }],
    };

    this.barChart_options = {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: {
          callbacks: { label: (ctx: any) => ` ${ctx.parsed.y}%` },
        },
      },
      scales: {
        x: {
          ticks: { color: '#A32D2D', font: { size: 14, weight: '600' } },
          grid:  { display: false },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: mutedColor,
            font:  { size: 14, weight: '500' },
            callback: (v: any) => v + '%',
          },
          grid: { color: '#f0ebe5' },
        },
      },
    };
  }
}