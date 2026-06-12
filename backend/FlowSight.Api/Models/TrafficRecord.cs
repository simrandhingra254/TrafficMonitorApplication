namespace FlowSight.Api.Models;


public class TrafficRecord
{
    public int Id { get; set; }

    public int CountryId { get; set; }
    public Country? Country { get; set; }

    public int VehicleTypeId { get; set; }
    public VehicleType? VehicleType { get; set; }

    public DateOnly RecordedOn { get; set; }
    public int VehicleCount { get; set; }
}
