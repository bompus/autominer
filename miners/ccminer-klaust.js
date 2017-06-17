const ALIASES = {
  'flax': 'c11',
  'whirlpool': 'whirl'
};

module.exports = {
  supportedAlgorithms: [
    'bitcoin',
    'blake',
    'blakecoin',
    'c11',
    'deep',
    'dmd-gr',
    'flax',
    'fresh',
    'fugue256',
    'groestl',
    'jackpot',
    'keccak',
    'luffa',
    'lyra2v2',
    'myr-gr',
    'neoscrypt',
    'nist5',
    'penta',
    'quark',
    'qubit',
    's3',
    'sia',
    'skein',
    'spread',
    'vanilla',
    // 'whirlpool', BROKEN
    'whirlpoolx',
    'x11',
    'x13',
    'x14',
    'x15',
    'x17',
    'yescrypt',
  ],
  timedBenchmark: true,
  mineCmdLine: (algorithm, cudaGpuId, stratumUri, username) => [
    '-a', ALIASES[algorithm] || algorithm,
    '-d', cudaGpuId,
    '-o', `stratum+tcp://${stratumUri}`,
    '-u', username,
    '-p', 'x',
    '-b', 0
  ],
  benchmarkCmdLine: (algorithm, cudaGpuId) => [
    '-a', ALIASES[algorithm] || algorithm,
    '-d', cudaGpuId,
    '-b', 0,
    '--benchmark'
  ],
  extractHashrate: stdoutLine => {
    let match = /(?:Total:|accepted: \d+\/\d+ \([\d.]+%\),) ([\d.]+) ([kMGTP]?H|Sol)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess: ps => {
    ps.kill('SIGINT');
  }
};
