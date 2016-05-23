TimeSeries = function(canvas, sampler, avgEase) {
  var cw = canvas.width;
  var ch = canvas.height;
  var ctx = canvas.getContext('2d');
  avgEase = avgEase || .5;

  // WORKER
  var worker = new Worker('scripts/time-series-worker.js');

  sampler.setListener(function(sample) {
    worker.postMessage({t:'sample', args:[sample]})
  })

  worker.onmessage = function(e) {
    if (e.data.t == 'result')
      redraw.apply(null, e.data.args);
  }

  setInterval(function() {
    worker.postMessage({t:'compute', args:[cw]});
  }, 3000);

  // RENDERING

  function redraw(computed) {
    ctx.clearRect(0,0,cw,ch);

    var maxValue = Math.max(computed.maxActivity, computed.maxFocus);
    maxValue = Math.max(maxValue, computed.maxExcitement)
    if (maxValue < .000001) return;

    var scale = .98 * ch / maxValue;

    // activity
    var gradient1 = ctx.createLinearGradient(0,0,0,ch);
    gradient1.addColorStop(1 - (computed.maxActivity / maxValue),'rgba(0,0,0, 0.5)');
    gradient1.addColorStop(1,'rgba(0,0,0, 0.0)');

    graphData(ctx, computed.activity, scale, {
      fillStyle: gradient1,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1.0)'
    })

    // focus
    var focusGradient = ctx.createLinearGradient(0,0,0,ch);
    focusGradient.addColorStop(1 - (computed.maxFocus / maxValue),'rgba(61, 131, 161, 1)');
    focusGradient.addColorStop(1 - .5 * (computed.maxFocus / maxValue),'rgba(61, 161, 134, 0.5)');
    focusGradient.addColorStop(1,'rgba(61, 161, 110, 0)');

    graphData(ctx, computed.focus, scale, {
      fillStyle: focusGradient,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1)'
    })

    // excitement
    var excitementGradient = ctx.createLinearGradient(0,0,0,ch);
    excitementGradient.addColorStop(1-(computed.maxExcitement / maxValue),'rgba(167, 39, 62, 1)');
    excitementGradient.addColorStop(1 - .3 * (computed.maxExcitement / maxValue),'rgba(213, 57, 7, 0.6)');
    excitementGradient.addColorStop(1,'rgba(203, 184, 91, .2)');

    graphData(ctx, computed.excitement, scale, {
      fillStyle: excitementGradient,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1)'
    })
  }

  function graphData(ctx, values, scale, opts) {
    ctx.beginPath();
    ctx.moveTo(-20, scale*values[0]);
    for (var i=0; i<cw; i++)
      if (values[i])
        ctx.lineTo(i, ch - scale*values[i]);
    ctx.lineTo(cw+20, ch - scale*values[values.length-1])
    ctx.lineTo(cw+20, ch + 20);
    ctx.lineTo(-20, ch + 20);
    ctx.closePath();

    ctx.fillStyle = opts.fillStyle;
    ctx.fill();

    ctx.lineJoin = 'round';
    ctx.lineWidth = opts.lineWidth || 2;
    ctx.strokeStyle = opts.strokeStyle;
    ctx.stroke();
  }

  function lerp(a,b,x) { return a + x*(b-a); }

  function rescale(scale, x) {
    return scale.rmn + ((x - scale.dmn) / (scale.dmx - scale.dmn))*(scale.rmx - scale.rmn);
  }
}
