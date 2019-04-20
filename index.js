const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chalk = require('chalk');

const config = require('./config');
const log = console.log;

(async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    executablePath: '/opt/google/chrome/google-chrome'
  });
  const page = await browser.newPage();
  log(chalk.yellow('服务已启动...'));
  await page.goto(
    'https://accounts.douban.com/passport/login_popup?login_source=anony'
  );
  await page.click('.account-tab-account');
  await page.type('#username', config.username);
  await page.type('#password', config.password);
  await page.click('.account-form-field-submit');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  log(chalk.green(`登录成功：${config.username}`));

  await page.goto('https://book.douban.com/people/84902716/wish');
  const wish = await resolveBooks('wish');
  await page.waitFor(2000);

  await page.goto('https://book.douban.com/people/84902716/do');
  const dos = await resolveBooks('do');
  await page.waitFor(2000);

  await page.goto('https://book.douban.com/people/84902716/collect');
  const collect = await resolveBooks('collect');

  fs.writeFile(
    'books.json',
    JSON.stringify([...wish, ...dos, ...collect]),
    async err => {
      if (err) console.log(err);
      log(
        chalk.green(
          `想读： ${wish.length}  在读：${dos.length}  读过：${collect.length}`
        )
      );
      await browser.close();
    }
  );

  async function resolveBooks(status) {
    const books = await page.$$eval('.subject-item', (els, status) => {
      return els.map(item => {
        return {
          status,
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
    }, status);
    const nextBtn = await page.evaluate(() => {
      const el = document.querySelector('.paginator .next a');
      if (el) return true;
      return false;
    });
    if (!nextBtn) return books;
    await page.click('.paginator .next a');
    await page.waitForSelector('.subject-item');
    const data = await resolveBooks(status);
    return books.concat(data);
  }
})();
