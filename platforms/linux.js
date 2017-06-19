const {exec, spawn} = require('child_process');
const paths = require('path');

let processes = [];
module.exports = {
  queryGpus: () => new Promise((res, rej) => {
    const gpus = [];
    exec('nvidia-smi -L', (err, stdout) => {
      if (err) rej(err);
      const regex = /GPU (\d+): (.+?) \(/g;
      let match;
      while ((match = regex.exec(stdout)) !== null) {
        gpus.push({id: match[1], name: match[2]});
      }
      res(gpus);
    });
    // TODO support AMD GPUs
  }),
  spawn: (path, args) => {
    if (path.endsWith('.exe')) {
      args = args || [];
      args.unshift(path);
      path = 'wine'; // Requires wine-staging
    }
    const ps = spawn(path, args, {env: {'CUDA_DEVICE_ORDER': 'PCI_BUS_ID'}, cwd: paths.dirname(path)});
    processes.push(ps);
    ps.on('close', () => processes = processes.filter(v => v !== ps));
    return ps;
  },
  terminateProcesses: () => {
    processes.forEach(ps => ps.kill('SIGTERM'));
    processes = [];
  }
};
