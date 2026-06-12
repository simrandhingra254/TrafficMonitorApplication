using FlowSight.Api.Dtos;

namespace FlowSight.Api.Services;

public interface IMapService
{
    Task<MapResponse> GetMapAsync(int hour, CancellationToken ct = default);
}
