module.exports = {
  supportedAlgorithms: [
    'equihash'
  ],
  timedBenchmark: false,
  mineCmdLine: (algorithm, cudaGpuId, stratumUri, username) => [
    '-a', 0,
    '-l', stratumUri,
    '-u', username,
    '-cd', cudaGpuId,
  ],
  benchmarkCmdLine: (algorithm, cudaGpuId) => [
    '-a', 0,
    '-b', 10000,
    '-cd', cudaGpuId,
  ],
  extractHashrate: stdoutLine => {
    let match = /Speed(?::| \[15 sec]: [\d.]+ I\/s,) ([\d.]+) Sols\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), 'Sol'] : null;
  },
  killProcess: ps => {
    ps.kill('SIGTERM');
  }
};
