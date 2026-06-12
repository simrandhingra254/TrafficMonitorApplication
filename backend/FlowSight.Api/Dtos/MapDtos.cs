namespace FlowSight.Api.Dtos;

public record SegmentDto(
    int Id,
    string Name,
    double[][] Path,
    int Volume,
    int Capacity,
    string Level,           // low | moderate | heavy
    int DelayMinutes);    

public record IncidentDto(
    int Id,
    string Title,
    string Description,
    double Lat,
    double Lng,
    int RadiusMeters,
    string Severity);

public record BorderDto(
    int Id,
    string Name,
    double Lat,
    double Lng,
    int WaitMinutes,
    string Level);          // low | moderate | heavy

public class MapResponse
{
    public int Hour { get; set; }
    public List<SegmentDto> Segments { get; set; } = new();
    public List<IncidentDto> Incidents { get; set; } = new();
    public List<BorderDto> Borders { get; set; } = new();
}
