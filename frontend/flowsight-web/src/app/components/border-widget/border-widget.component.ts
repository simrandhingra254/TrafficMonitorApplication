import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapBorder } from '../../models/traffic.models';


@Component({
  selector: 'app-border-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3>🛂 Border Crossings — Southbound</h3>
      <p class="empty" *ngIf="!borders.length">No data.</p>
      <div class="row" *ngFor="let b of borders">
        <div class="name">{{ b.name }}</div>
        <div class="wait" [attr.data-level]="b.level">
          {{ b.waitMinutes }} min
        </div>
      </div>
    </div>
  `,
  styles: [`
    h3 { margin: 0 0 12px; font-size: 16px; }
    .empty { color: var(--muted); }
    .row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .row:last-child { border-bottom: none; }
    .name { font-size: 14px; }
    .wait { font-weight: 700; padding: 3px 10px; border-radius: 999px; font-size: 13px; }
    .wait[data-level="low"] { background: rgba(52,211,153,0.15); color: #34d399; }
    .wait[data-level="moderate"] { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .wait[data-level="heavy"] { background: rgba(251,113,133,0.15); color: #fb7185; }
  `],
})
export class BorderWidgetComponent {
  @Input() borders: MapBorder[] = [];
}
