// Prints the numbers the chapters quote about the exam dataset, so prose can be checked against them.
// Run with `node scripts/exam-stats.mjs`.
const pts = [[1, 48], [1.5, 53], [2, 50], [3, 60], [3.5, 57], [4, 66], [5, 68], [5.5, 75], [6, 71], [7, 82], [8, 83], [9, 91]];
const n = pts.length;
const xb = pts.reduce((s, p) => s + p[0], 0) / n;
const yb = pts.reduce((s, p) => s + p[1], 0) / n;
let sxy = 0;
let sxx = 0;
for (const [x, y] of pts) {
  sxy += (x - xb) * (y - yb);
  sxx += (x - xb) ** 2;
}
const w = sxy / sxx;
const b = yb - w * xb;
const loss = (ww, bb) => pts.reduce((s, [x, y]) => s + (ww * x + bb - y) ** 2, 0) / n;
const mse = loss(w, b);
const tot = pts.reduce((s, [, y]) => s + (y - yb) ** 2, 0) / n;
const mae = pts.reduce((s, [x, y]) => s + Math.abs(w * x + b - y), 0) / n;
console.log({ n, xBar: xb, yBar: yb, sxy, sxx, w, b, mse, rmse: Math.sqrt(mse), mae, r2: 1 - mse / tot });
console.log('flat line at mean, MSE:', tot);
console.log('guess w=4,b=50 MSE:', loss(4, 50), ' guess w=6,b=40:', loss(6, 40), ' w=0,b=0:', loss(0, 0));
console.log('prediction at 4.5 hours:', w * 4.5 + b, ' at 10:', w * 10 + b, ' at 0:', b);
const sx2 = pts.reduce((s, [x]) => s + x * x, 0);
const sx = pts.reduce((s, [x]) => s + x, 0);
const a = (2 * sx2) / n, c = (2 * sx) / n, d = 2;
console.log('max stable learning rate:', 2 / ((a + d) / 2 + Math.sqrt(((a - d) / 2) ** 2 + c * c)));
