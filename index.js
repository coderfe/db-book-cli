const fs = require('fs');
const puppeteer = require('puppeteer-core');
const config = require('./config');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.goto(
    'https://accounts.douban.com/passport/login_popup?login_source=anony'
  );
  await page.click('.account-tab-account');
  await page.type('#username', config.username);
  await page.type('#password', config.password);
  await page.click('.account-form-field-submit');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await page.goto('https://book.douban.com/people/84902716/do');

  const items = await page.$$eval('.subject-item', els => {
    return els.map(item => {
      return {
        status: 'do',
        img: item.getElementsByTagName('img')[0].src,
        title: item
          .getElementsByTagName('h2')[0]
          .textContent.replace(/\s/g, ''),
        author: item
          .getElementsByClassName('pub')[0]
          .textContent.split('/')[0]
          .trim(),
        comment: item.getElementsByClassName('comment')[0].textContent.trim()
      };
    });
  });

  fs.writeFile('books.json', JSON.stringify(items), err => {
    if (err) process.exit(0);
    console.log('done');
  });
  await browser.close();
})();
