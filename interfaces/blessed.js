const blessed = require('blessed');
const {mBTC} = require('../util');

const screen = blessed.screen({
  smartCSR: true,
  dockBorders: true
});
screen.title = 'Miner';

const consoleTitle = blessed.text({
  top: 0,
  tags: true,
  height: 'shrink',
  width: '10%',
  style: {fg: 'white'},
  content: ' {bold}Console{/bold}'
});
screen.append(consoleTitle);

const consoleInfo = blessed.text({
  top: 0,
  left: '10%',
  tags: true,
  height: 1,
  width: '40%',
  style: {fg: 'white'},
  align: 'right',
  right: 0
});
screen.append(consoleInfo);

const consoleBox = blessed.box({
  top: 1,
  height: '100%-1',
  width: '50%',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    }
  },
  scrollable: true,
  mouse: true
});
screen.append(consoleBox);

function logPrefix() {
  const date = new Date();
  return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}] `;
}

function logintern(str) {
  consoleBox.pushLine(str);
  consoleBox.setScrollPerc(100);
  screen.render();
}

const gpuBox = {};
const gpuInfo = {};

module.exports = {
  initialize: (gpus, exitCallback) => {
    screen.key(['escape', 'q', 'C-c'], exitCallback);

    let gpuBoxHeight = (100 / gpus.length).toFixed(0);
    gpus.forEach((gpu, i) => {
      const titleText = blessed.text({
        top: `${i * gpuBoxHeight}%`,
        left: '50%',
        tags: true,
        height: 'shrink',
        width: '25%',
        style: {fg: 'white'},
        content: ` {bold}GPU ${gpu.id}: ${blessed.escape(gpu.name)}{/bold}`
      });
      const infoText = gpuInfo[gpu.id] = blessed.text({
        top: `${i * gpuBoxHeight}%`,
        left: '75%',
        tags: true,
        height: 1,
        width: '25%',
        style: {fg: 'white'},
        align: 'right',
        right: 0
      });
      const box = gpuBox[gpu.id] = blessed.box({
        left: '50%',
        top: `${i * gpuBoxHeight}%+1`,
        height: `${gpuBoxHeight}%-1`,
        width: '50%',
        tags: true,
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          border: {
            fg: '#f0f0f0'
          }
        },
        scrollable: true,
        mouse: true
      });
      screen.append(titleText);
      screen.append(infoText);
      screen.append(box);
    });
    consoleBox.focus();
    screen.render();
  },
  log: str => {
    logintern(logPrefix() + blessed.escape(str.toString()));
  },
  logError: str => {
    logintern(`{red-bg}${logPrefix()}${blessed.escape(str.toString())}{/red-bg}`);
  },
  minerLog: (id, str) => {
    gpuBox[id].pushLine(blessed.escape(str));
    gpuBox[id].setScrollPerc(100);
    screen.render();
  },
  clearMinerLog(id) {
    gpuBox[id].setContent('');
    gpuInfo[id].setContent('');
    screen.render();
  },
  updateMinerInfo(id, miner, alg, hashrate, hashType) {
    gpuInfo[id].setContent(`${miner} {bold}${alg}{/bold}${hashrate ? ` | ${hashrate.toFixed(2)} ${hashType}/s` : ''}`);
  },
  updateStats(btcUsdPrice, totalProfitability, unpaidBalance) {
    consoleInfo.setContent(`BTC: $${btcUsdPrice.toFixed(2)} | ${mBTC(totalProfitability).toFixed(2)} mBTC/day ($${(totalProfitability * btcUsdPrice).toFixed(2)}) | Unpaid: ${mBTC(unpaidBalance).toFixed(2)} mBTC ($${(unpaidBalance * btcUsdPrice).toFixed(2)})`);
    screen.render();
  }
};