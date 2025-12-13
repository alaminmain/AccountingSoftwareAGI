using AccountingSystem.Application.DTOs.Voucher;
using AccountingSystem.Application.Interfaces.Services;
using Microsoft.AspNetCore.Http;
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

        public class CreateVoucherRequest
        {
            public string Dto { get; set; } = string.Empty;
            public IFormFile? Attachment { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateVoucherRequest request)
        {
            // In real app, get user from Claims
            var createdBy = "User"; 
            try 
            {
                var dto = System.Text.Json.JsonSerializer.Deserialize<CreateVoucherDto>(request.Dto, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (dto == null) return BadRequest("Invalid Data");

                Stream? stream = null;
                if (request.Attachment != null)
                {
                    stream = request.Attachment.OpenReadStream();
                }

                var voucher = await _voucherService.CreateVoucherNewAsync(dto, createdBy, stream, request.Attachment?.FileName);
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateVoucherDto dto)
        {
            var updatedBy = "User"; // Should be from Claims
            try
            {
                var voucher = await _voucherService.UpdateVoucherAsync(id, dto, updatedBy);
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
        [HttpGet]
        public async Task<IActionResult> GetAll(int tenantId = 1)
        {
            var vouchers = await _voucherService.GetAllVouchersAsync(tenantId);
            return Ok(vouchers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var voucher = await _voucherService.GetVoucherByIdAsync(id);
                if (voucher == null) return NotFound();
                return Ok(voucher);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

    }
}
