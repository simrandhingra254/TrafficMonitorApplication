using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Models;

namespace FlowSight.Api.Data;


/// Applies pending migrations  sample data : Idempotent
/// required for both charts and the date-range filter. 

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

       
        var desiredCountries = new[]
        {
            ("Canada",               "CAN"),
            ("United States",        "USA"),
            ("United Arab Emirates", "ARE"),
            ("Germany",              "DEU"),
            ("India",                "IND"),
            ("Japan",                "JPN"),
            ("United Kingdom",       "GBR"),
        };
        foreach (var (name, iso) in desiredCountries)
        {
            if (!await db.Countries.AnyAsync(c => c.IsoCode == iso))
                db.Countries.Add(new Country { Name = name, IsoCode = iso });
        }
        await db.SaveChangesAsync();

        var desiredVehicles = new[] { "Car", "Truck", "Bus", "Motorcycle", "Bicycle" };
        foreach (var vehicleName in desiredVehicles)
        {
            if (!await db.VehicleTypes.AnyAsync(v => v.Name == vehicleName))
                db.VehicleTypes.Add(new VehicleType { Name = vehicleName });
        }
        await db.SaveChangesAsync();

        // Generate traffic records for any country that has none yet (so a
        // newly added country is backfilled without duplicating existing data)
        var vehicles = await db.VehicleTypes.OrderBy(v => v.Id).ToListAsync();

       
        var dates = new[]
        {
            new DateOnly(2026, 06, 01),
            new DateOnly(2026, 06, 05),
            new DateOnly(2026, 06, 09),
        };

        var countriesNeedingData = new List<Country>();
        foreach (var country in await db.Countries.OrderBy(c => c.Id).ToListAsync())
        {
            if (!await db.TrafficRecords.AnyAsync(r => r.CountryId == country.Id))
                countriesNeedingData.Add(country);
        }

        if (countriesNeedingData.Count > 0)
        {
            var records = new List<TrafficRecord>();
            foreach (var country in countriesNeedingData)
            {
                foreach (var vehicle in vehicles)
                {
                    foreach (var date in dates)
                    {
                        // Deterministic, reproducible counts (no randomness),
                        // shaped so cars dominate and trucks/bikes vary by country.
                        var baseCount = 200 + country.Id * 40 + vehicle.Id * 25;
                        var dayFactor = date.Day; // gentle variation across dates
                        records.Add(new TrafficRecord
                        {
                            CountryId = country.Id,
                            VehicleTypeId = vehicle.Id,
                            RecordedOn = date,
                            VehicleCount = baseCount + dayFactor * (6 - vehicle.Id) * 3
                        });
                    }
                }
            }

            db.TrafficRecords.AddRange(records);
            await db.SaveChangesAsync();
        }

        await SeedMapAsync(db);
    }

    /// time slider
    private static readonly int[] HourOfDays = { 6, 12, 18, 22 };

  
    /// Seeds the Vancouver live m,ap data
   
    private static async Task SeedMapAsync(AppDbContext db)
    {
        if (!await db.RoadSegments.AnyAsync())
        {
          
            // [lat, lng] points roughly tracing real Vancouver 
            var segments = new[]
            {
                ("Highway 1 — Port Mann Bridge", 6000,
                    "[[49.2160,-122.8060],[49.2230,-122.7900],[49.2280,-122.7660]]"),
                ("Lions Gate Bridge", 3200,
                    "[[49.2870,-123.1390],[49.3140,-123.1380],[49.3290,-123.1370]]"),
                ("Knight Street Bridge", 3000,
                    "[[49.2090,-123.0830],[49.1980,-123.0800],[49.1870,-123.0780]]"),
                ("Oak Street Bridge", 2800,
                    "[[49.2080,-123.1290],[49.1960,-123.1280],[49.1840,-123.1270]]"),
                ("Highway 99 — to Peace Arch", 5000,
                    "[[49.1040,-122.9170],[49.0560,-122.8030],[49.0050,-122.7570]]"),
                ("Granville Street — Downtown", 2200,
                    "[[49.2640,-123.1380],[49.2780,-123.1330],[49.2880,-123.1290]]"),
                ("Marine Way — Burnaby", 2600,
                    "[[49.2010,-123.0210],[49.2030,-122.9740],[49.2060,-122.9300]]"),
                ("Grandview Highway", 2400,
                    "[[49.2620,-123.0700],[49.2610,-123.0400],[49.2600,-123.0100]]"),
            };

            foreach (var (name, capacity, path) in segments)
            {
                var segment = new RoadSegment { Name = name, Capacity = capacity, PathJson = path };
                db.RoadSegments.Add(segment);
                await db.SaveChangesAsync(); // need the generated Id for readings

                foreach (var hour in HourOfDays)
                {
                    segment.Readings.Add(new CongestionReading
                    {
                        HourOfDay = hour,
                        Volume = (int)(capacity * RushFactor(hour))
                    });
                }
            }
            await db.SaveChangesAsync();
        }

        if (!await db.Incidents.AnyAsync())
        {
            db.Incidents.AddRange(
                new Incident
                {
                    Title = "Multi-vehicle collision",
                    Description = "Two right lanes blocked near the Port Mann Bridge; expect delays.",
                    Lat = 49.2230, Lng = -122.7900, RadiusMeters = 1200,
                    Severity = "High", HourOfDay = 18
                },
                new Incident
                {
                    Title = "Stalled vehicle",
                    Description = "Shoulder obstruction on Highway 99 approaching the border.",
                    Lat = 49.0560, Lng = -122.8030, RadiusMeters = 800,
                    Severity = "Medium", HourOfDay = 12
                },
                new Incident
                {
                    Title = "Road work",
                    Description = "Overnight lane closure on Lions Gate Bridge.",
                    Lat = 49.3140, Lng = -123.1380, RadiusMeters = 600,
                    Severity = "Low", HourOfDay = 22
                });
            await db.SaveChangesAsync();
        }

        if (!await db.BorderWaits.AnyAsync())
        {
            var crossings = new[]
            {
                ("Peace Arch (Douglas)", 49.0027, -122.7569),
                ("Pacific Highway (Aldergrove)", 49.0024, -122.7350),
            };

            foreach (var (name, lat, lng) in crossings)
            {
                foreach (var hour in HourOfDays)
                {
                    db.BorderWaits.Add(new BorderWait
                    {
                        Name = name, Lat = lat, Lng = lng, HourOfDay = hour,
                        // Longer waits midday/evening, short overnight.
                        WaitMinutes = hour switch
                        {
                            6 => 10,
                            12 => 35,
                            18 => 50,
                            _ => 5
                        }
                    });
                }
            }
            await db.SaveChangesAsync();
        }
    }

    /// <summary>Fraction of capacity in use at a given hour (rush at 6 and 18).</summary>
    private static double RushFactor(int hour) => hour switch
    {
        6 => 0.95,
        12 => 0.60,
        18 => 1.05,
        _ => 0.30
    };
}
