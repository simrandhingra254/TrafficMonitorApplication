import { Inject, Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './tokens';
import { DashboardResponse } from '../models/traffic.models';

/**
 * DashboardUpdated pushes from the server.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private connection?: signalR.HubConnection;
  private updates$ = new Subject<DashboardResponse>();

  constructor(@Inject(API_BASE_URL) private baseUrl: string) {}

  get dashboardUpdates(): Observable<DashboardResponse> {
    return this.updates$.asObservable();
  }

  start(): void {
    if (this.connection) return;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/traffic`)
      .withAutomaticReconnect()
      .build();

    this.connection.on('DashboardUpdated', (data: DashboardResponse) =>
      this.updates$.next(data),
    );

    this.connection.start().catch((err) => console.error('SignalR error:', err));
  }

  stop(): void {
    this.connection?.stop();
    this.connection = undefined;
  }
}
