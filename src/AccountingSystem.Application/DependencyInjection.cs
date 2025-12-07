using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AccountingSystem.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Register Application services here
            services.AddScoped<IVoucherService, VoucherService>();
            return services;
        }
    }
}
