using AccountingSystem.Domain.Entities.Common;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Persistence
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<AccountingSystem.Domain.Entities.Tenant> Tenants { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.Branch> Branches { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Global Filter for Multi-tenancy
            // We will implement this dynamically later or per entity configuration
            
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
