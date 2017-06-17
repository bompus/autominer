const request = require('request');

module.exports = {
  supportedAlgorithms: [
    'equihash',
    'pascal',
    'decred',
    'sia',
    'lbry',
    // 'daggerhashimoto' AMD only
  ],
  cmdLine: (algorithm, cudaGpuId) => [
    '-p', 38080 + parseInt(cudaGpuId)
  ],
  switchAlgorithm(algorithm, cudaGpuId) {

  },
  extractHashrate(stdoutLine) {
    let match = /Speed(?::| \[15 sec]: [\d.]+ I\/s,) ([\d.]+) ([kMGTP]?H|Sols)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess(ps) {
    ps.kill('SIGTERM');
  }
};
