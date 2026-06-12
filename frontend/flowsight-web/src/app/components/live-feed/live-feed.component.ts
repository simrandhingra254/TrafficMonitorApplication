import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card live">
      <div class="status">
        <span class="dot" [class.on]="connected"></span>
        {{ connected ? 'Live — real-time updates on' : 'Connecting…' }}
      </div>
      <button class="primary" (click)="simulate.emit()">Simulate live traffic event</button>
    </div>
  `,
  styles: [`
    .live { display: flex; align-items: center; justify-content: space-between; }
    .status { display: flex; align-items: center; gap: 8px; color: var(--muted); }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #64748b; }
    .dot.on { background: #34d399; box-shadow: 0 0 8px #34d399; }
  `],
})
export class LiveFeedComponent {
  @Input() connected = false;
  @Output() simulate = new EventEmitter<void>();
}
