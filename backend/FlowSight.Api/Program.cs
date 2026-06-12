using Microsoft.EntityFrameworkCore;
using FlowSight.Api.Data;
using FlowSight.Api.Hubs;
using FlowSight.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Allow the connection string to be overridden by env var (Docker / prod).
var connectionString =
    builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("Connection string 'Default' not found.");

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connectionString));
builder.Services.AddScoped<ITrafficService, TrafficService>();
builder.Services.AddScoped<IMapService, MapService>();
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()); // required for SignalR
});

var app = builder.Build();

// Apply migrations + seed at startup.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("frontend");
app.MapControllers();
app.MapHub<TrafficHub>("/hubs/traffic");

app.Run();

// Exposed so the integration/unit test project can reference the entry point.
public partial class Program { }
