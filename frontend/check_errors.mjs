import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push('ERROR: ' + text);
    else console.log('PAGE LOG:', text);
  });
  page.on('pageerror', error => {
    errors.push('PAGE ERROR: ' + error.message);
    console.log('PAGE ERROR:', error.message);
  });
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to login...');
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    console.log('Logging in as adminn...');
    await page.type('input[type="text"]', 'adminn');
    await page.type('input[type="password"]', 'admin123');
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    
    console.log('Current URL after login:', page.url());
    
    // Wait a bit to see if any delayed errors pop up
    await new Promise(r => setTimeout(r, 3000));
    
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const bodyText = await page.evaluate(() => document.body.innerText.substr(0, 200));
    console.log('Page content (first 200 chars):', bodyText);
    
    console.log('\n--- ERRORS ---');
    if (errors.length === 0) console.log('No errors found!');
    else errors.forEach(e => console.log(e));
    
  } catch (err) {
    console.error('Error during test:', err.message);
  }
  
  await browser.close();
})();
