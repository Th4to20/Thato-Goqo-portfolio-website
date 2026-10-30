/* Home-page sandbox: plays one run live and plots 20 seeded runs (average + range). */
(function () {
  var S = window.SimCore;
  var root = document.getElementById('sandbox');
  if (!S || !root) return;

  var simCv = document.getElementById('sim'), chartCv = document.getElementById('chart');
  var simCtx = simCv.getContext('2d'), chartCtx = chartCv.getContext('2d');
  var runLabel = document.getElementById('run-label'), nowLabel = document.getElementById('now-label');
  var playBtn = document.getElementById('play'), nextBtn = document.getElementById('next');
  var csvBtn = document.getElementById('csv');
  var statEls = {
    avg: document.getElementById('st-avg'), lo: document.getElementById('st-lo'),
    hi: document.getElementById('st-hi'), sd: document.getElementById('st-sd'), small: document.getElementById('st-small')
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEED = 1000, SPS = 36, HOLD = 1600;
  var rate = 'medium', series = [], sum = null, k = 0, live = null, paused = reduced, acc = 0, last = 0, holdUntil = 0;

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return dpr;
  }

  function drawSim() {
    var dpr = fit(simCv), w = simCv.width, h = simCv.height, sx = w / S.W, sy = h / S.H;
    var sky = css('--c-sky'), pink = css('--c-pink'), mint = css('--c-mint'), line = css('--line');
    simCtx.clearRect(0, 0, w, h);
    var i, rr = 3.3 * dpr;
    // rings show the contact radius around infected agents
    simCtx.lineWidth = 1 * dpr; simCtx.strokeStyle = pink; simCtx.globalAlpha = 0.32;
    for (i = 0; i < S.N; i++) if (live.st[i] === 1) {
      simCtx.beginPath(); simCtx.arc(live.x[i] * sx, live.y[i] * sy, S.R * sx, 0, 6.2832); simCtx.stroke();
    }
    simCtx.globalAlpha = 1;
    for (i = 0; i < S.N; i++) {
      var s = live.st[i];
      simCtx.beginPath(); simCtx.arc(live.x[i] * sx, live.y[i] * sy, s === 1 ? rr * 1.15 : rr, 0, 6.2832);
      if (s === 0) { simCtx.globalAlpha = 0.7; simCtx.fillStyle = sky; simCtx.fill(); simCtx.globalAlpha = 1; }
      else if (s === 1) { simCtx.shadowColor = pink; simCtx.shadowBlur = 12 * dpr; simCtx.fillStyle = pink; simCtx.fill(); simCtx.shadowBlur = 0; }
      else { simCtx.globalAlpha = 0.9; simCtx.fillStyle = mint; simCtx.fill(); simCtx.globalAlpha = 1; }
    }
  }

  function drawChart() {
    var dpr = fit(chartCv), w = chartCv.width, h = chartCv.height;
    var padL = 34 * dpr, padR = 8 * dpr, padT = 10 * dpr, padB = 24 * dpr;
    var cw = w - padL - padR, ch = h - padT - padB;
    var ink = css('--ink'), mute = css('--ink-2'), cobalt = css('--c-pink'), line = css('--line');
    chartCtx.clearRect(0, 0, w, h);
    var ymax = 10;
    if (sum) ymax = Math.max.apply(null, sum.hi);
    ymax = Math.max(20, Math.ceil(ymax / 20) * 20);
    var X = function (t) { return padL + (t / S.STEPS) * cw; };
    var Y = function (v) { return padT + ch - (v / ymax) * ch; };
    chartCtx.font = (11 * dpr) + 'px ' + css('--font-ui'); chartCtx.textBaseline = 'middle';
    chartCtx.lineWidth = 1 * dpr; chartCtx.strokeStyle = line; chartCtx.fillStyle = mute; chartCtx.textAlign = 'right';
    [0, 0.5, 1].forEach(function (f) {
      var v = Math.round(ymax * f), y = Y(v);
      chartCtx.beginPath(); chartCtx.moveTo(padL, y); chartCtx.lineTo(w - padR, y); chartCtx.stroke();
      chartCtx.fillText(String(v), padL - 6 * dpr, y);
    });
    chartCtx.textAlign = 'left'; chartCtx.textBaseline = 'top';
    chartCtx.fillText('0', padL, h - padB + 6 * dpr);
    chartCtx.textAlign = 'right'; chartCtx.fillText(S.STEPS + ' steps', w - padR, h - padB + 6 * dpr);
    var t;
    if (sum) {
      chartCtx.beginPath();
      for (t = 0; t <= S.STEPS; t++) chartCtx[t ? 'lineTo' : 'moveTo'](X(t), Y(sum.hi[t]));
      for (t = S.STEPS; t >= 0; t--) chartCtx.lineTo(X(t), Y(sum.lo[t]));
      chartCtx.closePath(); chartCtx.globalAlpha = 0.17; chartCtx.fillStyle = cobalt; chartCtx.fill(); chartCtx.globalAlpha = 1;
      chartCtx.beginPath(); chartCtx.lineWidth = 2 * dpr; chartCtx.strokeStyle = ink;
      for (t = 0; t <= S.STEPS; t++) chartCtx[t ? 'lineTo' : 'moveTo'](X(t), Y(sum.mean[t]));
      chartCtx.stroke();
    }
    chartCtx.beginPath(); chartCtx.lineWidth = 2.5 * dpr; chartCtx.strokeStyle = cobalt;
    for (t = 0; t < live.series.length; t++) chartCtx[t ? 'lineTo' : 'moveTo'](X(t), Y(live.series[t]));
    chartCtx.stroke();
    var lx = X(live.series.length - 1), ly = Y(live.series[live.series.length - 1]);
    chartCtx.beginPath(); chartCtx.fillStyle = cobalt; chartCtx.arc(lx, ly, 4 * dpr, 0, 6.2832); chartCtx.fill();
  }

  function labels() {
    runLabel.textContent = 'Run ' + (k + 1) + ' of ' + S.RUNS;
    nowLabel.textContent = 'Step ' + live.t + ' of ' + S.STEPS + ', ' + live.series[live.series.length - 1] + ' agents spreading';
  }

  function startRun(n) {
    k = (n + S.RUNS) % S.RUNS;
    live = S.makeRun(SEED + k, S.SPREAD[rate]); acc = 0; holdUntil = 0;
    labels(); drawSim(); drawChart();
  }

  function recompute() {
    series = S.batch(S.SPREAD[rate], SEED); sum = S.summarize(series);
    statEls.avg.textContent = Math.round(sum.avgPeak); statEls.lo.textContent = sum.minPeak;
    statEls.hi.textContent = sum.maxPeak; statEls.sd.textContent = sum.sdPeak.toFixed(1);
    statEls.small.textContent = sum.fizzled + ' of ' + S.RUNS;
    startRun(k);
  }

  function frame(now) {
    var dt = Math.min(now - last, 80); last = now;
    if (!paused && live) {
      if (live.t < S.STEPS) {
        acc += (dt / 1000) * SPS;
        while (acc >= 1 && live.t < S.STEPS) { S.step(live); acc -= 1; }
        if (live.t >= S.STEPS) holdUntil = now + HOLD;
        labels(); drawSim(); drawChart();
      } else if (now > holdUntil) { startRun(k + 1); }
    }
    requestAnimationFrame(frame);
  }

  function setPaused(p) {
    paused = p; playBtn.textContent = p ? 'Play' : 'Pause'; playBtn.setAttribute('aria-pressed', String(!p));
  }

  playBtn.addEventListener('click', function () { setPaused(!paused); });
  nextBtn.addEventListener('click', function () { startRun(k + 1); });
  root.querySelectorAll('input[name="rate"]').forEach(function (inp) {
    inp.addEventListener('change', function () { rate = inp.value; recompute(); });
  });
  csvBtn.addEventListener('click', function () {
    var head = ['step'], rows = [], t, j;
    for (j = 0; j < series.length; j++) head.push('run_' + (j + 1));
    head.push('average');
    for (t = 0; t <= S.STEPS; t++) {
      var row = [t]; for (j = 0; j < series.length; j++) row.push(series[j][t]);
      row.push(sum.mean[t].toFixed(2)); rows.push(row.join(','));
    }
    var blob = new Blob([head.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'sandbox-runs-' + rate + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  window.addEventListener('resize', function () { if (live) { drawSim(); drawChart(); } });
  document.addEventListener('themechange', function () { if (live) { drawSim(); drawChart(); } });

  recompute();
  setPaused(paused);
  if (reduced) { while (live.t < S.STEPS * 0.55) S.step(live); labels(); drawSim(); drawChart(); }
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();
