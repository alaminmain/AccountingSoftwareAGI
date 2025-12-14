using System.Collections.Generic;

namespace AccountingSystem.Application.DTOs.User
{
    public class UserDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TenantId { get; set; }
        public int? BranchId { get; set; }
        public bool IsTenantAdmin { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class CreateUserDto
    {
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int TenantId { get; set; }
        public int? BranchId { get; set; }
        public bool IsTenantAdmin { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        
        // Optional: Employee Details if we want to create Employee simultaneously
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Designation { get; set; }
    }

    public class UpdateUserDto
    {
        public string Email { get; set; } = string.Empty; 
        public int? BranchId { get; set; }
        public bool IsTenantAdmin { get; set; }
        public List<string> Roles { get; set; } = new List<string>(); // Replace roles
        public int TenantId { get; set; }
    }

     public class ResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}
