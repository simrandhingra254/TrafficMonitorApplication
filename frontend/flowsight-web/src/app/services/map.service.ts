import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './tokens';
import { MapResponse } from '../models/traffic.models';

@Injectable({ providedIn: 'root' })
export class MapService {
  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private baseUrl: string,
  ) {}

  getMap(hour: number): Observable<MapResponse> {
    const params = new HttpParams().set('hour', hour);
    return this.http.get<MapResponse>(`${this.baseUrl}/api/map`, { params });
  }
}
