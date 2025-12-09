using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SubsidiaryTypeId",
                table: "ChartOfAccounts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChartOfAccounts_SubsidiaryTypeId",
                table: "ChartOfAccounts",
                column: "SubsidiaryTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChartOfAccounts_SubsidiaryTypes_SubsidiaryTypeId",
                table: "ChartOfAccounts",
                column: "SubsidiaryTypeId",
                principalTable: "SubsidiaryTypes",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChartOfAccounts_SubsidiaryTypes_SubsidiaryTypeId",
                table: "ChartOfAccounts");

            migrationBuilder.DropIndex(
                name: "IX_ChartOfAccounts_SubsidiaryTypeId",
                table: "ChartOfAccounts");

            migrationBuilder.DropColumn(
                name: "SubsidiaryTypeId",
                table: "ChartOfAccounts");
        }
    }
}
