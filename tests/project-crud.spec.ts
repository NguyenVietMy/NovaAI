import { test, expect, Page } from "@playwright/test";

const PROJECT_NAME = "E2E Test Project";
const RENAMED_PROJECT_NAME = "E2E Renamed Project";

// Helper: login if your app requires authentication
async function login(page: Page) {
  await page.goto("http://localhost:3000/sign-in");
  await page.fill('input[name="email"]', "mynv2712@gmail.com");
  await page.fill('input[name="password"]', "123456789");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("http://localhost:3000/");
}

test.describe("Project CRUD", () => {
  test("user can create, rename, and delete a project", async ({ page }) => {
    await login(page);
    await page.goto("http://localhost:3000/projects");
    await expect(page.locator("text=New")).toBeVisible();

    // Create project
    await page.click("text=New");
    await page.click("text=New project");
    await page.fill('input[placeholder="Project name"]', PROJECT_NAME);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`text=${PROJECT_NAME}`)).toBeVisible();

    // Ensure we're on the project list and the card is visible
    await page.goto("http://localhost:3000/projects");
    await expect(page.locator(`text=${PROJECT_NAME}`)).toBeVisible();

    // Find the project card containing the project name
    const projectCard = page
      .locator(`text=${PROJECT_NAME}`)
      .first()
      .locator("..");
    const optionsButton = projectCard.locator(
      'button[aria-label="Project options"]'
    );
    await expect(optionsButton).toBeVisible();
    await optionsButton.click();

    // Wait for the "Rename" option to appear and click it
    await expect(page.locator("text=Rename")).toBeVisible();
    await page.click("text=Rename");
    await page.fill("input", RENAMED_PROJECT_NAME);
    await page.click('button:has-text("Save")');
    await expect(page.locator(`text=${RENAMED_PROJECT_NAME}`)).toBeVisible();

    // Delete project
    // Find the renamed project card and its options button
    const renamedProjectCard = page
      .locator(`text=${RENAMED_PROJECT_NAME}`)
      .first()
      .locator("..");
    const renamedOptionsButton = renamedProjectCard.locator(
      'button[aria-label="Project options"]'
    );
    await expect(renamedOptionsButton).toBeVisible();
    await renamedOptionsButton.click();
    await expect(page.locator("text=Delete")).toBeVisible();
    await page.click("text=Delete");
    await page.click('button:has-text("Delete")');
    // Wait for the delete modal to disappear
    await expect(page.locator("text=Delete project")).not.toBeVisible();
    // Now check that the project card is gone (span only)
    await expect(
      page.locator(`span:text("${RENAMED_PROJECT_NAME}")`)
    ).not.toBeVisible();
  });
});
