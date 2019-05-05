#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const puppeteer = require('puppeteer-core');
const ora = require('ora');
const axios = require('axios');
const inquirer = require('inquirer');

const questions = [
  {
    type: 'input',
    name: 'username',
    message: '豆瓣账号'
  },
  {
    type: 'password',
    name: 'password',
    message: '豆瓣账号密码'
  }
];

(async () => {
  const answers = await inquirer.prompt(questions);
  const { username, password } = answers;

  if (!username || !password) {
    return process.exit(1);
  }

  const spinner = ora('服务正在启动').start();
  let executablePath = '';
  switch (os.platform()) {
    case 'win32':
      executablePath =
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
      break;
    case 'linux':
      executablePath = '/opt/google/chrome/google-chrome';
      break;
  }

  if (!executablePath) {
    spinner.stopAndPersist({
      prefixText: '❌',
      text: '登录超时...'
    });
    return process.exit(1);
  }

  try {
    const browser = await puppeteer.launch({
      executablePath
    });
    const page = await browser.newPage();
    spinner.text = `正在登录：${username}`;
    await page.goto(
      'https://accounts.douban.com/passport/login_popup?login_source=anony'
    );
    await page.click('.account-tab-account');
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('.account-form-field-submit');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    spinner.text = '登录成功...';

    spinner.text = '想读的书...';
    await page.goto('https://book.douban.com/mine?status=wish');
    const wish = await resolveBooks('wish');
    await page.waitFor(2000);

    spinner.text = '在读的书...';
    await page.goto('https://book.douban.com/mine?status=do');
    const dos = await resolveBooks('do');
    await page.waitFor(2000);

    spinner.text = '读过的书...';
    await page.goto('https://book.douban.com/mine?status=collect');
    const collect = await resolveBooks('collect');

    const books = [...wish, ...dos, ...collect];
    try {
      spinner.text = '正在保存到数据库';
      await axios.delete(config.batchService);
      await axios.post(config.batchService, books);
      await browser.close();
    } catch (error) {
      fs.writeFile('books.json', JSON.stringify(books), async err => {
        if (err) console.log(err);
        spinner.text = '正在保存为 JSON';
        await browser.close();
      });
    } finally {
      spinner.stopAndPersist({
        prefixText: '✅',
        text: `想读 - ${wish.length}  在读 - ${dos.length}  读过 - ${
          collect.length
        }`
      });
    }
  } catch (error) {
    spinner.stopAndPersist({
      prefixText: '❌',
      text: 'Chrome 启动超时...'
    });
    process.exit(1);
  }

  async function resolveBooks(status) {
    const books = await page.$$eval(
      '.subject-item',
      (els, status) => {
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
            comment: item
              .getElementsByClassName('comment')[0]
              .textContent.trim(),
            tags: item.getElementsByClassName('tags')[0]
              ? item
                  .getElementsByClassName('tags')[0]
                  .textContent.replace(/\n/g, '')
                  .split(': ')[1]
                  .split(' ')
              : [],
            date: item.getElementsByClassName('date')[0]
              ? item
                  .getElementsByClassName('date')[0]
                  .textContent.match(/\d{4}-\d{2}-\d{2}/)[0]
              : ''
          };
        });
      },
      status
    );
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
