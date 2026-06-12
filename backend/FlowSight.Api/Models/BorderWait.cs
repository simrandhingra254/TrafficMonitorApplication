namespace FlowSight.Api.Models;


public class BorderWait
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lng { get; set; }
    public int HourOfDay { get; set; }
    public int WaitMinutes { get; set; }
}
