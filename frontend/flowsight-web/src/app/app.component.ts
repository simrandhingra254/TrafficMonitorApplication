import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { TrafficService } from './services/traffic.service';
import { RealtimeService } from './services/realtime.service';
import {
  DashboardResponse, FilterOptions, TrafficFilter,
} from './models/traffic.models';

import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { CountryChartComponent } from './components/country-chart/country-chart.component';
import { VehicleChartComponent } from './components/vehicle-chart/vehicle-chart.component';
import { LiveFeedComponent } from './components/live-feed/live-feed.component';
import { LiveConditionsComponent } from './components/live-conditions/live-conditions.component';
import { MapDashboardComponent } from './components/map-dashboard/map-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FilterBarComponent, KpiCardsComponent, CountryChartComponent,
    VehicleChartComponent, LiveFeedComponent, LiveConditionsComponent,
    MapDashboardComponent,
  ],
  template: `
    <div class="container">
      <header>
        <div>
          <h1>🚦 FlowSight</h1>
          <p class="sub">AI-powered V2X traffic intelligence — interactive, filterable, real-time.</p>
        </div>
        <div class="updated" *ngIf="lastUpdated" [class.pulse]="justUpdated">
          <span class="dot"></span>
          Updated {{ lastUpdated | date: 'mediumTime' }}
        </div>
      </header>

      <nav class="tabs">
        <button [class.active]="tab === 'dashboard'" (click)="tab = 'dashboard'">📊 Dashboard</button>
        <button [class.active]="tab === 'map'" (click)="tab = 'map'">🗺️ Live Map</button>
      </nav>

      <ng-container *ngIf="tab === 'dashboard'">
        <app-filter-bar [options]="options" (apply)="onApply($event)"></app-filter-bar>

        <div class="active-filters" *ngIf="activeFilters.length">
          <span class="muted">Showing:</span>
          <span class="chip" *ngFor="let f of activeFilters">{{ f }}</span>
        </div>

        <app-kpi-cards [dashboard]="dashboard"></app-kpi-cards>

        <div class="conditions-row">
          <app-live-feed [connected]="connected" (simulate)="onSimulate()"></app-live-feed>
          <app-live-conditions></app-live-conditions>
        </div>

        <div class="loading card" *ngIf="loading">
          <span class="spinner"></span> Loading traffic data…
        </div>

        <div class="grid" *ngIf="!loading">
          <app-country-chart [data]="dashboard?.countryTraffic || []"></app-country-chart>
          <app-vehicle-chart [data]="dashboard?.vehicleDistribution || []"></app-vehicle-chart>
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
      </ng-container>

      <app-map-dashboard *ngIf="tab === 'map'"></app-map-dashboard>
    </div>

    <div class="toasts">
      <div class="toast" *ngFor="let t of toasts">{{ t.text }}</div>
    </div>
  `,
  styles: [`
    header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    h1 { margin: 0; color: var(--accent); }
    .sub { margin: 4px 0 0; color: var(--muted); }
    .container > * { margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .error { color: #fb7185; }

    .tabs { display: flex; gap: 8px; }
    .tabs button { font-size: 14px; padding: 8px 18px; }
    .tabs button.active { background: var(--accent); color: #062a3a; border-color: var(--accent); font-weight: 600; }

    .conditions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .conditions-row > * { margin-bottom: 0; }

    .toasts { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 1000; }
    .toast {
      background: var(--panel); border: 1px solid var(--accent); color: var(--text);
      padding: 12px 16px; border-radius: 10px; font-size: 14px; min-width: 240px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      animation: slidein 0.25s ease;
    }
    @keyframes slidein { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    @media (max-width: 820px) { .conditions-row { grid-template-columns: 1fr; } }

    .updated { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); }
    .updated .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; }
    .updated.pulse .dot { animation: ping 0.9s ease-out; }
    @keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.7); } 100% { box-shadow: 0 0 0 10px rgba(52,211,153,0); } }

    .active-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .muted { color: var(--muted); font-size: 13px; }
    .chip {
      background: var(--panel-2); border: 1px solid var(--border);
      border-radius: 999px; padding: 4px 12px; font-size: 13px; color: var(--text);
    }

    .loading { display: flex; align-items: center; gap: 12px; color: var(--muted); }
    .spinner {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid var(--border); border-top-color: var(--accent);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 820px) {
      .grid { grid-template-columns: 1fr; }
      header { flex-direction: column; gap: 8px; }
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  options: FilterOptions | null = null;
  dashboard: DashboardResponse | null = null;
  connected = false;
  loading = true;
  error = '';
  lastUpdated: Date | null = null;
  justUpdated = false;
  activeFilters: string[] = [];
  tab: 'dashboard' | 'map' = 'dashboard';
  toasts: { id: number; text: string }[] = [];

  private currentFilter: TrafficFilter = {};
  private lastTotal: number | null = null;
  private toastId = 0;
  private subs = new Subscription();

  constructor(
    private traffic: TrafficService,
    private realtime: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.traffic.getFilterOptions().subscribe({
      next: (opts) => (this.options = opts),
      error: () => (this.error = 'Could not load filter options. Is the API running?'),
    });

    this.load(this.currentFilter);

    this.realtime.start();
    this.connected = true;
    this.subs.add(
      this.realtime.dashboardUpdates.subscribe((data) => {
        // Compare against the last known total to surface a real delta.
        if (this.lastTotal !== null && data.totalVehicles !== this.lastTotal) {
          this.notifyDelta(data.totalVehicles - this.lastTotal);
        }
        this.lastTotal = data.totalVehicles;

        // Live pushes carry the unfiltered dashboard. Only replace the view
        // when no filter is active, so a user's filtered view is preserved.
        if (!this.hasActiveFilter()) {
          this.dashboard = data;
        }
        this.markUpdated();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.realtime.stop();
  }

  onApply(filter: TrafficFilter): void {
    this.currentFilter = filter;
    this.activeFilters = this.describeFilters(filter);
    this.load(filter);
  }

  onSimulate(): void {
    if (!this.options) return;
    this.traffic.addRandomRecord(this.options).subscribe({
      error: () => (this.error = 'Failed to push a live event.'),
    });
  }

  private load(filter: TrafficFilter): void {
    this.loading = true;
    this.traffic.getDashboard(filter).subscribe({
      next: (data) => {
        this.dashboard = data;
        if (!this.hasActiveFilter()) this.lastTotal = data.totalVehicles;
        this.error = '';
        this.loading = false;
        this.markUpdated();
      },
      error: () => {
        this.error = 'Could not load traffic data. Is the API running?';
        this.loading = false;
      },
    });
  }

  private markUpdated(): void {
    this.lastUpdated = new Date();
    this.justUpdated = true;
    setTimeout(() => (this.justUpdated = false), 1000);
  }

  private notifyDelta(delta: number): void {
    const base = this.lastTotal ?? 0;
    const pct = base > 0 ? Math.round((delta / base) * 1000) / 10 : 0;
    const sign = delta > 0 ? '+' : '';
    const arrow = delta > 0 ? '▲' : '▼';
    this.addToast(
      `🚗 ${arrow} ${sign}${delta.toLocaleString('en-US')} vehicles detected` +
        (pct ? ` (${sign}${pct}%)` : ''),
    );
  }

  private addToast(text: string): void {
    const id = ++this.toastId;
    this.toasts = [...this.toasts, { id, text }];
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 5000);
  }

  private hasActiveFilter(): boolean {
    const f = this.currentFilter;
    return !!(f.countryId || f.vehicleTypeId || f.from || f.to);
  }

  private describeFilters(f: TrafficFilter): string[] {
    const out: string[] = [];
    if (f.countryId) {
      const c = this.options?.countries.find((x) => x.id === f.countryId);
      if (c) out.push(c.name);
    }
    if (f.vehicleTypeId) {
      const v = this.options?.vehicleTypes.find((x) => x.id === f.vehicleTypeId);
      if (v) out.push(v.name);
    }
    if (f.from) out.push('from ' + f.from);
    if (f.to) out.push('to ' + f.to);
    return out;
  }
}
