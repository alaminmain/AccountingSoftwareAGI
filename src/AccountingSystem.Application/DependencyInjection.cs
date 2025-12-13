using AccountingSystem.Application.Interfaces.Services;

using Microsoft.Extensions.DependencyInjection;

namespace AccountingSystem.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // Register Application services here
            
            return services;
        }
    }
}
