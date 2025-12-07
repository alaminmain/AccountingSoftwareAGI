using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubsidiaryTypesController : ControllerBase
    {
        private readonly IGenericRepository<SubsidiaryType> _repository;

        public SubsidiaryTypesController(IGenericRepository<SubsidiaryType> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repository.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(SubsidiaryType type)
        {
            var created = await _repository.AddAsync(type);
            return Ok(created);
        }
    }
}
