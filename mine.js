const fs = require('fs');
const {promisify} = require('util');
const colors = require('colors');
const difference = require('lodash/difference');
const find = require('lodash/find');
const forOwn = require('lodash/forOwn');
const intersection = require('lodash/intersection');
const isEqual = require('lodash/isEqual');
const mapValues = require('lodash/mapValues');
const merge = require('lodash/merge');

const {RATES, mBTC, average} = require('./util');
const config = require('./config');
const platform = require(`./platforms/${config.platform}`);
const interface = require(`./interfaces/${config.interface}`);
const exchange = require(`./exchanges/${config.exchange}`);
const pool = require(`./pools/${config.pool}`);
const miners = mapValues(config.miners, (v, k) =>
  merge({config: v}, require(`./miners/${k}`)));

const BENCHMARK_FILE = 'benchmark.json';

process.on('exit', () => {
  console.log('Terminating processes...');
  platform.terminateProcesses();
});

const currentMiners = {};
function switchMiners(algs) {
  forOwn(algs, (v, k) => {
    const gpu = find(gpus, {id: k});
    const miner = miners[v[0]];
    const alg = v[1];

    if (!currentMiners.hasOwnProperty(k) || !isEqual(currentMiners[k][0], [v[0], v[1]])) {
      let promise = Promise.resolve();
      /*if (currentMiners.hasOwnProperty(k) && currentMiners[k][0][0] === v[0] && miner.switchAlgorithm) {
        promise
      } else*/ if (currentMiners.hasOwnProperty(k)) {
        promise = new Promise(res => {
          const ps = currentMiners[k][1];
          ps.on('close', () => res());
          miners[currentMiners[k][0][0]].killProcess(ps, k);
        });
      }
      promise.then(() => {
        interface.updateMinerInfo(gpu.id, v[0], alg);

        const intervals = [];
        const ps = spawnMiner(miner, alg, gpu.id, false);
        let rates = [], rateModifier;
        const log = data => {
          const str = data.toString().trim();
          if (str.includes('api | Listening')) {
            // FIXME put in a better location
            miner.switchAlgorithm(alg, gpu.id, pool.buildStratumUri(alg), config.username);
            intervals.push(setInterval(() => miner.printHashrate(gpu.id), 2000));
          }
          const hashrate = miner.extractHashrate(str);
          if (hashrate) {
            rates.push(hashrate[0] * RATES[hashrate[1]]);
            rateModifier = hashrate[1];
            interface.updateMinerInfo(gpu.id, v[0], alg, average(rates) / RATES[rateModifier], rateModifier);
          }
          if (!str.startsWith('fixme:')) // FIXME filter out wine debug lines
            interface.minerLog(gpu.id, str);
        };
        ps.stdout.on('data', log);
        ps.stderr.on('data', log);

        intervals.push(setInterval(() => {
          if (rates.length) {
            const averageRate = average(rates);
            const profit = averageRate * v[2];
            interface.log(`GPU ${gpu.id}: ${v[0]} ${colors.bold(alg)} average rate: ${(averageRate / RATES[rateModifier]).toFixed(2)} ${rateModifier}/s | ${mBTC(profit).toFixed(2)} mBTC/day ($${(profit * btcUsdPrice).toFixed(2)})`);
          }
        }, 30 * 1000));
        ps.on('close', () => {
          intervals.forEach(i => clearInterval(i));
          interface.clearMinerLog(gpu.id);
        });

        currentMiners[k] = [[v[0], v[1]], ps];
      }, err => interface.logError(`Failed to start miner ${err}`));
    }
  });
}

let interval;
function fetchStats() {
  if (!interval) {
    interval = setInterval(fetchStats, 3 * 60 * 1000);
  }

  return exchange.getBtcUsdPrice()
    .then(price => btcUsdPrice = price)
    .then(() => pool.fetchStats())
    .then(stats => interface.updateStats(btcUsdPrice, stats[0], stats[1]))
    .then(() => pool.fetchPrices())
    .then(prices => {
      const algs = {};
      gpus.forEach(gpu => {
        let algorithm;
        Object.keys(miners).forEach(miner =>
          forOwn(benchmarks[miner][gpu.id], (v, k) => {
            if (prices.hasOwnProperty(k) && miners[miner].supportedAlgorithms.includes(k)) {
              let profitability = prices[k] * v;
              // interface.log(`GPU ${gpu.id} ${miner}: ${k} profit ${mBTC(profitability).toFixed(2)} mBTC/day ($${(profitability * btcUsdPrice).toFixed(2)})`);
              if (!algorithm || profitability > algorithm[1]) {
                algorithm = [k, profitability, miner];
              }
            }
          }));
        interface.log(`GPU ${gpu.id}: Choosing ${algorithm[2]} ${colors.bold(algorithm[0])} | est. ${mBTC(algorithm[1]).toFixed(2)} mBTC/day ($${(algorithm[1] * btcUsdPrice).toFixed(2)})`);
        algs[gpu.id] = [algorithm[2], algorithm[0], prices[algorithm[0]]];
      });
      return algs;
    })
    .then(switchMiners);
}

function spawnMiner(miner, alg, gpuId, benchmark) {
  if (benchmark && miner.benchmarkCmdLine) {
    return platform.spawn(miner.config.path, miner.benchmarkCmdLine(alg, gpuId));
  } else if (!benchmark && miner.mineCmdLine) {
    return platform.spawn(miner.config.path, miner.mineCmdLine(alg, gpuId, pool.buildStratumUri(alg), config.username));
  } else {
    return platform.spawn(miner.config.path, miner.cmdLine(alg, gpuId));
  }
}

let gpus, benchmarks, btcUsdPrice;
platform.queryGpus()
  .then(val => gpus = config.enabledGpus ? val.filter(v => config.enabledGpus.includes(v.id)) : val)
  .then(gpus => interface.initialize(gpus, () => process.exit(0)))
  .then(() => promisify(fs.readFile)(BENCHMARK_FILE, {encoding: 'utf8'})
    .then(str => JSON.parse(str), () => ({})))
  .then(val => {
    benchmarks = val;

    let promise = Promise.resolve();
    forOwn(miners, (miner, name) => {
      const minerBenchmark = benchmarks[name] = benchmarks[name] || {};
      gpus.forEach(gpu => {
        const gpuBenchmark = minerBenchmark[gpu.id] = minerBenchmark[gpu.id] || {};
        const algorithms = difference(intersection(miner.supportedAlgorithms,
          pool.supportedAlgorithms), Object.keys(gpuBenchmark));
        if (algorithms.length) {
          interface.log(`GPU ${gpu.id}: ${gpu.name} | Benchmarking ${name} algorithms [${algorithms.join(', ')}]`);

          algorithms.forEach(alg => {
            promise = promise.then(() => new Promise(res => {
              interface.log(`GPU ${gpu.id}: ${gpu.name} | Benchmarking ${name} - ${alg} (${config.benchmarkSeconds}s)`);
              interface.updateMinerInfo(gpu.id, name, alg);

              const timeouts = [];
              const intervals = [];
              const ps = spawnMiner(miner, alg, gpu.id, true);
              let rates = [], rateModifier;
              const log = data => {
                const str = data.toString().trim();
                if (str.includes('api | Listening')) {
                  // FIXME put in a better location
                  miner.switchAlgorithm(alg, gpu.id, 'benchmark', '');
                  intervals.push(setInterval(() => miner.printHashrate(gpu.id), 2000));
                }
                const hashrate = miner.extractHashrate(str);
                if (hashrate) {
                  rates.push(hashrate[0] * RATES[hashrate[1]]);
                  rateModifier = hashrate[1];
                  interface.updateMinerInfo(gpu.id, name, alg, average(rates) / RATES[rateModifier], rateModifier);
                }
                if (!str.startsWith('fixme:')) // FIXME filter out wine debug lines
                  interface.minerLog(gpu.id, str);
              };
              ps.stdout.on('data', log);
              ps.stderr.on('data', log);

              ps.on('close', () => {
                timeouts.forEach(t => clearTimeout(t));
                intervals.forEach(i => clearInterval(i));
                interface.clearMinerLog(gpu.id);
                if (rates.length) {
                  const averageRate = average(rates);
                  gpuBenchmark[alg] = averageRate;
                  interface.log(`\tHashrate: ${(averageRate / RATES[rateModifier]).toFixed(2)} ${rateModifier}/s`);
                  res(promisify(fs.writeFile)(BENCHMARK_FILE, JSON.stringify(benchmarks, null, 2)));
                } else {
                  interface.log('\tNo hashrate found. Unsupported? Benchmark time too low?');
                  res();
                }
              });
              if (miner.timedBenchmark) {
                timeouts.push(setTimeout(() => {
                  interface.log('\tStopping miner...');
                  miner.killProcess(ps, gpu.id);
                }, config.benchmarkSeconds * 1000));
              }
            }));
          });
        }
      });
    });
    return promise;
  })
  .then(() => fetchStats())
  .catch(err => interface.logError(err));
