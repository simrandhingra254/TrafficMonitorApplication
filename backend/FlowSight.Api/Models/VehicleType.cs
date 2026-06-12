namespace FlowSight.Api.Models;


public class VehicleType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<TrafficRecord> TrafficRecords { get; set; } = new List<TrafficRecord>();
}
