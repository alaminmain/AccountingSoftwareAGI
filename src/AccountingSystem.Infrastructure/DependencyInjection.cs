using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Infrastructure.Persistence;
using AccountingSystem.Infrastructure.Repositories;
using AccountingSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AccountingSystem.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IReportingService, Services.ReportingService>();

            return services;
        }
    }
}
