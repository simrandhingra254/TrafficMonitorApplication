import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule, HttpTestingController,
} from '@angular/common/http/testing';
import { TrafficService } from './traffic.service';
import { API_BASE_URL } from './tokens';
import { DashboardResponse } from '../models/traffic.models';

describe('TrafficService', () => {
  let service: TrafficService;
  let httpMock: HttpTestingController;
  const base = 'http://test-api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrafficService, { provide: API_BASE_URL, useValue: base }],
    });
    service = TestBed.inject(TrafficService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('requests the dashboard with filter params', () => {
    const stub: DashboardResponse = {
      countryTraffic: [], vehicleDistribution: [], totalVehicles: 0,
      trendPercent: 0, hasTrend: false,
    };

    service.getDashboard({ countryId: 2, from: '2026-06-01' }).subscribe((r) => {
      expect(r).toEqual(stub);
    });

    const req = httpMock.expectOne(
      (r) => r.url === `${base}/api/traffic`,
    );
    expect(req.request.params.get('countryId')).toBe('2');
    expect(req.request.params.get('from')).toBe('2026-06-01');
    expect(req.request.params.get('vehicleTypeId')).toBeNull();
    req.flush(stub);
  });

  it('loads filter options', () => {
    service.getFilterOptions().subscribe();
    const req = httpMock.expectOne(`${base}/api/traffic/filters`);
    expect(req.request.method).toBe('GET');
    req.flush({ countries: [], vehicleTypes: [] });
  });
});
