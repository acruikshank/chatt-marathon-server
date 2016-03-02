/* TODO
- [ ] keep max sample pointer in sampler
- [ ] iterate on a slowish timer (every 2 seconds)
- [ ] run through all samples starting from the pointer to generate signals
- [ ] graph signals in provided canvas
- [ ] graph all data in the background?
 */
TimeSeries = function(canvas, sampler, avgEase) {
  var cw = canvas.width;
  var ch = canvas.height;
  var ctx = canvas.getContext('2d');
  avgEase = avgEase || .01;

  // setInterval(redraw, 5000);
  redraw();

  function redraw() {
    ctx.clearRect(0,0,cw,ch);

    // prepass
    var minTime = new Date(new Date().getTime()*2), maxTime = new Date(0);
    var maxSamples = 30000, sampleCount=0;
    for (var data = sampler.historyBuffer(); data; data = data.next) {
      minTime = Math.min( data.time, minTime );
      maxTime = Math.max( data.time, maxTime );
    }

    // activity
    var gradient1 = ctx.createLinearGradient(0,0,0,ch);
    gradient1.addColorStop(0,'rgba(0,0,0, 0.5)');
    gradient1.addColorStop(1,'rgba(0,0,0, 0.0)');

    graphData(ctx, sampler.historyBuffer(), function(data, opts) {
      var sample = data.sample;
      var avg = 0;
      for (var j=0; j<sample.length; j++) avg += Math.log(sample[j]+1);
      avg /= sample.length;

      opts.lastAvg = lerp(opts.lastAvg, avg, avgEase);
      return opts.lastAvg;
    }, {
      lastAvg: 0,
      hscale: {dmn: minTime, dmx: maxTime, rmn: 0, rmx: cw},
      vscale: {dmn: 0, dmx: 12, rmn: ch, rmx: 0},
      fillStyle: gradient1,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1.0)'

    })

    // focus
    var focusGradient = ctx.createLinearGradient(0,0,0,ch);
    focusGradient.addColorStop(0,'rgba(61, 131, 161, 1)');
    focusGradient.addColorStop(.5,'rgba(61, 131, 161, 1)');
    focusGradient.addColorStop(1,'rgba(61, 161, 110, 0)');

    graphData(ctx, sampler.historyBuffer(), function(data, opts) {
      var sample = data.sample;
      var bandAvg = [0,0,0,0,0];
      for (var j=0; j<sample.length; j++) bandAvg[j%5] += .2*Math.log(sample[j]+1);

      for (var j=0; j<5; j++) opts.lastBandAvg[j] = lerp(opts.lastBandAvg[j], bandAvg[j], avgEase);
      return opts.lastBandAvg[1] - opts.lastBandAvg[2];
    }, {
      lastBandAvg: [0,0,0,0,0],
      hscale: {dmn: minTime, dmx: maxTime, rmn: 0, rmx: cw},
      vscale: {dmn: -1, dmx: 5, rmn: ch, rmx: 0},
      fillStyle: focusGradient,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1)'
    })

    // Anxiety
    var anxietyGradient = ctx.createLinearGradient(0,0,0,ch);
    anxietyGradient.addColorStop(0,'rgba(167, 39, 62, 0.93)');
    anxietyGradient.addColorStop(.3,'rgba(213, 57, 7, 0.93)');
    anxietyGradient.addColorStop(1,'rgba(203, 184, 91, .2)');

    graphData(ctx, sampler.historyBuffer(), function(data, opts) {
      var sample = data.sample;
      var value = 0;
      for (var j=0; j<5; j++)
        value += Math.log(sample[5*j]+1) - Math.log(sample[5*j+4]+1);
      value /= 5;
      opts.lastMix = lerp(opts.lastMix, value, avgEase);
      opts.lastVar = lerp(opts.lastVar, Math.pow(value-opts.lastMix,2), avgEase);
      return opts.lastVar;
    }, {
      lastMix: 0,
      lastVar: 0,
      hscale: {dmn: minTime, dmx: maxTime, rmn: 0, rmx: cw},
      vscale: {dmn: 0, dmx: 6, rmn: ch, rmx: 0},
      fillStyle: anxietyGradient,
      lineWidth: 2,
      strokeStyle: 'rgba(60, 60, 60, 1)'
    })
  }

  function graphData(ctx, buffer, f, opts) {
    ctx.beginPath();
    ctx.moveTo(opts.hscale.rmn, opts.vscale.rmn);
    opts.sampleCount = 0;
    var x, y;
    for (var data = buffer; data; data = data.next) {
      x = rescale(opts.hscale, data.time.getTime());
      y = rescale(opts.vscale, f(data,opts));

      ctx.lineTo( x, y);
      opts.sampleCount++;
    }
    ctx.lineTo(x+20, y)
    ctx.lineTo(x+20, opts.vscale.rmn + 20)
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
