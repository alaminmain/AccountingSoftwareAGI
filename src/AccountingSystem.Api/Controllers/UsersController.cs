using AccountingSystem.Application.DTOs.User;
using AccountingSystem.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize(Roles = "SuperAdmin")] // Uncomment to secure. For dev/demo speed, maybe keep open or check
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<Role> _roleManager;

        public UsersController(UserManager<User> userManager, RoleManager<Role> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? tenantId)
        {
            var query = _userManager.Users.AsQueryable();

            if (tenantId.HasValue)
            {
                query = query.Where(u => u.TenantId == tenantId.Value);
            }

            var users = await query.ToListAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName!,
                    Email = user.Email!,
                    TenantId = user.TenantId,
                    BranchId = user.BranchId,
                    IsTenantAdmin = user.IsTenantAdmin,
                    Roles = roles
                });
            }

            return Ok(userDtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            var dto = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName!,
                Email = user.Email!,
                TenantId = user.TenantId,
                BranchId = user.BranchId,
                IsTenantAdmin = user.IsTenantAdmin,
                Roles = roles
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateUserDto dto)
        {
            if (await _userManager.FindByEmailAsync(dto.Email) != null)
            {
                return BadRequest("Email already exists.");
            }

            var user = new User
            {
                UserName = dto.Email, // Simplify UserName = Email
                Email = dto.Email,
                TenantId = dto.TenantId,
                BranchId = dto.BranchId,
                IsTenantAdmin = dto.IsTenantAdmin,
                EmailConfirmed = true // Auto confirm for admin created users
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            if (dto.Roles != null && dto.Roles.Any())
            {
                // Validate roles exist
                foreach(var r in dto.Roles)
                {
                    if(!await _roleManager.RoleExistsAsync(r))
                    {
                         // Optional: Create or Error. Let's Error to be safe, or Ignore.
                         // return BadRequest($"Role {r} does not exist.");
                    }
                }
                var roleResult = await _userManager.AddToRolesAsync(user, dto.Roles);
                if (!roleResult.Succeeded) return BadRequest(roleResult.Errors);
            }

            return Ok(new { user.Id, user.Email });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            user.Email = dto.Email;
            user.UserName = dto.Email; // Keep synced
            user.TenantId = dto.TenantId;
            user.BranchId = dto.BranchId;
            user.IsTenantAdmin = dto.IsTenantAdmin;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // Update Roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToAdd = dto.Roles.Except(currentRoles).ToList();
            var rolesToRemove = currentRoles.Except(dto.Roles).ToList();

            if (rolesToAdd.Any()) await _userManager.AddToRolesAsync(user, rolesToAdd);
            if (rolesToRemove.Any()) await _userManager.RemoveFromRolesAsync(user, rolesToRemove);

            return Ok(user);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            return Ok();
        }

        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null) return NotFound();

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

            if (!result.Succeeded) return BadRequest(result.Errors);

            return Ok("Password reset successfully.");
        }
    }
}
