const {promisify} = require('util');
const {coinbaseApiKey, coinbaseApiSecret} = require('../config');
const CoinbaseClient = require('coinbase').Client;
const cb = new CoinbaseClient({apiKey: coinbaseApiKey, apiSecret: coinbaseApiSecret});

module.exports = {
  getBtcUsdPrice: () =>
    promisify(cb.getBuyPrice.bind(cb))({currencyPair: 'BTC-USD'})
      .then(obj => parseFloat(obj.data.amount))
};