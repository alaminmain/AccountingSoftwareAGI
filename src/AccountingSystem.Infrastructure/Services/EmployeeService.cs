using AccountingSystem.Application.DTOs.Employee;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Domain.Entities;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public EmployeeService(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto, int tenantId)
        {
            // 1. Create Employee Record
            var employee = new Employee
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Designation = dto.Designation,
                Department = dto.Department,
                BranchId = dto.BranchId,
                TenantId = tenantId
            };
            
            // 2. Create User Login if Email provided
            if (!string.IsNullOrEmpty(dto.Email) && !string.IsNullOrEmpty(dto.Password))
            {
                var user = new User
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    TenantId = tenantId,
                    BranchId = dto.BranchId,
                    IsTenantAdmin = false,
                    EmailConfirmed = true
                };

                var result = await _userManager.CreateAsync(user, dto.Password);
                
                if (result.Succeeded)
                {
                     // 3. Assign Roles
                     if (dto.Roles != null && dto.Roles.Any())
                     {
                         await _userManager.AddToRolesAsync(user, dto.Roles);
                     }
                     
                     employee.User = user;
                }
                else
                {
                    // Handle error? For now, we throw or log, but to keep signature simple, 
                    // we might skip user creation or throw exception.
                    // Lets throw to alert caller.
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    throw new Exception($"Failed to create user: {errors}");
                }
            }

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return new EmployeeDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                Designation = employee.Designation,
                Department = employee.Department,
                BranchId = employee.BranchId,
                UserId = employee.UserId,
                UserName = employee.User?.UserName
            };
        }

        public async Task<EmployeeDto> GetEmployeeByIdAsync(int id)
        {
            var emp = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Branch)
                .FirstOrDefaultAsync(e => e.Id == id);
            
            if (emp == null) return null;

            return new EmployeeDto
            {
                Id = emp.Id,
                FirstName = emp.FirstName,
                LastName = emp.LastName,
                Designation = emp.Designation,
                Department = emp.Department,
                BranchId = emp.BranchId,
                BranchName = emp.Branch?.Name,
                UserId = emp.UserId,
                UserName = emp.User?.UserName
            };
        }

        public async Task<IEnumerable<EmployeeDto>> GetEmployeesAsync(int tenantId)
        {
            return await _context.Employees
                .Where(e => e.TenantId == tenantId)
                .Include(e => e.User)
                .Include(e => e.Branch)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    Designation = e.Designation,
                    Department = e.Department,
                    BranchId = e.BranchId,
                    BranchName = e.Branch.Name,
                    UserId = e.UserId,
                    UserName = e.User.UserName
                })
                .ToListAsync();
        }
    }
}
