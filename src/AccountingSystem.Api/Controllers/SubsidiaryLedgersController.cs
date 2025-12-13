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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var ledger = await _repository.GetByIdAsync(id);
            if (ledger == null) return NotFound();
            return Ok(ledger);
        }

        [HttpPost]
        public async Task<IActionResult> Create(SubsidiaryLedger ledger)
        {
            var created = await _repository.AddAsync(ledger);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, SubsidiaryLedger ledger)
        {
            if (id != ledger.Id) return BadRequest();
            await _repository.UpdateAsync(ledger);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ledger = await _repository.GetByIdAsync(id);
            if (ledger == null) return NotFound();
            await _repository.DeleteAsync(ledger);
            return NoContent();
        }
    }
}
