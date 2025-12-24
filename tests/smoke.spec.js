const { test, expect } = require('@playwright/test');

test('loads the dwarf stats homepage', async ({ page }) => {
  await page.goto('http://localhost:4173');
  await expect(page).toHaveTitle(/Dwarf Stats/i);
});
