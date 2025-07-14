import { test, expect, Page } from "@playwright/test";

const PROJECT_NAME = "E2E Folder Project";
const FOLDER_NAME = "E2E Test Folder";
const RENAMED_FOLDER_NAME = "E2E Renamed Folder";

async function login(page: Page) {
  await page.goto("http://localhost:3000/sign-in");
  await page.fill('input[name="email"]', "mynv2712@gmail.com");
  await page.fill('input[name="password"]', "123456789");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("http://localhost:3000/");
}

test.describe("Folder CRUD", () => {
  test("user can create, rename, and delete a folder within a project", async ({
    page,
  }) => {
    await login(page);
    await page.goto("http://localhost:3000/projects");

    // Create project
    await page.click("text=New");
    await page.click("text=New project");
    await page.fill('input[placeholder="Project name"]', PROJECT_NAME);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`text=${PROJECT_NAME}`)).toBeVisible();

    // Go to the new project page
    await page.click(`text=${PROJECT_NAME}`);
    await expect(page).toHaveURL(/\/projects\//);

    // Create folder
    // Wait for the first visible "New" button to be enabled and visible
    const allNewButtons = page.locator('button:has-text("New")');
    await expect(allNewButtons.first()).toBeVisible();
    await expect(allNewButtons.first()).toBeEnabled();
    await allNewButtons.first().hover();
    await allNewButtons.first().click({ force: true });
    await page.waitForTimeout(200);
    await page.screenshot({ path: "after-new-click-1.png", fullPage: true });
    let menuitems = await page
      .locator('div[role="menuitem"]')
      .allTextContents();
    console.log("Menuitems after first click:", menuitems);
    // Try clicking again if menu not open
    if (menuitems.length === 0) {
      await allNewButtons.first().click({ force: true });
      await page.waitForTimeout(600);
      await page.screenshot({ path: "after-new-click-2.png", fullPage: true });
      menuitems = await page.locator('div[role="menuitem"]').allTextContents();
      console.log("Menuitems after second click:", menuitems);
    }

    // Wait for the menu to appear and click "New folder"
    const newFolderMenuItem = page.locator('div[role="menuitem"]', {
      hasText: "New folder",
    });
    await expect(newFolderMenuItem).toBeVisible();
    await newFolderMenuItem.click({ force: true });
    await page.screenshot({
      path: "after-new-folder-click.png",
      fullPage: true,
    });

    // Wait for the modal container to appear
    const modal = page.locator(".bg-white.rounded-lg.shadow-lg");
    await expect(modal).toBeVisible({ timeout: 10000 });

    // Use a global locator for the input by value (not placeholder)
    const folderNameInput = page.locator('input[value="Untitled folder"]');
    await expect(folderNameInput).toBeVisible({ timeout: 10000 });
    await folderNameInput.fill(FOLDER_NAME);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`span:text("${FOLDER_NAME}")`)).toBeVisible();

    // Rename folder
    const folderCard = page
      .locator(`span:text("${FOLDER_NAME}")`)
      .first()
      .locator("..");
    const optionsButton = folderCard.locator(
      'button[aria-label="Folder options"]'
    );
    await expect(optionsButton).toBeVisible();
    await optionsButton.click();
    await expect(page.locator("text=Rename")).toBeVisible();
    await page.click("text=Rename");
    await page.fill("input", RENAMED_FOLDER_NAME);
    await page.click('button:has-text("Save")');
    await expect(
      page.locator(`span:text("${RENAMED_FOLDER_NAME}")`)
    ).toBeVisible();

    // Delete folder
    const renamedFolderCard = page
      .locator(`span:text("${RENAMED_FOLDER_NAME}")`)
      .first()
      .locator("..");
    const renamedOptionsButton = renamedFolderCard.locator(
      'button[aria-label="Folder options"]'
    );
    await expect(renamedOptionsButton).toBeVisible();
    await renamedOptionsButton.click();
    await expect(page.locator("text=Delete")).toBeVisible();
    await page.click("text=Delete");
    await page.click('button:has-text("Delete")');
    // Wait for the delete modal to disappear
    await expect(page.locator("text=Delete folder")).not.toBeVisible();
    // Now check that the folder card is gone (span only)
    await expect(
      page.locator(`span:text("${RENAMED_FOLDER_NAME}")`)
    ).not.toBeVisible();
  });
});
