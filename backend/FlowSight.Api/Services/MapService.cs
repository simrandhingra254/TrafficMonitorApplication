using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Data;
using FlowSight.Api.Dtos;

namespace FlowSight.Api.Services;


/// Assembles the live-map payload for a given hour bucket: road segments with a
/// derived congestion level, active incidents, and border-crossing waits.

public class MapService : IMapService
{
    private static readonly int[] Buckets = { 6, 12, 18, 22 };
    private readonly AppDbContext _db;

    public MapService(AppDbContext db) => _db = db;

    public async Task<MapResponse> GetMapAsync(int hour, CancellationToken ct = default)
    {
        // Snap the requested hour to the nearest valid bucket (default midday).
        if (!Buckets.Contains(hour)) hour = 12;

        var segmentRows = await _db.RoadSegments.AsNoTracking()
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.PathJson,
                s.Capacity,
                Volume = s.Readings
                    .Where(r => r.HourOfDay == hour)
                    .Select(r => r.Volume)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var segments = segmentRows.Select(s => new SegmentDto(
            s.Id,
            s.Name,
            ParsePath(s.PathJson),
            s.Volume,
            s.Capacity,
            CongestionLevel(s.Volume, s.Capacity),
            DelayMinutes(s.Volume, s.Capacity))).ToList();

        var incidents = await _db.Incidents.AsNoTracking()
            .Where(i => i.HourOfDay == hour)
            .Select(i => new IncidentDto(
                i.Id, i.Title, i.Description, i.Lat, i.Lng, i.RadiusMeters, i.Severity))
            .ToListAsync(ct);

        var borders = (await _db.BorderWaits.AsNoTracking()
            .Where(w => w.HourOfDay == hour)
            .ToListAsync(ct))
            .Select(w => new BorderDto(
                w.Id, w.Name, w.Lat, w.Lng, w.WaitMinutes, WaitLevel(w.WaitMinutes)))
            .ToList();

        return new MapResponse
        {
            Hour = hour,
            Segments = segments,
            Incidents = incidents,
            Borders = borders
        };
    }

    private static double[][] ParsePath(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<double[][]>(json) ?? Array.Empty<double[]>();
        }
        catch
        {
            return Array.Empty<double[]>();
        }
    }

    private static string CongestionLevel(int volume, int capacity)
    {
        if (capacity <= 0) return "low";
        var ratio = (double)volume / capacity;
        if (ratio < 0.6) return "low";
        if (ratio < 0.85) return "moderate";
        return "heavy";
    }

    /// <summary>
    /// Estimated delay (minutes) versus free-flow. Below 40% utilisation there
    /// is effectively no delay; above that it scales up, so a heavily loaded
    /// corridor (~105% of capacity) reports roughly 14 minutes.
    /// </summary>
    private static int DelayMinutes(int volume, int capacity)
    {
        if (capacity <= 0) return 0;
        var ratio = (double)volume / capacity;
        var over = Math.Clamp(ratio - 0.4, 0, 1);
        return (int)Math.Round(over * 22);
    }

    private static string WaitLevel(int minutes) =>
        minutes < 15 ? "low" : minutes < 40 ? "moderate" : "heavy";
}
