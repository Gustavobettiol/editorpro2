const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);

  // 1. Editor & Player Main View
  await page.click('button:has-text("Nocturnal Player")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'showcase_screenshots/1_player_main.png' });

  // 2. Feed Público & Chat
  // Scroll to see feed better if needed, but it should be visible
  await page.screenshot({ path: 'showcase_screenshots/2_feed_and_chat.png' });

  // 3. Blog Tab
  await page.click('button:has-text("Blog")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'showcase_screenshots/3_blog_section.png' });

  // 4. Deployment Tab
  await page.click('button:has-text("Despliegue")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'showcase_screenshots/4_deployment_render.png' });

  await browser.close();
})();
