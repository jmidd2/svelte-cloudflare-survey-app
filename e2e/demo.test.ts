import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
});