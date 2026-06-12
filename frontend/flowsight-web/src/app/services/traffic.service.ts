import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './tokens';
import {
  DashboardResponse,
  FilterOptions,
  TrafficFilter,
} from '../models/traffic.models';


@Injectable({ providedIn: 'root' })
export class TrafficService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string,
  ) {}

  getDashboard(filter: TrafficFilter): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (filter.countryId) params = params.set('countryId', filter.countryId);
    if (filter.vehicleTypeId) params = params.set('vehicleTypeId', filter.vehicleTypeId);
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    return this.http.get<DashboardResponse>(`${this.baseUrl}/api/traffic`, { params });
  }

  getFilterOptions(): Observable<FilterOptions> {
    return this.http.get<FilterOptions>(`${this.baseUrl}/api/traffic/filters`);
  }

  /** Ingest a random observation to demo real-time updates. */
  addRandomRecord(options: FilterOptions): Observable<unknown> {
    const country = pickRandom(options.countries).id;
    const vehicle = pickRandom(options.vehicleTypes).id;
    const body = {
      countryId: country,
      vehicleTypeId: vehicle,
      recordedOn: new Date().toISOString().slice(0, 10),
      vehicleCount: 50 + Math.floor(Math.random() * 400),
    };
    return this.http.post(`${this.baseUrl}/api/traffic`, body);
  }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
