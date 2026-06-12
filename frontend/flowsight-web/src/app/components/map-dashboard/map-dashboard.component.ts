import {
  AfterViewInit, Component, ElementRef, OnDestroy, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { MapService } from '../../services/map.service';
import {
  CongestionLevel, MapBorder, MapIncident, MapSegment,
} from '../../models/traffic.models';
import { BorderWidgetComponent } from '../border-widget/border-widget.component';

const HOURS = [6, 12, 18, 22];
const HOUR_LABELS = ['6:00 AM', '12:00 PM', '6:00 PM', '10:00 PM'];

const LEVEL_COLOR: Record<CongestionLevel, string> = {
  low: '#34d399',
  moderate: '#fbbf24',
  heavy: '#fb7185',
};

/**
 * Interactive Greater Vancouver traffic map segments are coloured by
 * congestion level and incidents are drawn with an impact radius and and a
 * time-travel slider steps through 
 */
@Component({
  selector: 'app-map-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BorderWidgetComponent],
  template: `
    <div class="card controls">
      <div class="time">
        <label>Time of day: <strong>{{ hourLabel }}</strong></label>
        <input type="range" min="0" max="3" step="1"
               [(ngModel)]="hourIndex" (input)="onHourChange()" />
        <div class="ticks">
          <span *ngFor="let l of hourLabels">{{ l }}</span>
        </div>
      </div>
      <label class="toggle">
        <input type="checkbox" [(ngModel)]="showIncidents" (change)="redraw()" />
        Show incidents
      </label>
    </div>

    <div class="map-wrap card">
      <div #map class="map"></div>
      <div class="legend">
        <span><i style="background:#34d399"></i> Low</span>
        <span><i style="background:#fbbf24"></i> Moderate</span>
        <span><i style="background:#fb7185"></i> Heavy</span>
        <span><i class="ring"></i> Incident radius</span>
      </div>
    </div>

    <div class="grid">
      <app-border-widget [borders]="borders"></app-border-widget>
      <div class="card incidents">
        <h3>⚠️ Active Incidents — {{ hourLabel }}</h3>
        <p class="empty" *ngIf="!incidents.length">No incidents reported at this hour.</p>
        <div class="incident" *ngFor="let i of incidents">
          <span class="sev" [attr.data-sev]="i.severity">{{ i.severity }}</span>
          <div>
            <div class="title">{{ i.title }}</div>
            <div class="desc">{{ i.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <p class="error" *ngIf="error">{{ error }}</p>
  `,
  styles: [`
    :host { display: block; }
    .card { margin-bottom: 16px; }
    .controls { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .time { flex: 1; min-width: 260px; }
    .time label { font-size: 14px; color: var(--muted); }
    .time strong { color: var(--accent); }
    input[type="range"] { width: 100%; margin: 10px 0 4px; accent-color: var(--accent); }
    .ticks { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
    .toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; }

    .map-wrap { position: relative; padding: 0; overflow: hidden; }
    .map { height: 460px; width: 100%; border-radius: 12px; }
    .legend {
      position: absolute; bottom: 12px; right: 12px; z-index: 500;
      background: rgba(15,23,42,0.85); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px;
      font-size: 12px; color: var(--text);
    }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .legend i { width: 14px; height: 6px; border-radius: 2px; display: inline-block; }
    .legend i.ring { width: 12px; height: 12px; border-radius: 50%; background: transparent; border: 2px solid #fb7185; }

    .grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px; }
    .incidents h3 { margin: 0 0 12px; font-size: 16px; }
    .empty { color: var(--muted); }
    .incident { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
    .incident:last-child { border-bottom: none; }
    .sev { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; height: fit-content; text-transform: uppercase; }
    .sev[data-sev="High"] { background: rgba(251,113,133,0.15); color: #fb7185; }
    .sev[data-sev="Medium"] { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .sev[data-sev="Low"] { background: rgba(52,211,153,0.15); color: #34d399; }
    .title { font-weight: 600; font-size: 14px; }
    .desc { font-size: 13px; color: var(--muted); }
    .error { color: #fb7185; }

    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  `],
})
export class MapDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') mapRef!: ElementRef<HTMLDivElement>;

  hourIndex = 1; // default midday
  hourLabels = HOUR_LABELS;
  showIncidents = true;
  error = '';

  segments: MapSegment[] = [];
  incidents: MapIncident[] = [];
  borders: MapBorder[] = [];

  private map?: L.Map;
  private layers = L.layerGroup();

  constructor(private mapService: MapService) {}

  get hourLabel(): string {
    return HOUR_LABELS[this.hourIndex];
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapRef.nativeElement, {
      center: [49.22, -122.98],
      zoom: 11,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.layers.addTo(this.map);
    // Ensure correct sizing now the container is visible.
    setTimeout(() => this.map?.invalidateSize(), 0);

    this.load();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  onHourChange(): void {
    this.load();
  }

  private load(): void {
    const hour = HOURS[this.hourIndex];
    this.mapService.getMap(hour).subscribe({
      next: (data) => {
        this.segments = data.segments;
        this.incidents = data.incidents;
        this.borders = data.borders;
        this.error = '';
        this.redraw();
      },
      error: () => (this.error = 'Could not load map data. Is the API running?'),
    });
  }

  redraw(): void {
    if (!this.map) return;
    this.layers.clearLayers();

    for (const s of this.segments) {
      if (!s.path?.length) continue;
      L.polyline(s.path as L.LatLngExpression[], {
        color: LEVEL_COLOR[s.level],
        weight: 6,
        opacity: 0.85,
      })
        .bindTooltip(
          `<strong>${s.name}</strong><br>${s.volume.toLocaleString()} / ${s.capacity.toLocaleString()} veh/hr (${s.level})`,
        )
        .addTo(this.layers);
    }

    if (this.showIncidents) {
      for (const i of this.incidents) {
        L.circle([i.lat, i.lng], {
          radius: i.radiusMeters,
          color: '#fb7185',
          fillColor: '#fb7185',
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(this.layers);

        L.circleMarker([i.lat, i.lng], {
          radius: 7,
          color: '#fff',
          fillColor: '#fb7185',
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(`<strong>${i.title}</strong><br>${i.description}`)
          .addTo(this.layers);
      }
    }
  }
}
