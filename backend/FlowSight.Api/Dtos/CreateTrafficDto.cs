using System.ComponentModel.DataAnnotations;

namespace FlowSight.Api.Dtos;


public class CreateTrafficDto
{
    [Required] public int CountryId { get; set; }
    [Required] public int VehicleTypeId { get; set; }
    [Required] public DateOnly RecordedOn { get; set; }
    [Range(0, int.MaxValue)] public int VehicleCount { get; set; }
}
