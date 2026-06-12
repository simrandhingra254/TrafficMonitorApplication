using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using FlowSight.Api.Dtos;
using FlowSight.Api.Hubs;
using FlowSight.Api.Services;

namespace FlowSight.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrafficController : ControllerBase
{
    private readonly ITrafficService _service;
    private readonly IHubContext<TrafficHub> _hub;

    public TrafficController(ITrafficService service, IHubContext<TrafficHub> hub)
    {
        _service = service;
        _hub = hub;
    }

    /// Aggregated dashboard data for both charts and optionally filtered
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get([FromQuery] TrafficQuery query, CancellationToken ct)
        => Ok(await _service.GetDashboardAsync(query, ct));

    /// Available countries and vehicle types for the filtering process
    [HttpGet("filters")]
    public async Task<ActionResult<FilterOptionsResponse>> Filters(CancellationToken ct)
        => Ok(await _service.GetFilterOptionsAsync(ct));

    /// Ingests a record and pushes the refreshed dashboard to every client via SignalR
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrafficDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var record = await _service.AddRecordAsync(dto, ct);
        var dashboard = await _service.GetDashboardAsync(new TrafficQuery(), ct);
        await _hub.Clients.All.SendAsync("DashboardUpdated", dashboard, ct);

        return CreatedAtAction(nameof(Get), new { id = record.Id }, record);
    }
}
