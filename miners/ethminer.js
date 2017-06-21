module.exports = {
  supportedAlgorithms: [
    'daggerhashimoto'
  ],
  timedBenchmark: false,
  mineCmdLine: (algorithm, cudaGpuId, stratumUri, username) => [
    '-U',
    '--cuda-devices', cudaGpuId,
    '-S', stratumUri,
    '-SP', 2,
    '-O', `${username}:x`
  ],
  benchmarkCmdLine: (algorithm, cudaGpuId) => [
    '-U',
    '--cuda-devices', cudaGpuId,
    '--benchmark'
  ],
  extractHashrate: stdoutLine => {
    let match = /Trial \d+\.\.\. ([\d.]+)/.exec(stdoutLine);
    if (match)
      return [parseFloat(match[1]), 'H'];
    match = /Mining on PoWhash #[a-f0-9]+ : ([\d.]+)([kMGTP]?H)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess: ps => {
    ps.kill('SIGINT');
  }
};
