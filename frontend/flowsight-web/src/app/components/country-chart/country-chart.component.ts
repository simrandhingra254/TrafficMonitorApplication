import {
  AfterViewInit, Component, ElementRef, Input, OnChanges,
  OnDestroy, SimpleChanges, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartPoint } from '../../models/traffic.models';

Chart.register(...registerables);

@Component({
  selector: 'app-country-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="chart-head">
        <h3>Country-wise Traffic</h3>
        <div class="toggle">
          <button [class.active]="type === 'bar'" (click)="setType('bar')">Bar</button>
          <button [class.active]="type === 'line'" (click)="setType('line')">Line</button>
        </div>
      </div>
      <p class="empty" *ngIf="!data.length">No data for the selected filters.</p>
      <canvas #canvas role="img" aria-label="Chart of traffic volume by country"
              [hidden]="!data.length"></canvas>
    </div>
  `,
  styles: [`
    .chart-head { display: flex; align-items: center; justify-content: space-between; }
    h3 { margin: 0 0 8px; }
    .toggle button { padding: 4px 12px; font-size: 13px; }
    .toggle button.active { background: var(--accent); color: #062a3a; border-color: var(--accent); font-weight: 600; }
    .toggle button:first-child { border-radius: 8px 0 0 8px; }
    .toggle button:last-child { border-radius: 0 8px 8px 0; margin-left: -1px; }
    .empty { color: var(--muted); padding: 32px 0; text-align: center; }
  `],
})
export class CountryChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ChartPoint[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  type: 'bar' | 'line' = 'bar';
  private chart?: Chart;

  setType(type: 'bar' | 'line'): void {
    this.type = type;
    if (this.chart) this.render();
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvasRef || !this.data.length) {
      this.chart?.destroy();
      this.chart = undefined;
      return;
    }
    this.chart?.destroy();

    // The dataset mixes bar- and line-specific options depending on the active
    // type, so the config is typed loosely to satisfy Chart.js' generics.
    const config = {
      type: this.type,
      data: {
        labels: this.data.map((d) => d.label),
        datasets: [
          {
            label: 'Vehicles',
            data: this.data.map((d) => d.value),
            backgroundColor: this.type === 'bar' ? '#38bdf8' : 'rgba(56,189,248,0.2)',
            borderColor: '#38bdf8',
            borderWidth: 2,
            borderRadius: 6,
            fill: this.type === 'line',
            tension: 0.3,
            pointBackgroundColor: '#38bdf8',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${Number(ctx.parsed.y).toLocaleString('en-US')} vehicles`,
            },
          },
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' }, beginAtZero: true },
        },
      },
    } as ChartConfiguration;

    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }
}
