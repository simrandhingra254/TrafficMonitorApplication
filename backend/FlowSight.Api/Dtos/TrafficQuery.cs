namespace FlowSight.Api.Dtos;


public class TrafficQuery
{
    public int? CountryId { get; set; }
    public int? VehicleTypeId { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}
