const colors = require('colors/safe');
const death = require('death');
const {mBTC} = require('../util');

function logPrefix() {
  const date = new Date();
  return colors.blue(`[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}] `);
}

function log(str) {
  console.log(logPrefix() + str);
}

function logError(str) {
  console.error(logPrefix() + str);
}

function logDebug(str) {
  console.log(colors.gray(str));
}

module.exports = {
  initialize: (gpus, quit) => {
    death(quit);

    log('Found GPUs:');
    gpus.forEach(gpu => log(`\t${gpu.id}: ${gpu.name}`));
  },
  log: log,
  logError: logError,
  minerLog: (id, str) => {
    str.split('\n').forEach(line => logDebug(`GPU ${id}: ${colors.reset(line)}`));
  },
  clearMinerLog(id) {
  },
  updateMinerInfo(id, miner, alg, hashrate, hashType) {
  },
  updateStats(btcUsdPrice, totalProfitability, unpaidBalance) {
    log(`BTC-USD price: $${btcUsdPrice.toFixed(2)}`);
    log(`Profitability: ${mBTC(totalProfitability).toFixed(2)} mBTC/day ($${(totalProfitability * btcUsdPrice).toFixed(2)})`);
    log(`Unpaid balance: ${mBTC(unpaidBalance).toFixed(2)} mBTC ($${(unpaidBalance * btcUsdPrice).toFixed(2)})`);
  }
};
