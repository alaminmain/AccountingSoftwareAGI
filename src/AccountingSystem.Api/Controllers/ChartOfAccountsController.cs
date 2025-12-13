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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var account = await _repository.GetByIdAsync(id);
            if (account == null) return NotFound();
            return Ok(account);
        }

        [HttpPost]
        public async Task<IActionResult> Create(ChartOfAccount account)
        {
            var created = await _repository.AddAsync(account);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ChartOfAccount account)
        {
            if (id != account.Id) return BadRequest();
            await _repository.UpdateAsync(account);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var account = await _repository.GetByIdAsync(id);
            if (account == null) return NotFound();
            await _repository.DeleteAsync(account);
            return NoContent();
        }
    }
}
