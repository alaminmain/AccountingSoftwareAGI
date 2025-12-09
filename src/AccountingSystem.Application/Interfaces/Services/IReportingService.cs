using AccountingSystem.Application.DTOs.Reports;

namespace AccountingSystem.Application.Interfaces.Services
{
    public interface IReportingService
    {
        Task<LedgerReportDto> GetLedgerAsync(int accountId, DateTime startDate, DateTime endDate, int tenantId);
        Task<TrialBalanceReportDto> GetTrialBalanceAsync(DateTime asOfDate, int tenantId);
        Task<FinancialStatementDto> GetIncomeStatementAsync(DateTime startDate, DateTime endDate, int tenantId);
        Task<FinancialStatementDto> GetBalanceSheetAsync(DateTime asOfDate, int tenantId);
    }
}
