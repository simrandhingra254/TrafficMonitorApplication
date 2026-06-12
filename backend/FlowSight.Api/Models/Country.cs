namespace FlowSight.Api.Models;


public class Country
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IsoCode { get; set; } = string.Empty;

    public ICollection<TrafficRecord> TrafficRecords { get; set; } = new List<TrafficRecord>();
}
