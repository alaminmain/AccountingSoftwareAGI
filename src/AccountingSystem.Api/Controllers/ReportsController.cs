using AccountingSystem.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportingService _reportingService;

        public ReportsController(IReportingService reportingService)
        {
            _reportingService = reportingService;
        }

        [HttpGet("ledger")]
        public async Task<IActionResult> GetLedger(int accountId, DateTime fromDate, DateTime toDate, int tenantId = 1) // TenantId defaulted for demo
        {
            try
            {
                var report = await _reportingService.GetLedgerAsync(accountId, fromDate, toDate, tenantId);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("trial-balance")]
        public async Task<IActionResult> GetTrialBalance(DateTime asOfDate, int tenantId = 1)
        {
            var report = await _reportingService.GetTrialBalanceAsync(asOfDate, tenantId);
            return Ok(report);
        }
        [HttpGet("income-statement")]
        public async Task<IActionResult> GetIncomeStatement(DateTime startDate, DateTime endDate, int tenantId = 1)
        {
            var report = await _reportingService.GetIncomeStatementAsync(startDate, endDate, tenantId);
            return Ok(report);
        }

        [HttpGet("balance-sheet")]
        public async Task<IActionResult> GetBalanceSheet(DateTime asOfDate, int tenantId = 1)
        {
            var report = await _reportingService.GetBalanceSheetAsync(asOfDate, tenantId);
            return Ok(report);
        }
    }
}
