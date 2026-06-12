import {
  AfterViewInit, Component, ElementRef, Input, OnChanges,
  OnDestroy, SimpleChanges, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ChartPoint } from '../../models/traffic.models';

Chart.register(...registerables);

const PALETTE = ['#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#fb7185'];

@Component({
  selector: 'app-vehicle-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3>Vehicle Type Distribution</h3>
      <p class="empty" *ngIf="!data.length">No data for the selected filters.</p>
      <canvas #canvas role="img" aria-label="Pie chart of vehicle type distribution"
              [hidden]="!data.length"></canvas>
    </div>
  `,
  styles: [`
    h3 { margin: 0 0 8px; }
    .empty { color: var(--muted); padding: 32px 0; text-align: center; }
  `],
})
export class VehicleChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ChartPoint[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

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
    const total = this.data.reduce((sum, d) => sum + d.value, 0);
    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.data.map((d) => d.label),
        datasets: [
          {
            data: this.data.map((d) => d.value),
            backgroundColor: this.data.map((_, i) => PALETTE[i % PALETTE.length]),
            borderColor: '#1e293b',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '55%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#e2e8f0' } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = Number(ctx.parsed);
                const pct = total ? Math.round((value / total) * 100) : 0;
                return ` ${ctx.label}: ${value.toLocaleString('en-US')} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }
}
