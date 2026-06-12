namespace FlowSight.Api.Models;

///on the map as a circle.

public class Incident
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int RadiusMeters { get; set; }
    public string Severity { get; set; } = "Medium"; // Low | Medium | High
    public int HourOfDay { get; set; }
}
