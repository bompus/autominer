const fs = require('fs');
const {promisify} = require('util');
const NiceHashClient = require('nicehash');
const CoinbaseClient = require('coinbase').Client;
const {COINBASE_API_KEY, COINBASE_SECRET_KEY, NICEHASH_API_ID, NICEHASH_API_KEY, NICEHASH_USERNAME} = require('./config');
const blessed = require('blessed');
const {spawn} = require('child_process');

const PH = Math.pow(10, 15);
const TH = Math.pow(10, 12);
const GH = Math.pow(10, 9);
const MH = Math.pow(10, 6);
const kH = Math.pow(10, 3);

const RATES = {PH, TH, GH, MH, kH};

const ALGORITHMS = [
  {name: 'Scrypt'},
  {name: 'SHA256', rate: PH, miners: {ccminer: 'sha256d'}},
  {name: 'ScryptNf'},
  {name: 'X11', miners: {ccminer: 'x11'}},
  {name: 'X13', miners: {ccminer: 'x13'}},
  {name: 'Keccak', miners: {ccminer: 'keccak'}},
  {name: 'X15', miners: {ccminer: 'x15'}},
  {name: 'Nist5', miners: {ccminer: 'nist5'}},
  {name: 'NeoScrypt', miners: {ccminer: 'neoscrypt'}},
  {name: 'Lyra2RE', miners: {ccminer: 'lyra2'}},
  {name: 'WhirlpoolX', miners: {ccminer: 'whirlpool'}},
  {name: 'Qubit', miners: {ccminer: 'qubit'}},
  {name: 'Quark'},
  {name: 'Axiom', rate: kH},
  {name: 'Lyra2REv2', miners: {ccminer: 'lyra2v2'}},
  {name: 'ScryptJaneNf16', rate: MH},
  {name: 'Blake256r8', rate: TH},
  {name: 'Blake256r14'},
  {name: 'Blake256r8vnl'},
  {name: 'Hodl', rate: kH},
  {name: 'DaggerHashimoto'},
  {name: 'Decred', rate: TH, miners: {ccminer: 'decred'}},
  {name: 'CryptoNight', rate: MH, miners: {cpuminer: 'cryptonight'}},
  {name: 'Lbry', rate: TH, miners: {ccminer: 'lbry'}},
  {name: 'Equihash', miners: {cpuminer: 'equihash'}},
  {name: 'Pascal'},
  {name: 'X11Gost', miners: {ccminer: 'sib'}},
  {name: 'Sia', rate: TH, miners: {ccminer: 'sia'}},
];

const MINERS = {
  ccminer: {
    path: '../ccminer/ccminer',
    gpuHashrate: {}
  }
};

const GPUS = [];

const screen = blessed.screen({
  smartCSR: true,
  dockBorders: true
});
screen.title = 'Miner';

const boxTitle = blessed.text({
  top: 0,
  tags: true,
  height: 'shrink',
  width: '10%',
  style: {fg: 'white'},
  content: ' {bold}Console{/bold}'
});
screen.append(boxTitle);

const boxTitle2 = blessed.text({
  top: 0,
  left: '10%',
  tags: true,
  height: 1,
  width: '40%',
  style: {fg: 'white'},
  align: 'right',
  right: 0
});
screen.append(boxTitle2);

const box = blessed.box({
  top: 1,
  height: '100%-1',
  width: '50%',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0'
    }
  },
  scrollable: true,
  mouse: true
});
screen.append(box);

screen.key(['escape', 'q', 'C-c'], () => {
  for (let gpu of GPUS) {
    if (gpu.ps)
      gpu.ps.kill('SIGINT');
  }
  process.exit(0);
});

box.focus();
screen.render();

function logPrefix() {
  const date = new Date();
  return `[${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}] `;
}

function logintern(str) {
  box.pushLine(str);
  box.setScrollPerc(100);
  screen.render();
}

function log(str) {
  logintern(logPrefix() + blessed.escape(str.toString()));
}

function logerr(str) {
  logintern(`{red-bg}${logPrefix()}${blessed.escape(str.toString())}{/red-bg}`);
}

let currentGpu = null;
const benchmark = fs.readFileSync('ccminer-benchmark');
benchmark.toString().split('\n').forEach(line => {
  const timestampEnd = line.indexOf(']');
  if (timestampEnd !== -1) {
    line = line.substr(timestampEnd + 1).trim();
    if (line.includes('Benchmark results for ')) {
      let match = /GPU #(\d+) - (.+?):$/.exec(line);
      currentGpu = parseInt(match[1]);
      GPUS[currentGpu] = {name: match[2]};
    } else if (currentGpu !== null) {
      let match = /^(.+?)\s*:\s*([\d.]+) kH\/s/.exec(line);
      (MINERS.ccminer.gpuHashrate[match[1]] = MINERS.ccminer.gpuHashrate[match[1]] || [])[currentGpu] = parseFloat(match[2]) * 1000;
    }
  }
});

let gpuBoxHeight = (100 / GPUS.length).toFixed(0);
for (let i in GPUS) {
  let gpu = GPUS[i];
  gpu.title = blessed.text({
    top: `${i * gpuBoxHeight}%`,
    left: '50%',
    tags: true,
    height: 'shrink',
    width: '25%',
    style: {fg: 'white'},
    content: ` {bold}GPU #${i}: ${blessed.escape(gpu.name)}{/bold}`
  });
  gpu.info = blessed.text({
    top: `${i * gpuBoxHeight}%`,
    left: '75%',
    tags: true,
    height: 1,
    width: '25%',
    style: {fg: 'white'},
    align: 'right',
    right: 0
  });
  gpu.box = blessed.box({
    left: '50%',
    top: `${i * gpuBoxHeight}%+1`,
    height: `${gpuBoxHeight}%-1`,
    width: '50%',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: '#f0f0f0'
      }
    },
    scrollable: true,
    mouse: true
  });
  screen.append(gpu.title);
  screen.append(gpu.info);
  screen.append(gpu.box);
  screen.render();
}

function mBTC(i) {
  return i * 1000;
}

let btcUsdPrice;

function fetchStats() {
  const nh = new NiceHashClient();
  const cb = new CoinbaseClient({apiKey: COINBASE_API_KEY, apiSecret: COINBASE_SECRET_KEY});
  return promisify(cb.getBuyPrice.bind(cb))({currencyPair: 'BTC-USD'})
    .then(obj => btcUsdPrice = parseFloat(obj.data.amount))
    .then(() => nh.getGlobalCurrentStats(1))
    .then(res => {
      const cpuProfitability = {};
      const gpuProfitabilities = [];
      res.body.result.stats.forEach(s => {
        let price = parseFloat(s.price);
        let alg = ALGORITHMS[s.algo];
        if (s.price > 0 && alg && alg.miners && alg.miners.ccminer && MINERS.ccminer.gpuHashrate[alg.miners.ccminer]) {
          log(`${alg.name} price: ${mBTC(price).toFixed(2)} mBTC`);
          let rates = MINERS.ccminer.gpuHashrate[alg.miners.ccminer];
          for (let gpu in rates) {
            if (rates.hasOwnProperty(gpu)) {
              let profitability = (rates[gpu] / (alg.rate || GH)) * price;
              (gpuProfitabilities[gpu] = gpuProfitabilities[gpu] || [])[s.algo] = profitability;
              log(`GPU #${gpu} ${GPUS[gpu].name}: ${mBTC(profitability).toFixed(2)} mBTC/day ($${(profitability * btcUsdPrice).toFixed(2)})`);
            }
          }
        }
      });
      return gpuProfitabilities;
    });
}

function printStats() {
  const nh = new NiceHashClient({apiId: NICEHASH_API_ID, apiKey: NICEHASH_API_KEY});
  return nh.getDetailedProviderStats(NICEHASH_USERNAME.split('.')[0])
    .then(res => {
      let totalProfitability = 0, unpaidBalance = 0;
      if (!res.body.result || res.body.result.error) {
        logerr(`API request failed: ${(res.body.result && res.body.result.error) || 'unknown error'}`);
        return;
      }
      for (let obj of res.body.result.current) {
        if (obj.data && obj.data[0] && obj.data[0].a) {
          totalProfitability += obj.profitability * parseFloat(obj.data[0].a);
        }
        if (obj.data && obj.data[1]) {
          unpaidBalance += parseFloat(obj.data[1]);
        }
      }
      // log(`BTC-USD price: $${btcUsdPrice.toFixed(2)}`);
      // log(`Total profitability: ${mBTC(totalProfitability).toFixed(2)} mBTC/day ($${(totalProfitability * btcUsdPrice).toFixed(2)})`);
      // log(`Unpaid balance: ${mBTC(unpaidBalance).toFixed(2)} mBTC ($${(unpaidBalance * btcUsdPrice).toFixed(2)})`);

      boxTitle2.setContent(`BTC: $${btcUsdPrice.toFixed(2)} | ${mBTC(totalProfitability).toFixed(2)} mBTC/day ($${(totalProfitability * btcUsdPrice).toFixed(2)}) | Unpaid: ${mBTC(unpaidBalance).toFixed(2)} mBTC ($${(unpaidBalance * btcUsdPrice).toFixed(2)})`);
    });
}

function switchMiners(gpuProfits) {
  for (let num in gpuProfits) {
    if (gpuProfits.hasOwnProperty(num)) {
      let p = gpuProfits[num];
      let gpu = GPUS[num];
      let alg = p.reduce((a, b, i) => a !== null && p[a] > b ? a : i, null);
      let algval = ALGORITHMS[alg].miners.ccminer;
      logintern(`${logPrefix()}GPU #${num} ${gpu.name}: choosing algorithm {bold}${algval}{/bold}`);

      if (gpu.current === algval)
        continue;
      if (gpu.ps) {
        gpu.ps.kill('SIGINT');
        gpu.box.setContent('');
      }
      let ps = gpu.ps = spawn(MINERS.ccminer.path, [
        '-a', algval,
        '-d', num,
        '-o', `stratum+tcp://${algval}.usa.nicehash.com:${3333 + alg}`,
        '-u', NICEHASH_USERNAME,
        '-p', 'x',
        '-b', 0
      ]);
      ps.stdout.on('data', data => {
        let line = data.toString().trim();
        let match = /GPU #\d+: .+, ([\d.]+) ([kMGTP])H\/s/.exec(line);
        if (match) {
          gpu.info.setContent(`ccminer {bold}${algval}{/bold} | ${match[1]} ${match[2]}H/s`);
        }

        GPUS[num].box.pushLine(blessed.escape(line));
        GPUS[num].box.setScrollPerc(100);
        screen.render();
      });
      ps.stderr.on('data', data => {
        GPUS[num].box.pushLine(`{red-bg}${blessed.escape(data.toString().trim())}{/red-bg}`);
        GPUS[num].box.setScrollPerc(100);
        screen.render();
      });
      gpu.current = algval;

      gpu.info.setContent(`ccminer {bold}${algval}{/bold}`);
    }
  }
}

function fetchAndMine() {
  fetchStats()
    .then(switchMiners)
    .then(printStats)
    .catch(err => logerr(`Failed to get NiceHash statistics. ${err}`));
}
setInterval(fetchAndMine, 3 * 60 * 1000);
fetchAndMine();