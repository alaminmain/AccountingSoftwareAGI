using AccountingSystem.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace AccountingSystem.Infrastructure.Services
{
    public class EmailSender : IEmailSender<User>
    {
        private readonly ILogger<EmailSender> _logger;

        public EmailSender(ILogger<EmailSender> logger)
        {
            _logger = logger;
        }

        public Task SendConfirmationLinkAsync(User user, string email, string confirmationLink)
        {
            _logger.LogInformation("Sending Confirmation Link to {Email}: {Link}", email, confirmationLink);
            return Task.CompletedTask;
        }

        public Task SendPasswordResetCodeAsync(User user, string email, string resetCode)
        {
             _logger.LogInformation("Sending Password Reset Code to {Email}: {Code}", email, resetCode);
             return Task.CompletedTask;
        }

        public Task SendPasswordResetLinkAsync(User user, string email, string resetLink)
        {
            _logger.LogInformation("Sending Password Reset Link to {Email}: {Link}", email, resetLink);
            return Task.CompletedTask;
        }
    }
}
