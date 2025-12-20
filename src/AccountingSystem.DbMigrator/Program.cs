using AccountingSystem.Domain.Entities;
using AccountingSystem.Infrastructure;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;

namespace AccountingSystem.DbMigrator
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var logger = services.GetRequiredService<ILogger<Program>>();

                try
                {
                    logger.LogInformation("Starting Migration...");
                    
                    var context = services.GetRequiredService<ApplicationDbContext>();
                    
                    // Apply Migrations
                    await context.Database.MigrateAsync();
                    logger.LogInformation("Database Migrated Successfully.");

                    // Apply Seed Data
                    logger.LogInformation("Seeding Data...");
                    await SeedData.InitializeAsync(services);
                    logger.LogInformation("Seed Data Applied Successfully.");
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "An error occurred while upgrading the database.");
                }
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.SetBasePath(AppContext.BaseDirectory);
                    config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                })
                .ConfigureServices((hostContext, services) =>
                {
                    // Add Infrastructure (DbContext, etc)
                    services.AddInfrastructure(hostContext.Configuration);

                    // Add Identity (similar to API but lightweight)
                    services.AddIdentityCore<User>(options => {
                        options.SignIn.RequireConfirmedAccount = true;
                    })
                    .AddRoles<Role>()
                    .AddEntityFrameworkStores<ApplicationDbContext>()
                    .AddSignInManager()
                    .AddDefaultTokenProviders();

                    services.AddDataProtection();
                });
    }
}
