using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChartOfAccountsController : ControllerBase
    {
        private readonly IGenericRepository<ChartOfAccount> _repository;

        public ChartOfAccountsController(IGenericRepository<ChartOfAccount> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var accounts = await _repository.GetAllAsync();
            return Ok(accounts);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ChartOfAccount account)
        {
            var created = await _repository.AddAsync(account);
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
        }
    }
}
