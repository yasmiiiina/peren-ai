const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  try {
    require.resolve('playwright');
  } catch (e) {
    console.log("Installing playwright...");
    execSync('npm i --no-save playwright', { stdio: 'inherit' });
    execSync('npx playwright install chromium', { stdio: 'inherit' });
  }

  const { chromium } = require('playwright');
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log("Navigating to lovable.app...");
  await page.goto('https://perenwebapp.lovable.app/blood-test', { waitUntil: 'networkidle' });
  
  // Wait a bit for react rendering just in case
  await page.waitForTimeout(3000);

  const content = await page.evaluate(() => {
    // Extract text content with structure
    let result = '';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (text) {
         // get parent tag
         const tag = node.parentElement ? node.parentElement.tagName : '';
         const className = node.parentElement ? node.parentElement.className : '';
         result += `[${tag}] ${text}\n`;
      }
    }
    return result;
  });

  const fullHtml = await page.content();
  fs.writeFileSync('lovable_blood_test.txt', content);
  fs.writeFileSync('lovable_blood_test.html', fullHtml);
  
  console.log("Taking screenshot...");
  await page.screenshot({ path: 'lovable_blood_test.png', fullPage: true });
  
  await browser.close();
  console.log("Done.");
}

main().catch(console.error);
