import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterOptions, TrafficFilter } from '../../models/traffic.models';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card filter-bar">
      <div class="field">
        <label for="country">Country</label>
        <select id="country" [(ngModel)]="filter.countryId">
          <option [ngValue]="null">All countries</option>
          <option *ngFor="let c of options?.countries" [ngValue]="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="field">
        <label for="vehicle">Vehicle type</label>
        <select id="vehicle" [(ngModel)]="filter.vehicleTypeId">
          <option [ngValue]="null">All vehicles</option>
          <option *ngFor="let v of options?.vehicleTypes" [ngValue]="v.id">{{ v.name }}</option>
        </select>
      </div>

      <div class="field">
        <label for="from">From</label>
        <input id="from" type="date" [(ngModel)]="filter.from" />
      </div>

      <div class="field">
        <label for="to">To</label>
        <input id="to" type="date" [(ngModel)]="filter.to" />
      </div>

      <div class="actions">
        <button class="primary" (click)="apply.emit(filter)">Apply</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  `,
  styles: [`
    .filter-bar { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 12px; color: var(--muted); }
    .actions { display: flex; gap: 8px; margin-left: auto; }
  `],
})
export class FilterBarComponent {
  @Input() options: FilterOptions | null = null;
  @Output() apply = new EventEmitter<TrafficFilter>();

  filter: TrafficFilter = { countryId: null, vehicleTypeId: null, from: null, to: null };

  reset(): void {
    this.filter = { countryId: null, vehicleTypeId: null, from: null, to: null };
    this.apply.emit(this.filter);
  }
}
