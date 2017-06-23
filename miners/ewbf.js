module.exports = {
  supportedAlgorithms: [
    'equihash'
  ],
  timedBenchmark: true,
  mineCmdLine(algorithm, cudaGpuId, stratumUri, username) {
    const [uri, port] = stratumUri.split(':');
    return [
      '--server', uri,
      '--port', port,
      '--user', username,
      '--pass', 'x',
      '--cuda_devices', cudaGpuId,
      '--fee', 0
    ];
  },
  extractHashrate(stdoutLine) {
    const match = /Total speed: ([\d.]+) Sol\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), 'Sol'] : null;
  },
  killProcess(ps) {
    ps.kill('SIGINT');
  }
};
