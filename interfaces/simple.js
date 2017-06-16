const colors = require('colors/safe');
const {mBTC} = require('../util');

function logPrefix() {
  const date = new Date();
  return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}] `;
}

function log(str) {
  console.log(logPrefix() + str);
}

function logError(str) {
  console.error(logPrefix() + str);
}

function logDebug(str) {
  console.debug(logPrefix() + str);
}

module.exports = {
  initialize: gpus => {
    log('Found GPUs:');
    gpus.forEach(gpu => log(`\t${gpu.id}: ${gpu.name}`));
  },
  log: log,
  logError: logError,
  minerLog: (id, str) => {
    logDebug(`GPU ${id}: ${str}`);
  },
  clearMinerLog(id) {
  },
  updateMinerInfo(id, miner, alg, hashrate, hashType) {
  },
  updateStats(btcUsdPrice, totalProfitability, unpaidBalance) {
    log(`BTC-USD price: $${btcUsdPrice.toFixed(2)}`);
    log(`${mBTC(totalProfitability).toFixed(2)} mBTC/day ($${(totalProfitability * btcUsdPrice).toFixed(2)})`);
    log(`Unpaid balance: ${mBTC(unpaidBalance).toFixed(2)} mBTC ($${(unpaidBalance * btcUsdPrice).toFixed(2)})`);
  }
};