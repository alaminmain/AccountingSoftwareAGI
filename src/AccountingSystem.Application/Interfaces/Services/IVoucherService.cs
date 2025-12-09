using AccountingSystem.Application.DTOs.Voucher;
using AccountingSystem.Domain.Entities;

namespace AccountingSystem.Application.Interfaces.Services
{
    public interface IVoucherService
    {
        Task<Voucher> CreateVoucherAsync(CreateVoucherDto dto, string createdBy);
        Task<Voucher> VerifyVoucherAsync(int id, string verifiedBy);
        Task<Voucher> ApproveVoucherAsync(int id, string approvedBy);
        Task<IEnumerable<Voucher>> GetAllVouchersAsync(int tenantId);
        Task<Voucher> UpdateVoucherAsync(int id, CreateVoucherDto dto, string updatedBy);
        Task<Voucher?> GetVoucherByIdAsync(int id);
    }
}
