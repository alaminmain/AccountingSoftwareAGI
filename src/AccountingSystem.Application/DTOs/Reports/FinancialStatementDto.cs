namespace AccountingSystem.Application.DTOs.Reports
{
    public class FinancialStatementDto
    {
        // e.g. "Income Statement" or "Balance Sheet"
        public string Title { get; set; } = string.Empty;
        public DateTime? AsOfDate { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public List<FinancialStatementSectionDto> Sections { get; set; } = new();
        public decimal GrandTotal { get; set; } // e.g. Is 0 for balanced Balance Sheet? Or Total Assets?
    }

    public class FinancialStatementSectionDto
    {
        public string SectionName { get; set; } = string.Empty; // e.g. "Assets", "Current Liabilities"
        public List<FinancialReportLineDto> Lines { get; set; } = new();
        public decimal TotalAmount { get; set; }
    }

    public class FinancialReportLineDto
    {
        public int AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountCode { get; set; } = string.Empty;
        public decimal Amount { get; set; } // Positive usually
    }
}
