const findKey = require('lodash/findKey');
const isEqual = require('lodash/isEqual');
const partial = require('lodash/partial');

const ALIASES = {
  'ETH': 'daggerhashimoto',
  'DCR': 'decred',
  'SC': 'sia',
  'LBC': 'lbry'
};

module.exports = {
  supportedAlgorithms: [
    'daggerhashimoto,decred',
    'daggerhashimoto,sia',
    'daggerhashimoto,lbry',
    // 'daggerhashimoto,pascal' // AMD only
  ],
  timedBenchmark: true,
  mineCmdLine: (algorithm, cudaGpuId, stratumUri, username) => {
    const algorithms = algorithm.split(',');
    return [
      '-allpools', 1,
      '-epool', `stratum+tcp://${stratumUri[0]}`,
      '-esm', 3,
      '-estale', 0,
      '-ewal', username,
      '-epsw', 'x',
      '-dcoin', findKey(ALIASES, partial(isEqual, algorithms[1])).toLowerCase(),
      '-dpool', `stratum+tcp://${stratumUri[1]}`,
      '-dwal', username,
      '-nofee', 1,
      '-di', cudaGpuId
    ];
  },
  extractHashrate: stdoutLine => {
    let match = /([A-Z]+) - Total Speed: ([\d.]+) ([kMGTP]?h)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[2]), match[3].toUpperCase() /* FIXME */, ALIASES[match[1]]] : null;
  },
  killProcess: ps => {
    ps.kill('SIGINT');
  }
};
