using AccountingSystem.Application.DTOs.Voucher;
using AccountingSystem.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;

        public VouchersController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateVoucherDto dto)
        {
            // In real app, get user from Claims
            var createdBy = "User"; 
            try 
            {
                var voucher = await _voucherService.CreateVoucherAsync(dto, createdBy);
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/verify")]
        public async Task<IActionResult> Verify(int id)
        {
            var verifiedBy = "Verifier";
            try
            {
                var voucher = await _voucherService.VerifyVoucherAsync(id, verifiedBy);
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            var approvedBy = "Approver";
            try
            {
                var voucher = await _voucherService.ApproveVoucherAsync(id, approvedBy);
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
