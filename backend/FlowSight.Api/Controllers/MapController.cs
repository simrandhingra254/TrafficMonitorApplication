using Microsoft.AspNetCore.Mvc;
using FlowSight.Api.Dtos;
using FlowSight.Api.Services;

namespace FlowSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MapController : ControllerBase
{
    private readonly IMapService _service;

    public MapController(IMapService service) => _service = service;

    /// Live-map data (6, 12, 18 or 22) Returns road
    /// segments with congestion levels, incidents, and border-crossing waits

    [HttpGet]
    public async Task<ActionResult<MapResponse>> Get([FromQuery] int hour = 12, CancellationToken ct = default)
        => Ok(await _service.GetMapAsync(hour, ct));
}
