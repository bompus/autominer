const {exec} = require('child_process');
const paths = require('path');
const pty = require('pty.js');

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
    let file = paths.resolve(path);
    const cwd = paths.dirname(paths.resolve(path));
    if (path.endsWith('.exe')) {
      args = args || [];
      args.unshift(file);
      file = 'wine'; // Requires wine-staging
    }
    const ps = pty.spawn(file, args, {cwd, env:
      {'CUDA_DEVICE_ORDER': 'PCI_BUS_ID', 'LD_PRELOAD': '/usr/lib/libcurl.so.3'}
    });
    processes.push(ps);
    ps.on('close', () => processes = processes.filter(v => v !== ps));
    return ps;
  },
  terminateProcesses: () => {
    processes.forEach(ps => ps.kill('SIGTERM'));
    processes = [];
  }
};
