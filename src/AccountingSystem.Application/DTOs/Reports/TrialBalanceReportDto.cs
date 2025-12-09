namespace AccountingSystem.Application.DTOs.Reports
{
    public class TrialBalanceEntryDto
    {
        public int AccountId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int AccountLevel { get; set; }
        public bool IsControlAccount { get; set; }
        
        public decimal DebitTotal { get; set; }
        public decimal CreditTotal { get; set; }
        public decimal NetBalance { get; set; } // Positive = Debit, Negative = Credit usually, or purely Math
    }

    public class TrialBalanceReportDto
    {
        public DateTime AsOfDate { get; set; }
        public List<TrialBalanceEntryDto> Entries { get; set; } = new();
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
    }
}
