using FlowSight.Api.Dtos;
using FlowSight.Api.Models;

namespace FlowSight.Api.Services;

public interface ITrafficService
{
    Task<DashboardResponse> GetDashboardAsync(TrafficQuery query, CancellationToken ct = default);
    Task<FilterOptionsResponse> GetFilterOptionsAsync(CancellationToken ct = default);
    Task<TrafficRecord> AddRecordAsync(CreateTrafficDto dto, CancellationToken ct = default);
}
