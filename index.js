#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const fetchDouBanBooks = require('db-book');

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
  },
  {
    type: 'confirm',
    name: 'headless',
    message: '是否显示界面'
  }
];

(async () => {
  const answers = await inquirer.prompt(questions);
  const { username, password, headless } = answers;
  try {
    const books = await fetchDouBanBooks({
      username,
      password,
      headless: !headless
    });
    fs.writeFile('books.json', JSON.stringify(books), async err => {
      if (err) console.log(err);
      console.log('Bingo: ' + data.length);
      process.exit();
    });
  } catch (e) {
    console.log(e.message);
  }
})();
