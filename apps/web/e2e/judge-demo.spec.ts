import { test, expect } from '@playwright/test';

test.describe('RecallRadar Complete Judge Demo Flow', () => {
  test('should execute complete judge demo workflow cleanly', async ({ page }) => {
    // 1. Open Dashboard Overview
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Safety Intelligence Overview');

    // 2. Open Risk Queue
    await page.click('text=Risk Queue');
    await expect(page.locator('h1')).toContainText('Risk Queue');
    await expect(page.locator('table')).toBeVisible();

    // 3. Select recalled historical product (Demo Smart Charger)
    await page.click('text=Investigate');

    // 4. Inspect Product Detail & Timeline Replay
    await expect(page.locator('h1')).toContainText('Demo Smart Charger');
    await expect(page.locator('text=Historical Timeline Replay')).toBeVisible();

    // 5. Click Start Replay
    await page.click('text=Start Replay');
    await page.waitForTimeout(2000);

    // 6. Verify Early Warning Alert Banner & Lead Time
    await expect(page.locator('text=RECALLRADAR EARLY WARNING ALERT FIRED')).toBeVisible();
    await expect(page.locator('text=LEAD TIME')).toBeVisible();

    // 7. Inspect Flagged Review Evidence
    await expect(page.locator('text=Flagged Review Evidence')).toBeVisible();
    await expect(page.locator('text=caught fire')).toBeVisible();

    // 8. Open Backtest Lab
    await page.click('text=Backtest Lab');
    await expect(page.locator('h1')).toContainText('Backtest Lab');

    // 9. Move Alert Budget Slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('50');
    await expect(page.locator('text=50 alerts / 1,000 products')).toBeVisible();

    // 10. Open Ask RecallRadar RAG Chat
    await page.click('text=Ask RecallRadar');
    await expect(page.locator('h1')).toContainText('Ask RecallRadar');

    // 11. Ask evidence question
    await page.fill('input[placeholder*="Ask"]', 'Why did the Demo Smart Charger alert fire?');
    await page.click('button:has-text("Send Question")');
    await expect(page.locator('text=Evidence cited')).toBeVisible();

    // 12. Open Alerts & create custom rule
    await page.click('text=Alerts');
    await page.fill('input[placeholder*="alert me if"]', 'alert me if burn or fire mentions double in two weeks');
    await page.click('button:has-text("Interpret & Save Rule")');
    await expect(page.locator('text=Rule Successfully Interpreted')).toBeVisible();
  });
});
