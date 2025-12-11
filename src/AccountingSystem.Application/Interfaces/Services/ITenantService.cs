using AccountingSystem.Application.DTOs.Tenant;

namespace AccountingSystem.Application.Interfaces.Services
{
    public interface ITenantService
    {
        Task<TenantDto> CreateTenantAsync(CreateTenantDto dto);
        Task<IEnumerable<TenantDto>> GetAllTenantsAsync();
        
        Task<BranchDto> CreateBranchAsync(CreateBranchDto dto);
        Task<IEnumerable<BranchDto>> GetBranchesAsync(int tenantId);
    }
}
