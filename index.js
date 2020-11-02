const puppeteer = require('puppeteer');
// const fs = require('fs-extra');
const reader = require('readline-sync');
const player = require('play-sound')((opts = {}));
const opn = require('opn');

const timeout = 1000 * 30;
const bestbuy = {
  site: 'Best Buy',
  waitFor: '.fulfillment-add-to-cart-button',
  findComponent: '.btn',
  soldOut: 'Sold Out',
};
const newegg = {
  site: 'New Egg',
  waitFor: '#ProductBuy',
  findComponent: '.btn',
  soldOut: 'Auto Notify',
};
const amazon = {
  site: 'Amazon',
  waitFor: '#availability',
  findComponent: '#add-to-cart-button',
  soldOut: 'Currently unavailable',
};

const searches = [];
searches.push({
  url:
    'https://www.bestbuy.com/site/asus-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-strix-graphics-card-black/6432445.p?skuId=6432445',
  name: 'ASUS 3080 Strix',
  ...bestbuy,
});
searches.push({
  url:
    'https://www.bestbuy.com/site/evga-geforce-rtx-3080-ftw3-ultra-gaming-10gb-gddr6x-pci-express-4-0-graphics-card/6436196.p?skuId=6436196',
  name: 'EVGA 3080 FTW3 ULTRA GAMING',
  ...bestbuy,
});
searches.push({
  url:
    'https://www.newegg.com/asus-geforce-rtx-3080-rog-strix-rtx3080-o10g-gaming/p/N82E16814126457',
  name: 'ASUS 3080 Strix',
  ...newegg,
});
searches.push({
  url:
    'https://www.newegg.com/asus-geforce-rtx-3080-tuf-rtx3080-o10g-gaming/p/N82E16814126452',
  name: 'ASUS 3080 TUF',
  ...newegg,
});
searches.push({
  url: 'https://www.amazon.com/dp/B08J6F174Z',
  name: 'ASUS 3080 Strix',
  ...amazon,
});
searches.push({
  url: 'https://www.amazon.com/dp/B08HR55YB5/',
  name: 'EVGA 3080 XC3 ULTRA GAMING',
  ...amazon,
});
// searches.push({
//   url: 'https://www.amazon.com/dp/B089RLNK7Y',
//   name: 'amazon instock test',
//   ...amazon,
// });

const searchForStock = async (item) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
    );

    console.log(`Searching ${item.name} on ${item.site}, loading...`);
    await page.goto(item.url.trim());
    await page.waitForSelector(item.waitFor);
    console.log(`Searching ${item.name} on ${item.site}, load completed...`);
    let flag = false;
    const items = await page.$$(item.waitFor);
    if (items.length > 0) {
      if (item.site === 'Amazon') {
        const find = await page.$$(item.findComponent);
        if (find.length >0) {
          flag = true;
        }
      } else {
        let btn = await items[0].$(item.findComponent);
        let status = 'N/A';

        if (btn) {
          status = await page.evaluate((item) => item.innerText, btn);
        }
        if (
          !status
            .trim()
            .toLowerCase()
            .includes(item.soldOut.trim().toLowerCase())
        ) {
          flag = true;
        }
      }

      if (flag) {
        player.play('./assets/mp3/alert.mp3', function (err) {
          if (err) throw err;
        });
        opn(item.url);
      } else {
        console.log(
          '\x1b[41m',
          `Searching ${item.name} on ${item.site}, Sold Out`,
          '\x1b[40m'
        );

        setTimeout(() => {
          searchForStock(item);
        }, timeout);
        console.log(`waiting for next search to start in ${timeout}ms...`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log('ERROR----->', error,'\n',item  );
  }
};

async function main() {
  try {
    for (let i = 0; i < searches.length; i++) {
      let search = searches[i];
      searchForStock(search);
    }
  } catch (error) {
    console.log('ERROR----->', error);
  }
}

main();
