using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Infrastructure.Persistence;
using AccountingSystem.Infrastructure.Repositories;
using AccountingSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Identity;
using AccountingSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AccountingSystem.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName))
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IReportingService, Services.ReportingService>();
            
            services.AddScoped<IVoucherService, VoucherService>();
            services.AddScoped<ITenantService, TenantService>();
            services.AddScoped<IEmployeeService, EmployeeService>();
            
            services.AddTransient<IEmailSender<User>, EmailSender>();

            return services;
        }
    }
}
