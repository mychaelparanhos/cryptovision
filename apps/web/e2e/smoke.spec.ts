import { test, expect } from "@playwright/test";

test("landing page loads and has correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/CryptoVision/);
});

test("screener page is accessible", async ({ page }) => {
  await page.goto("/screener");
  await expect(page.locator("body")).toBeVisible();
});
