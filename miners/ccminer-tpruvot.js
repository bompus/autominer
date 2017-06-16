module.exports = {
  supportedAlgorithms: [
    'blakecoin',
    'blake',
    'blake2s',
    'bmw',
    'bastion',
    'deep',
    'decred',
    'fresh',
    'fugue256',
    'groestl',
    'heavy',
    'hmq1725',
    'keccak',
    'jackpot',
    'jha',
    'lbry',
    'luffa',
    'lyra2',
    'lyra2v2',
    'lyra2z',
    'myr-gr',
    'neoscrypt',
    'nist5',
    'penta',
    'qubit',
    'sha256d',
    'sha256t',
    'sia',
    'sib',
    'skein',
    'skein2',
    's3',
    'timetravel',
    'bitcore',
    'x11evo',
    'x11',
    'x13',
    'x14',
    'x15',
    'x17',
    'vanilla',
    'veltor',
    'whirlpool',
    'zr5'
  ],
  timedBenchmark: true,
  mineCmdLine: (algorithm, cudaGpuId, stratumUri, username) => [
    '-a', algorithm,
    '-d', cudaGpuId,
    '-o', `stratum+tcp://${stratumUri}`,
    '-u', username,
    '-p', 'x',
    '-b', 0
  ],
  benchmarkCmdLine: (algorithm, cudaGpuId) => [
    '-a', algorithm,
    '-d', cudaGpuId,
    '-b', 0,
    '--benchmark'
  ],
  extractHashrate: stdoutLine => {
    let match = /GPU #\d+: .+, ([\d.]+) ([kMGTP]H)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess: ps => {
    ps.kill('SIGINT');
  }
};