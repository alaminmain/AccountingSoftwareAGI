using System;

namespace AccountingSystem.Application.DTOs.Reports
{
    public class LedgerEntryDto
    {
        public DateTime Date { get; set; }
        public int VoucherId { get; set; }
        public string VoucherNo { get; set; } = string.Empty;
        public string Narration { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal RunningBalance { get; set; }
    }

    public class LedgerReportDto
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        
        public decimal OpeningBalance { get; set; }
        public List<LedgerEntryDto> Transactions { get; set; } = new();
        public decimal ClosingBalance { get; set; }
    }
}
