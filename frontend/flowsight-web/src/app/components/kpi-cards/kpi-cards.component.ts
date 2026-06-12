import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardResponse } from '../../models/traffic.models';

interface Trend {
  text: string;
  dir: 'up' | 'down' | 'flat';
}

interface Kpi {
  label: string;
  value: string;
  hint?: string;
  trend?: Trend;
}

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-row">
      <div class="kpi-card card" *ngFor="let k of kpis">
        <span class="kpi-label">{{ k.label }}</span>
        <span class="kpi-value">{{ k.value }}</span>
        <span class="kpi-trend" *ngIf="k.trend" [attr.data-dir]="k.trend.dir">
          {{ k.trend.dir === 'up' ? '▲' : k.trend.dir === 'down' ? '▼' : '–' }}
          {{ k.trend.text }}
        </span>
        <span class="kpi-hint" *ngIf="k.hint && !k.trend">{{ k.hint }}</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .kpi-card:hover { transform: translateY(-2px); border-color: var(--accent); }
    .kpi-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-value { font-size: 24px; font-weight: 700; color: var(--text); }
    .kpi-hint { font-size: 12px; color: var(--accent); }
    .kpi-trend { font-size: 13px; font-weight: 600; }
    .kpi-trend[data-dir="up"] { color: #34d399; }
    .kpi-trend[data-dir="down"] { color: #fb7185; }
    .kpi-trend[data-dir="flat"] { color: var(--muted); }
  `],
})
export class KpiCardsComponent {
  @Input() set dashboard(value: DashboardResponse | null) {
    this.kpis = value ? this.build(value) : [];
  }

  kpis: Kpi[] = [];

  private build(d: DashboardResponse): Kpi[] {
    const topCountry = d.countryTraffic[0];
    const topVehicle = d.vehicleDistribution[0];
    const topShare =
      topVehicle && d.totalVehicles > 0
        ? Math.round((topVehicle.value / d.totalVehicles) * 100)
        : 0;
      const avgPerCountry = d.countryTraffic.length > 0
     ? Math.round(d.totalVehicles / d.countryTraffic.length)
     : 0;
    return [
      {
        label: 'Total Vehicles',
        value: format(d.totalVehicles),
        trend: d.hasTrend ? trendFor(d.trendPercent) : undefined,
      },
      { label: 'Countries', value: String(d.countryTraffic.length) },
      { label: 'Vehicle Types', value: String(d.vehicleDistribution.length) },
      {
        label: 'Top Country',
        value: topCountry?.label ?? '—',
        hint: topCountry ? format(topCountry.value) + ' vehicles' : undefined,
      },
      {
        label: 'Top Vehicle',
        value: topVehicle?.label ?? '—',
        hint: topVehicle ? topShare + '% of total' : undefined,
      },
      {
        label: 'Avg per Country',
        value: format(avgPerCountry),
      }
     
    ];
  }
}

function trendFor(percent: number): Trend {
  const dir = percent > 0 ? 'up' : percent < 0 ? 'down' : 'flat';
  const sign = percent > 0 ? '+' : '';
  return { text: `${sign}${percent}% vs prev. day`, dir };
}

function format(n: number): string {
  return n.toLocaleString('en-US');
}
