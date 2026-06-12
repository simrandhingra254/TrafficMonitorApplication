namespace FlowSight.Api.Dtos;

public record ChartPoint(string Label, long Value);

/// Both chart datasets plus summary stats in one payload
public class DashboardResponse
{
    public List<ChartPoint> CountryTraffic { get; set; } = new();
    public List<ChartPoint> VehicleDistribution { get; set; } = new();
    public long TotalVehicles { get; set; }

  
    public double TrendPercent { get; set; }
    public bool HasTrend { get; set; }
}

public record FilterOptionsResponse(
    IEnumerable<LookupItem> Countries,
    IEnumerable<LookupItem> VehicleTypes);

public record LookupItem(int Id, string Name);
