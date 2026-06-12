namespace FlowSight.Api.Models;


public class CongestionReading
{
    public int Id { get; set; }

    public int RoadSegmentId { get; set; }
    public RoadSegment? RoadSegment { get; set; }

    public int HourOfDay { get; set; }
    public int Volume { get; set; }
}
