const net = require('net');
const uuid = require('uuid');

function apiCommand(method, params) {
  return {id: 1, method, params: params || []};
}

function apiRequest(port, method, params) {
  const client = new net.Socket();
  return new Promise((res, rej) => {
    client.connect(port, '127.0.0.1', () => {
      let stringify = JSON.stringify(apiCommand(method, params));
      //console.log(`send data ${stringify}`);
      client.write(stringify + '\n');
    });
    client.on('data', data => {
      //console.log(`got data ${data.toString().trim()}`);
      let obj = JSON.parse(data);
      if (obj.error) {
        rej(obj.error);
      } else {
        res(obj);
      }
      client.destroy();
    });
    client.on('error', err => rej(err));
  });
}

module.exports = {
  supportedAlgorithms: [
    'equihash',
    'pascal',
    'decred',
    'sia',
    'lbry',
    // 'daggerhashimoto' AMD only
  ],
  timedBenchmark: true,
  cmdLine: (algorithm, cudaGpuId) => [
    '-p', 38080 + parseInt(cudaGpuId)
  ],
  switchAlgorithm(algorithm, cudaGpuId, stratumUri, username) {
    const port = 38080 + parseInt(cudaGpuId);
    apiRequest(port, 'algorithm.list')
      .then(data => {
        let promise = Promise.resolve();
        data.algorithms.forEach(alg => {
          alg.workers.forEach(obj => promise = promise.then(() => apiRequest(port, 'worker.free', [obj.worker_id])));
          promise = promise.then(() => apiRequest(port, 'algorithm.remove', [alg.algorithm_id]));
        });
        return promise;
      })
      .then(() => apiRequest(port, 'algorithm.add', [algorithm, stratumUri, `${username}:x`]))
      .then(data => apiRequest(port, 'worker.add', [data.algorithm_id.toString(), cudaGpuId /* FIXME find device_id */]));
  },
  extractHashrate(stdoutLine) {
    let match = /total speed: ([\d.]+) ([kMGTP]?H)\/s/.exec(stdoutLine);
    return match ? [parseFloat(match[1]), match[2]] : null;
  },
  killProcess(ps, cudaGpuId) {
    const port = 38080 + parseInt(cudaGpuId);
    apiRequest(port, 'quit').catch(() => ps.kill('SIGTERM'));
  },
  printHashrate(cudaGpuId) {
    apiRequest(38080 + parseInt(cudaGpuId), 'algorithm.print.speeds');
  }
};
