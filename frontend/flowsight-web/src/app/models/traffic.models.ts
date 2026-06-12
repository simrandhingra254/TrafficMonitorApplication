export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardResponse {
  countryTraffic: ChartPoint[];
  vehicleDistribution: ChartPoint[];
  totalVehicles: number;
  trendPercent: number;
  hasTrend: boolean;
}

export interface LookupItem {
  id: number;
  name: string;
}

export interface FilterOptions {
  countries: LookupItem[];
  vehicleTypes: LookupItem[];
}

export interface TrafficFilter {
  countryId?: number | null;
  vehicleTypeId?: number | null;
  from?: string | null;
  to?: string | null;
}

// ---- Live traffic map ----
export type CongestionLevel = 'low' | 'moderate' | 'heavy';

export interface MapSegment {
  id: number;
  name: string;
  path: [number, number][];
  volume: number;
  capacity: number;
  level: CongestionLevel;
  delayMinutes: number;
}

export interface MapIncident {
  id: number;
  title: string;
  description: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  severity: string;
}

export interface MapBorder {
  id: number;
  name: string;
  lat: number;
  lng: number;
  waitMinutes: number;
  level: CongestionLevel;
}

export interface MapResponse {
  hour: number;
  segments: MapSegment[];
  incidents: MapIncident[];
  borders: MapBorder[];
}
