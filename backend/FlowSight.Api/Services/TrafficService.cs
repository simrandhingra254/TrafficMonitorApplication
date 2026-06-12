using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Data;
using FlowSight.Api.Dtos;
using FlowSight.Api.Models;

namespace FlowSight.Api.Services;


/// Builds the two chart datasets by aggregating TrafficRecords in the database.
/// All filtering happens server-side so the payload stays small

public class TrafficService : ITrafficService
{
    private readonly AppDbContext _db;

    public TrafficService(AppDbContext db) => _db = db;

    private IQueryable<TrafficRecord> ApplyFilters(TrafficQuery q)
    {
        var query = _db.TrafficRecords.AsNoTracking().AsQueryable();

        if (q.CountryId is int cid)
            query = query.Where(r => r.CountryId == cid);
        if (q.VehicleTypeId is int vid)
            query = query.Where(r => r.VehicleTypeId == vid);
        if (q.From is DateOnly from)
            query = query.Where(r => r.RecordedOn >= from);
        if (q.To is DateOnly to)
            query = query.Where(r => r.RecordedOn <= to);

        return query;
    }

    public async Task<DashboardResponse> GetDashboardAsync(TrafficQuery q, CancellationToken ct = default)
    {
        var filtered = ApplyFilters(q);

        // Group + sum in the database, then order and project in memory.
        // (Keeping the OrderBy and the ChartPoint construction client-side
        // avoids EF translation edge-cases while the heavy aggregation still
        // runs as a single SQL GROUP BY.)
        var countryTraffic = (await filtered
                .GroupBy(r => r.Country!.Name)
                .Select(g => new { Label = g.Key, Value = g.Sum(r => r.VehicleCount) })
                .ToListAsync(ct))
            .OrderByDescending(x => x.Value)
            .Select(x => new ChartPoint(x.Label, x.Value))
            .ToList();

        var vehicleDistribution = (await filtered
                .GroupBy(r => r.VehicleType!.Name)
                .Select(g => new { Label = g.Key, Value = g.Sum(r => r.VehicleCount) })
                .ToListAsync(ct))
            .OrderByDescending(x => x.Value)
            .Select(x => new ChartPoint(x.Label, x.Value))
            .ToList();

        // Trend = % change in total volume between the two most recent dates.
        var dailyTotals = (await filtered
                .GroupBy(r => r.RecordedOn)
                .Select(g => new { Date = g.Key, Total = g.Sum(r => (long)r.VehicleCount) })
                .ToListAsync(ct))
            .OrderBy(x => x.Date)
            .ToList();

        var hasTrend = false;
        double trendPercent = 0;
        if (dailyTotals.Count >= 2)
        {
            var latest = dailyTotals[^1].Total;
            var previous = dailyTotals[^2].Total;
            if (previous > 0)
            {
                trendPercent = Math.Round((latest - previous) / (double)previous * 100, 1);
                hasTrend = true;
            }
        }

        return new DashboardResponse
        {
            CountryTraffic = countryTraffic,
            VehicleDistribution = vehicleDistribution,
            TotalVehicles = countryTraffic.Sum(p => p.Value),
            TrendPercent = trendPercent,
            HasTrend = hasTrend
        };
    }

    public async Task<FilterOptionsResponse> GetFilterOptionsAsync(CancellationToken ct = default)
    {
        var countries = await _db.Countries.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new LookupItem(c.Id, c.Name))
            .ToListAsync(ct);

        var vehicles = await _db.VehicleTypes.AsNoTracking()
            .OrderBy(v => v.Name)
            .Select(v => new LookupItem(v.Id, v.Name))
            .ToListAsync(ct);

        return new FilterOptionsResponse(countries, vehicles);
    }

    public async Task<TrafficRecord> AddRecordAsync(CreateTrafficDto dto, CancellationToken ct = default)
    {
        var record = new TrafficRecord
        {
            CountryId = dto.CountryId,
            VehicleTypeId = dto.VehicleTypeId,
            RecordedOn = dto.RecordedOn,
            VehicleCount = dto.VehicleCount
        };
        _db.TrafficRecords.Add(record);
        await _db.SaveChangesAsync(ct);
        return record;
    }
}
