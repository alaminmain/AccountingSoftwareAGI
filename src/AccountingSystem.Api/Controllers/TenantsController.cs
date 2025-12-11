using AccountingSystem.Application.DTOs.Tenant;
using AccountingSystem.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTenant(CreateTenantDto dto)
        {
            var result = await _tenantService.CreateTenantAsync(dto);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _tenantService.GetAllTenantsAsync();
            return Ok(result);
        }

        [HttpPost("{tenantId}/branches")]
        public async Task<IActionResult> CreateBranch(int tenantId, CreateBranchDto dto)
        {
            if (tenantId != dto.TenantId) return BadRequest("Tenant Id mismatch");
            var result = await _tenantService.CreateBranchAsync(dto);
            return Ok(result);
        }

        [HttpGet("{tenantId}/branches")]
        public async Task<IActionResult> GetBranches(int tenantId)
        {
            var result = await _tenantService.GetBranchesAsync(tenantId);
            return Ok(result);
        }
    }
}
