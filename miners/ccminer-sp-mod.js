const ALIASES = {
  'whirlpool': 'whirl'
};

module.exports = {
  supportedAlgorithms: [
    'bastion',
    'bitcoin',
    'blake',
    'blakecoin',
    'c11',
    'credit',
    'deep',
    'dmd-gr',
    'flax',
    'fresh',
    'fugue256',
    'groestl',
    'heavy',
    'jackpot',
    'keccak',
    'luffa',
    'lyra2',
    'lyra2v2',
    'mjollnir',
    'myr-gr',
    'neoscrypt',
    // 'nist5', BROKEN
    'penta',
    'quark',
    'qubit',
    's3',
    'scrypt',
    'scrypt-jane',
    'skein',
    'spread',
    'vanilla',
    'whirlpool',
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
    let match = /(?:Total:|accepted: \d+\/\d+ \([\d.]+%\),|GPU #\d+:) ([\d.]+) ?([kMGTP]?H|Sol|hash)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess: ps => {
    ps.kill('SIGINT');
  }
};
