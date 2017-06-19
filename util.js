const H  = 1;
const PH = Math.pow(10, 15);
const TH = Math.pow(10, 12);
const GH = Math.pow(10, 9);
const MH = Math.pow(10, 6);
const kH = Math.pow(10, 3);

const RATES = {PH, TH, GH, MH, kH, H, Sol: H, hash: H};

module.exports = {
  PH,
  TH,
  GH,
  MH,
  kH,
  H,
  Sol: H,
  hash: H,
  RATES,
  mBTC(i) {
    return i * 1000;
  },
  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
};
