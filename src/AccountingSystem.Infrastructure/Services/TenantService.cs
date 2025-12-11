using AccountingSystem.Application.DTOs.Tenant;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Domain.Entities;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Services
{
    public class TenantService : ITenantService
    {
        private readonly ApplicationDbContext _context;

        public TenantService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<BranchDto> CreateBranchAsync(CreateBranchDto dto)
        {
            var branch = new Branch
            {
                Name = dto.Name,
                Code = dto.Code,
                TenantId = dto.TenantId
            };
            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();
            return new BranchDto { Id = branch.Id, Name = branch.Name, Code = branch.Code, TenantId = branch.TenantId };
        }

        public async Task<TenantDto> CreateTenantAsync(CreateTenantDto dto)
        {
            var tenant = new Tenant { Name = dto.Name };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();
            return new TenantDto { Id = tenant.Id, Name = tenant.Name };
        }

        public async Task<IEnumerable<BranchDto>> GetBranchesAsync(int tenantId)
        {
            return await _context.Branches
                .Where(b => b.TenantId == tenantId)
                .Select(b => new BranchDto { Id = b.Id, Name = b.Name, Code = b.Code, TenantId = b.TenantId })
                .ToListAsync();
        }

        public async Task<IEnumerable<TenantDto>> GetAllTenantsAsync()
        {
            return await _context.Tenants
                .Select(t => new TenantDto { Id = t.Id, Name = t.Name })
                .ToListAsync();
        }
    }
}
