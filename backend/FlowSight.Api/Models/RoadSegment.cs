namespace FlowSight.Api.Models;


public class RoadSegment
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PathJson { get; set; } = "[]";
    public int Capacity { get; set; }

    public ICollection<CongestionReading> Readings { get; set; } = new List<CongestionReading>();
}
