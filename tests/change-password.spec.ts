import { test, expect } from "@playwright/test";

test.describe("Change Password Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page and ensure user is logged in
    await page.goto("/");

    // Check if user is logged in by looking for the user profile button
    const isLoggedIn = await page
      .locator("button:has([data-radix-collection-item])")
      .isVisible()
      .catch(() => false);

    if (!isLoggedIn) {
      // Navigate to sign in page
      await page.goto("/sign-in");

      // Fill in sign in form (you'll need to provide test credentials)
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "testpassword");
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL("/");
    }
  });

  test("should open my account modal", async ({ page }) => {
    // Click on user profile button to open dropdown menu
    await page.click("button:has([data-radix-collection-item])");

    // Check if my account option is visible
    await expect(page.locator("text=My Account")).toBeVisible();

    // Click on My Account
    await page.click("text=My Account");

    // Verify modal opens with change password section
    await expect(page.locator("text=Change Password")).toBeVisible();
    await expect(page.locator('input[id="current-password"]')).toBeVisible();
    await expect(page.locator('input[id="new-password"]')).toBeVisible();
    await expect(page.locator('input[id="confirm-password"]')).toBeVisible();
  });

  test("should validate form fields", async ({ page }) => {
    // Open my account modal
    await page.click("button:has([data-radix-collection-item])");
    await page.click("text=My Account");

    // Try to submit empty form
    await page.click('button:has-text("Change Password")');

    // Button should be disabled when fields are empty
    await expect(
      page.locator('button:has-text("Change Password")')
    ).toBeDisabled();

    // Fill only current password
    await page.fill('input[id="current-password"]', "currentpass");
    await expect(
      page.locator('button:has-text("Change Password")')
    ).toBeDisabled();

    // Fill current and new password
    await page.fill('input[id="new-password"]', "newpass");
    await expect(
      page.locator('button:has-text("Change Password")')
    ).toBeDisabled();

    // Fill all fields
    await page.fill('input[id="confirm-password"]', "newpass");
    await expect(
      page.locator('button:has-text("Change Password")')
    ).toBeEnabled();
  });

  test("should show error for mismatched passwords", async ({ page }) => {
    // Open my account modal
    await page.click("button:has([data-radix-collection-item])");
    await page.click("text=My Account");

    // Fill form with mismatched passwords
    await page.fill('input[id="current-password"]', "currentpass");
    await page.fill('input[id="new-password"]', "newpass");
    await page.fill('input[id="confirm-password"]', "differentpass");

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Should show error toast
    await expect(page.locator("text=New passwords do not match")).toBeVisible();
  });

  test("should show error for short password", async ({ page }) => {
    // Open my account modal
    await page.click("button:has([data-radix-collection-item])");
    await page.click("text=My Account");

    // Fill form with short password
    await page.fill('input[id="current-password"]', "currentpass");
    await page.fill('input[id="new-password"]', "123");
    await page.fill('input[id="confirm-password"]', "123");

    // Submit form
    await page.click('button:has-text("Change Password")');

    // Should show error toast
    await expect(
      page.locator("text=New password must be at least 6 characters long")
    ).toBeVisible();
  });
});
