namespace AccountingSystem.Domain.Enums
{
    public enum VoucherType
    {
        Journal = 1,
        Payment = 2,
        Receipt = 3,
        Contra = 4
    }

    public enum VoucherStatus
    {
        Draft = 1,     // Entered but not submitted
        Submitted = 2, // Submitted for Verification
        Verified = 3,  // Verified, waiting for Approval
        Approved = 4,  // Finalized / Posted
        Rejected = 5
    }
}
