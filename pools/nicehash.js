const {PH, TH, GH, MH, kH, H} = require('../util');
const {nicehashApiId, nicehashApiKey, username} = require('../config');
const NiceHashClient = require('nicehash');
const nh = new NiceHashClient({apiId: nicehashApiId, apiKey: nicehashApiKey});
const findIndex = require('lodash/findIndex');

const ALIASES = {
  'lyra2v2': 'lyra2rev2'
};

const ALGORITHMS = [
  {name: 'Scrypt'},
  {name: 'SHA256', rate: PH, algorithm: 'sha256d'},
  {name: 'ScryptNf'},
  {name: 'X11', algorithm: 'x11'},
  {name: 'X13', algorithm: 'x13'},
  {name: 'Keccak', algorithm: 'keccak'},
  {name: 'X15', algorithm: 'x15'},
  {name: 'Nist5', algorithm: 'nist5'},
  {name: 'NeoScrypt', algorithm: 'neoscrypt'},
  {name: 'Lyra2RE', algorithm: 'lyra2'},
  {name: 'WhirlpoolX', algorithm: 'whirlpool'},
  {name: 'Qubit', algorithm: 'qubit'},
  {name: 'Quark'},
  {name: 'Axiom', rate: kH},
  {name: 'Lyra2REv2', algorithm: 'lyra2v2'},
  {name: 'ScryptJaneNf16', rate: MH},
  {name: 'Blake256r8', rate: TH},
  {name: 'Blake256r14'},
  {name: 'Blake256r8vnl'},
  {name: 'Hodl', rate: kH},
  {name: 'DaggerHashimoto'},
  {name: 'Decred', rate: TH, algorithm: 'decred'},
  {name: 'CryptoNight', rate: MH, algorithm: 'cryptonight'},
  {name: 'Lbry', rate: TH, algorithm: 'lbry'},
  {name: 'Equihash', rate: MH, algorithm: 'equihash'},
  {name: 'Pascal'},
  {name: 'X11Gost', algorithm: 'sib'},
  {name: 'Sia', rate: TH, algorithm: 'sia'},
];

module.exports = {
  supportedAlgorithms: ALGORITHMS.map(val => val.algorithm).filter(val => !!val),
  fetchPrices: () => {
    return nh.getGlobalCurrentStats(1).then(res => {
      const results = {};
      res.body.result.stats.forEach(s => {
        let price = parseFloat(s.price);
        let alg = ALGORITHMS[s.algo];
        if (alg.algorithm) {
          // console.log(`${alg.name}: ${s.price} => ${price / (alg.rate || GH)}`);
          results[alg.algorithm] = price / (alg.rate || GH);
        }
      });
      return results;
    })
  },
  fetchStats: () => {
    return nh.getDetailedProviderStats(username.split('.')[0])
      .then(res => {
        let totalProfitability = 0, unpaidBalance = 0;
        if (!res.body.result || res.body.result.error) {
          return Promise.reject(`API request failed: ${(res.body.result && res.body.result.error) || 'unknown error'}`);
        }
        for (let obj of res.body.result.current) {
          if (obj.data && obj.data[0] && obj.data[0].a) {
            totalProfitability += obj.profitability * parseFloat(obj.data[0].a);
          }
          if (obj.data && obj.data[1]) {
            unpaidBalance += parseFloat(obj.data[1]);
          }
        }
        return [totalProfitability, unpaidBalance];
      });
  },
  buildStratumUri: alg => {
    let index = findIndex(ALGORITHMS, val => val.algorithm === alg);
    if (index === -1)
      throw new Error(`NiceHash: Unsupported algorithm ${alg}`);
    return `${ALIASES[alg] || alg}.usa.nicehash.com:${3333 + index}`;
  }
};