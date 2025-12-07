using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubsidiaryLedgersController : ControllerBase
    {
        private readonly IGenericRepository<SubsidiaryLedger> _repository;

        public SubsidiaryLedgersController(IGenericRepository<SubsidiaryLedger> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repository.GetAllAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(SubsidiaryLedger ledger)
        {
            var created = await _repository.AddAsync(ledger);
            return Ok(created);
        }
    }
}
