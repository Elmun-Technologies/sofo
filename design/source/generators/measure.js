const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const S = process.argv[2]; const names = process.argv.slice(3);
const map = {cb4f087928b468549d841e1ee3e42661:'p1184918.jpg','08d298c5c43e27d20a009e1485cb9b3b':'p94605.jpg','79f8fee8ed49eaf30382120f6b21d16f':'p1022789.jpg','8e2de4d5af09254f1969c0aac5f7ff72':'p85937.jpg','1e670cb28388c895319bac5d4cfbc2c3':'p1241982.jpg',adb806acfa10e9988ff559ed874dc96e:'p1011985.jpg','5ded58698603822d03ccd70fd08231b5':'p354912.jpg',e622889c112ac94528cebedd9f389f09:'p95479.jpg',c7d07cd502e08e290cd41761b2472cef:'p129.jpg','2e0943299c347febf750aa19360d1513':'p568124.jpg','93cf3e1c3aaff5d0d4a1608218ae34b7':'p1429.jpg','47f8a7c4cd8d8c24bf5128dfbdba945e':'p502356.jpg','03b2f15bf88d978897f8069cf919e46b':'p569094.jpg',d72425766e887bab76cad923ba40aba6:'p976573.jpg','33e8d6e312d2c2a28eb7e6c8b92bd882':'p508442.jpg','8a0c424f5b0aaaf2e47ebfabe38e12cd':'p508943.jpg',b696d2769e7c1c80631606bc89386aec:'p37854.jpg','39beccc02edc0ee830f583d6e867930b':'p60625.jpg',fa46bb4c0cfc8f046cc08899da9bc5aa:'p456.jpg',f1bae5f68de0a4210ef79a94e898eb6b:'bd-robot.jpg',eccffb3d20c5131d98f95617ef8f8b32:'bd-arcane.jpg','1a1c9590170189ced4c2504e9d847887':'bd-spider.jpg',d5a4b5eb4214f38a4ed921decc62a2a3:'bd-panda.jpg','2773e2d8f4575e5e9ed94235960a3900':'bd-spirited.jpg','1179309321f9ffa02b539f4c31ff5bd0':'bd-encanto.jpg','4ca3d3239df179d68432e3dd05cd8583':'bd-coco.jpg','639102cbae922345a6f75cfad5711f2f':'bd-insideout.jpg',c49a556dcc34438b5a142c8f6c07aa21:'bd-demon.jpg',d2df8e6b31dc8a17d738cdcbe082abae:'lg-netflix.png','996ff9952cc48dec9ccd2e076c38e147':'lg-prime.png','73cc46ffcd16b9ca2ab5420acf984a61':'lg-disney.png'};
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const n of names) {
    let h = fs.readFileSync(`${S}/canvas/project/${n}.dc.html`, 'utf8');
    h = h.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => 'file://' + S + '/img/' + (map[id] || 'x'));
    h = h.replace('<script src="./support.js"></script>', '');
    fs.writeFileSync(`${S}/prev/${n}.html`, h);
    const w = (/Mobile/.test(n) || /^M[A-Z]/.test(n)) ? 390 : 1440;
    const p = await b.newPage({ viewport: { width: w, height: 600 } });
    await p.goto('file://' + S + '/prev/' + n + '.html', { waitUntil: 'load', timeout: 30000 }).catch(()=>{});
    await p.waitForTimeout(800);
    const hh = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    res[n] = [hh, sw];
    await p.screenshot({ path: `${S}/prev/${n}.png`, fullPage: true });
    await p.close();
  }
  console.log(JSON.stringify(res)); await b.close();
})();
