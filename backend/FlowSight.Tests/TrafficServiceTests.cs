using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Data;
using FlowSight.Api.Dtos;
using FlowSight.Api.Models;
using FlowSight.Api.Services;
using Xunit;

namespace FlowSight.Tests;

public class TrafficServiceTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task SeedAsync(AppDbContext db)
    {
        var uae = new Country { Name = "UAE", IsoCode = "ARE" };
        var usa = new Country { Name = "USA", IsoCode = "USA" };
        var car = new VehicleType { Name = "Car" };
        var bus = new VehicleType { Name = "Bus" };
        db.AddRange(uae, usa, car, bus);
        await db.SaveChangesAsync();

        db.TrafficRecords.AddRange(
            new TrafficRecord { CountryId = uae.Id, VehicleTypeId = car.Id, RecordedOn = new DateOnly(2026, 6, 1), VehicleCount = 100 },
            new TrafficRecord { CountryId = uae.Id, VehicleTypeId = bus.Id, RecordedOn = new DateOnly(2026, 6, 5), VehicleCount = 50 },
            new TrafficRecord { CountryId = usa.Id, VehicleTypeId = car.Id, RecordedOn = new DateOnly(2026, 6, 9), VehicleCount = 200 });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetDashboard_NoFilter_AggregatesAllRecords()
    {
        await using var db = NewDb();
        await SeedAsync(db);
        var service = new TrafficService(db);

        var result = await service.GetDashboardAsync(new TrafficQuery());

        Assert.Equal(350, result.TotalVehicles);
        Assert.Equal(2, result.CountryTraffic.Count);
        Assert.Equal(2, result.VehicleDistribution.Count);
        // Cars (300) should outrank buses (50) and be ordered first.
        Assert.Equal("Car", result.VehicleDistribution.First().Label);
    }

    [Fact]
    public async Task GetDashboard_FilterByCountry_ReturnsOnlyThatCountry()
    {
        await using var db = NewDb();
        await SeedAsync(db);
        var service = new TrafficService(db);
        var uaeId = db.Countries.Single(c => c.IsoCode == "ARE").Id;

        var result = await service.GetDashboardAsync(new TrafficQuery { CountryId = uaeId });

        Assert.Equal(150, result.TotalVehicles);
        Assert.Single(result.CountryTraffic);
        Assert.Equal("UAE", result.CountryTraffic.Single().Label);
    }

    [Fact]
    public async Task GetDashboard_FilterByDateRange_ExcludesOutOfRange()
    {
        await using var db = NewDb();
        await SeedAsync(db);
        var service = new TrafficService(db);

        var result = await service.GetDashboardAsync(new TrafficQuery
        {
            From = new DateOnly(2026, 6, 2),
            To = new DateOnly(2026, 6, 6),
        });

        // Only the 2026-06-05 bus record (50) falls in range.
        Assert.Equal(50, result.TotalVehicles);
    }

    [Fact]
    public async Task AddRecord_PersistsAndIsCounted()
    {
        await using var db = NewDb();
        await SeedAsync(db);
        var service = new TrafficService(db);
        var usaId = db.Countries.Single(c => c.IsoCode == "USA").Id;
        var carId = db.VehicleTypes.Single(v => v.Name == "Car").Id;

        await service.AddRecordAsync(new CreateTrafficDto
        {
            CountryId = usaId, VehicleTypeId = carId,
            RecordedOn = new DateOnly(2026, 6, 10), VehicleCount = 400,
        });

        var result = await service.GetDashboardAsync(new TrafficQuery());
        Assert.Equal(750, result.TotalVehicles);
    }
}
