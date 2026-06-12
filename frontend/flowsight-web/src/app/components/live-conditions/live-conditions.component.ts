import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapService } from '../../services/map.service';

interface DelayRow {
  name: string;
  minutes: number;
  level: string;        // low | moderate | heavy
}

interface Status {
  label: string;        // Normal | Moderate | Busy | Congested
  color: string;        // status colour 
}

const HOURS = [6, 12, 18, 22];

/**
 * an overall traffic-status badge
 * (Normal / Moderate / Busy / Congested) plus the most delayed routes and
 * border crossings, derived from the live-map data for the current hour
 */
@Component({
  selector: 'app-live-conditions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="head">
        <h3>Live Conditions</h3>
        <span class="status" [attr.data-status]="status.color">
          <span class="pip"></span> {{ status.label }}
        </span>
      </div>

      <div class="list">
        <div class="muted small">Top delays right now</div>
        <div class="row" *ngFor="let r of topDelays">
          <span class="dot" [attr.data-level]="r.level"></span>
          <span class="name">{{ r.name }}</span>
          <span class="mins">{{ r.minutes }} min</span>
        </div>
        <div class="muted small" *ngIf="!topDelays.length">No notable delays.</div>
      </div>

      <p class="error" *ngIf="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    h3 { margin: 0; font-size: 16px; }
    .status { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 999px; }
    .status .pip { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .status[data-status="normal"]    { color: #34d399; background: rgba(52,211,153,0.12); }
    .status[data-status="moderate"]  { color: #fbbf24; background: rgba(251,191,36,0.12); }
    .status[data-status="busy"]      { color: #fb923c; background: rgba(251,146,60,0.12); }
    .status[data-status="congested"] { color: #fb7185; background: rgba(251,113,133,0.12); }

    .list { display: flex; flex-direction: column; gap: 8px; }
    .small { font-size: 12px; }
    .muted { color: var(--muted); }
    .row { display: flex; align-items: center; gap: 10px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; }
    .dot[data-level="low"] { background: #34d399; }
    .dot[data-level="moderate"] { background: #fbbf24; }
    .dot[data-level="heavy"] { background: #fb7185; }
    .name { flex: 1; font-size: 14px; }
    .mins { font-weight: 700; font-size: 14px; }
    .error { color: #fb7185; margin: 8px 0 0; }
  `],
})
export class LiveConditionsComponent implements OnInit {
  status: Status = { label: 'Normal', color: 'normal' };
  topDelays: DelayRow[] = [];
  error = '';

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    const hour = nearestBucket(new Date().getHours());
    this.mapService.getMap(hour).subscribe({
      next: (data) => {
        this.status = computeStatus(data.segments.map((s) => s.volume / s.capacity));

        const roads: DelayRow[] = data.segments
          .filter((s) => s.delayMinutes > 0)
          .map((s) => ({ name: s.name, minutes: s.delayMinutes, level: s.level }));

        const borders: DelayRow[] = data.borders.map((b) => ({
          name: `${b.name} (border)`,
          minutes: b.waitMinutes,
          level: b.level,
        }));

        this.topDelays = [...roads, ...borders]
          .sort((a, b) => b.minutes - a.minutes)
          .slice(0, 5);
      },
      error: () => (this.error = 'Could not load live conditions.'),
    });
  }
}

function nearestBucket(hour: number): number {
  return HOURS.reduce((best, h) =>
    Math.abs(h - hour) < Math.abs(best - hour) ? h : best, HOURS[0]);
}

function computeStatus(ratios: number[]): Status {
  if (!ratios.length) return { label: 'Normal', color: 'normal' };
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  if (avg < 0.5) return { label: 'Normal', color: 'normal' };
  if (avg < 0.7) return { label: 'Moderate', color: 'moderate' };
  if (avg < 0.9) return { label: 'Busy', color: 'busy' };
  return { label: 'Congested', color: 'congested' };
}
