import { test, expect } from "@playwright/test";

test.describe("AEHA Penetration Testing Assistant Smoke Test", () => {
  test("smoke workflow: login -> navigate to assessment -> review report", async ({ page }) => {
    // 1. Visit Login Page
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("AEHA CONSOLE");

    // 2. Fill Credentials and Authenticate
    await page.fill('input[type="email"]', "admin@aeha.local");
    await page.fill('input[type="password"]', "AdminSecurePassword123!");
    await page.click('button[type="submit"]');

    // 3. Confirm Navigation to Dashboard
    await page.waitForURL("**/");
    await expect(page.locator("body")).toContainText("OPERATIONAL SECURITY CONSOLE");

    // 4. Navigate to Assessments
    await page.goto("/assessments");
    await expect(page.locator("body")).toContainText("SECURITY ASSESSMENTS INVENTORY");

    // 5. Open Reports Page
    await page.goto("/reports");
    await expect(page.locator("body")).toContainText("CENTRALIZED REPORTS & AUDIT ARCHIVE");
  });
});
