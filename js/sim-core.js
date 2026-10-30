/* Agent-based sandbox model: agents wander, a condition spreads on contact, then agents recover.
   Deterministic per seed so a "run" can be replayed exactly. */
(function (root) {
  var W = 1.5, H = 1, R = 0.045, SPEED = 0.0065, RECOVER = 60;
  var N = 210, STEPS = 300, RUNS = 20, START = 4;
  var SPREAD = { slow: 0.03, medium: 0.07, fast: 0.15 };

  function rng(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var CX = Math.ceil(W / R), CY = Math.ceil(H / R);

  function makeRun(seed, beta) {
    var rnd = rng(seed), run = {
      rnd: rnd, beta: beta, t: 0,
      x: new Float32Array(N), y: new Float32Array(N), a: new Float32Array(N),
      st: new Uint8Array(N), age: new Uint16Array(N),
      head: new Int16Array(CX * CY), next: new Int16Array(N),
      fresh: [], series: []
    };
    for (var i = 0; i < N; i++) {
      run.x[i] = rnd() * W; run.y[i] = rnd() * H; run.a[i] = rnd() * Math.PI * 2;
    }
    for (var k = 0; k < START; k++) run.st[Math.floor(rnd() * N)] = 1;
    run.series.push(count(run));
    return run;
  }

  function count(run) {
    var c = 0;
    for (var i = 0; i < N; i++) if (run.st[i] === 1) c++;
    return c;
  }

  function step(run) {
    var x = run.x, y = run.y, a = run.a, st = run.st, age = run.age, rnd = run.rnd;
    var head = run.head, next = run.next, fresh = run.fresh, i, j;
    head.fill(-1);
    for (i = 0; i < N; i++) {
      a[i] += (rnd() - 0.5) * 0.9;
      x[i] += Math.cos(a[i]) * SPEED; y[i] += Math.sin(a[i]) * SPEED;
      if (x[i] < 0) { x[i] = -x[i]; a[i] = Math.PI - a[i]; }
      if (x[i] > W) { x[i] = 2 * W - x[i]; a[i] = Math.PI - a[i]; }
      if (y[i] < 0) { y[i] = -y[i]; a[i] = -a[i]; }
      if (y[i] > H) { y[i] = 2 * H - y[i]; a[i] = -a[i]; }
      var c = Math.min(CX - 1, (x[i] / R) | 0) + Math.min(CY - 1, (y[i] / R) | 0) * CX;
      next[i] = head[c]; head[c] = i;
    }
    fresh.length = 0;
    var r2 = R * R;
    for (i = 0; i < N; i++) {
      if (st[i] !== 1) continue;
      var cx = Math.min(CX - 1, (x[i] / R) | 0), cy = Math.min(CY - 1, (y[i] / R) | 0);
      for (var gy = Math.max(0, cy - 1); gy <= Math.min(CY - 1, cy + 1); gy++) {
        for (var gx = Math.max(0, cx - 1); gx <= Math.min(CX - 1, cx + 1); gx++) {
          for (j = head[gx + gy * CX]; j !== -1; j = next[j]) {
            if (st[j] !== 0) continue;
            var dx = x[j] - x[i], dy = y[j] - y[i];
            if (dx * dx + dy * dy < r2 && rnd() < run.beta) fresh.push(j);
          }
        }
      }
    }
    for (i = 0; i < N; i++) {
      if (st[i] === 1 && ++age[i] > RECOVER + (i % 20)) st[i] = 2;
    }
    for (i = 0; i < fresh.length; i++) if (st[fresh[i]] === 0) { st[fresh[i]] = 1; age[fresh[i]] = 0; }
    run.t++;
    run.series.push(count(run));
  }

  function batch(beta, seedBase) {
    var out = [];
    for (var k = 0; k < RUNS; k++) {
      var r = makeRun(seedBase + k, beta);
      while (r.t < STEPS) step(r);
      out.push(r.series);
    }
    return out;
  }

  function summarize(series) {
    var mean = [], lo = [], hi = [], peaks = [], t, k;
    for (t = 0; t <= STEPS; t++) {
      var s = 0, mn = 1e9, mx = -1;
      for (k = 0; k < series.length; k++) { var v = series[k][t]; s += v; if (v < mn) mn = v; if (v > mx) mx = v; }
      mean.push(s / series.length); lo.push(mn); hi.push(mx);
    }
    for (k = 0; k < series.length; k++) peaks.push(Math.max.apply(null, series[k]));
    var avg = peaks.reduce(function (p, c) { return p + c; }, 0) / peaks.length;
    var sd = Math.sqrt(peaks.reduce(function (p, c) { return p + (c - avg) * (c - avg); }, 0) / peaks.length);
    return {
      mean: mean, lo: lo, hi: hi, peaks: peaks, avgPeak: avg, minPeak: Math.min.apply(null, peaks),
      maxPeak: Math.max.apply(null, peaks), sdPeak: sd,
      fizzled: peaks.filter(function (p) { return p < 30; }).length
    };
  }

  root.SimCore = { W: W, H: H, R: R, N: N, STEPS: STEPS, RUNS: RUNS, SPREAD: SPREAD, makeRun: makeRun, step: step, batch: batch, summarize: summarize };
  if (typeof module !== 'undefined') module.exports = root.SimCore;
})(typeof window !== 'undefined' ? window : globalThis);
