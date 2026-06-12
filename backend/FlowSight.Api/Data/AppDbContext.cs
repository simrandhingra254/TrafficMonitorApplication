using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Models;

namespace FlowSight.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Country> Countries => Set<Country>();
    public DbSet<VehicleType> VehicleTypes => Set<VehicleType>();
    public DbSet<TrafficRecord> TrafficRecords => Set<TrafficRecord>();

    // Live traffic map
    public DbSet<RoadSegment> RoadSegments => Set<RoadSegment>();
    public DbSet<CongestionReading> CongestionReadings => Set<CongestionReading>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<BorderWait> BorderWaits => Set<BorderWait>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Country>(e =>
        {
            e.HasIndex(c => c.IsoCode).IsUnique();
            e.Property(c => c.Name).HasMaxLength(100).IsRequired();
            e.Property(c => c.IsoCode).HasMaxLength(3).IsRequired();
        });

        b.Entity<VehicleType>(e =>
        {
            e.HasIndex(v => v.Name).IsUnique();
            e.Property(v => v.Name).HasMaxLength(50).IsRequired();
        });

        b.Entity<TrafficRecord>(e =>
        {
            // Composite index speeds up the filtered/date-range aggregation queries.
            e.HasIndex(r => new { r.CountryId, r.VehicleTypeId, r.RecordedOn });
            e.HasIndex(r => r.RecordedOn);

            e.HasOne(r => r.Country)
             .WithMany(c => c.TrafficRecords)
             .HasForeignKey(r => r.CountryId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.VehicleType)
             .WithMany(v => v.TrafficRecords)
             .HasForeignKey(r => r.VehicleTypeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<RoadSegment>(e =>
        {
            e.Property(s => s.Name).HasMaxLength(120).IsRequired();
            e.Property(s => s.PathJson).IsRequired();
        });

        b.Entity<CongestionReading>(e =>
        {
            e.HasIndex(r => new { r.RoadSegmentId, r.HourOfDay });
            e.HasOne(r => r.RoadSegment)
             .WithMany(s => s.Readings)
             .HasForeignKey(r => r.RoadSegmentId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Incident>(e =>
        {
            e.Property(i => i.Title).HasMaxLength(120).IsRequired();
            e.Property(i => i.Description).HasMaxLength(400);
            e.Property(i => i.Severity).HasMaxLength(20);
            e.HasIndex(i => i.HourOfDay);
        });

        b.Entity<BorderWait>(e =>
        {
            e.Property(w => w.Name).HasMaxLength(80).IsRequired();
            e.HasIndex(w => w.HourOfDay);
        });
    }
}
