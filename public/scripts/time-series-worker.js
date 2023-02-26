
var numSamples = 0;
var head, tail;
var handlers = {};
var maxSamples = 100000;

handlers.sample = function sample(s) {
  if (numSamples > maxSamples) return;
  if (!head) head = tail = s;
  else tail = (tail.next = s);
  numSamples++;
}

handlers.compute = function compute(buckets) {
  // TODO: Prune samples that are too old
  var avgEase = 75 / numSamples;

  // prepass
  var minTime = new Date(new Date().getTime()*2), maxTime = new Date(0);
  for (var data = head; data; data = data.next) {
    minTime = Math.min( data.time.getTime(), minTime );
    maxTime = Math.max( data.time.getTime(), maxTime );
  }

  var x, y;
  var hscale = {dmn: minTime, dmx: maxTime, rmn: 0, rmx: buckets-1};

  var lastAvg = 0, lastBandAvg = [0,0,0,0,0], lastMix = 0, lastVar = 0;

  var activity = new Float32Array(buckets);
  var activityScale = {dmn: 0, dmx: 12, rmn: 0, rmx: 1};
  var maxActivity = 0;

  var focus = new Float32Array(buckets);
  var focusScale = {dmn: -1, dmx: 5, rmn: 0, rmx: 1};
  var maxFocus = 0;

  var excitement = new Float32Array(buckets);
  var excitementScale = {dmn: 0, dmx: 6, rmn: 0, rmx: 1};
  var maxExcitement = 0;

  for (var data = head; data; data = data.next) {
    var x = Math.min(rescale(hscale, data.time.getTime()), buckets-1);
    var sample = data.sample;

    // ACTIVITY
    var avg = 0;
    for (var j=0; j<sample.length; j++) avg += Math.log(sample[j]+1);
    avg /= sample.length;
    lastAvg = lerp(lastAvg, avg, avgEase);
    activity[x|0] = rescale(activityScale, lastAvg);
    maxActivity = Math.max(maxActivity, activity[x|0])

    // FOCUS
    var bandAvg = [0,0,0,0,0];
    for (var j=0; j<sample.length; j++) bandAvg[j%5] += .2*Math.log(sample[j]+1);
    for (var j=0; j<5; j++) lastBandAvg[j] = lerp(lastBandAvg[j], bandAvg[j], avgEase);
    focus[x|0] = rescale(focusScale, lastBandAvg[1] - lastBandAvg[2]);
    maxFocus = Math.max(maxFocus, focus[x|0])

    // EXCITEMENT
    var value = 0;
    for (var j=0; j<5; j++)
      value += Math.log(sample[5*j]+1) - Math.log(sample[5*j+4]+1);
    if (isNaN(value)) {
      console.log("VALUE ERROR: value", value, j, sample[5*j], sample[5*j+4], sample);
      return
    }
    value /= 5;
    lastMix = lerp(lastMix, value, avgEase);
    lastVar = lerp(lastVar, Math.pow(value-lastMix,2), avgEase);
    excitement[x|0] = rescale(excitementScale, lastVar);
    maxExcitement = Math.max(maxExcitement, excitement[x|0])
  }

  postMessage({t:'result', args:[{
    activity: activity,
    maxActivity: maxActivity,
    focus: focus,
    maxFocus: maxFocus,
    excitement: excitement,
    maxExcitement: maxExcitement
  }]})
}

onmessage = function(e) {
  var type = e.data.t;
  if (handlers[type])
    handlers[type].apply(null, e.data.args);
}

function lerp(a,b,x) { return a + x*(b-a); }

function rescale(scale, x) {
  return scale.rmn + ((x - scale.dmn) / (scale.dmx - scale.dmn))*(scale.rmx - scale.rmn);
}
