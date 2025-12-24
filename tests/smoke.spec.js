const { test, expect } = require('@playwright/test');

test('loads the dwarf stats homepage', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('http://localhost:4173');
  await expect(page).toHaveTitle(/Dwarf Stats/i);

  const errorOutput = [...consoleErrors, ...pageErrors].join('\n');
  expect(errorOutput).toMatch(/className|class/i);
});
