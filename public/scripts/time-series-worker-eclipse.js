
var numSamples = 0;
var head, tail;
var handlers = {};
var maxSamples = 100000;
const Theta_AF3 = 0,
  Alpha_AF3 = 1,
  Low_Beta_AF3 = 2,
  High_Beta_AF3 = 3,
  Gamma_AF3 = 4,
  Theta_AF4 = 5,
  Alpha_AF4 = 6,
  Low_Beta_AF4 = 7,
  High_Beta_AF4 = 8,
  Gamma_AF4 = 9,
  Theta_T7 = 10,
  Alpha_T7 = 11,
  Low_Beta_T7 = 12,
  High_Beta_T7 = 13,
  Gamma_T7 = 14,
  Theta_T8 = 15,
  Alpha_T8 = 16,
  Low_Beta_T8 = 17,
  High_Beta_T8 = 18,
  Gamma_T8 = 19,
  Theta_Pz = 20,
  Alpha_Pz = 21,
  Low_Beta_Pz = 22,
  High_Beta_Pz = 23,
  Gamma_Pz = 24;


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

  var lastAvg = 0, lastFocusAvg = 0, lastExciteAvg = 0;

  var activity = new Float32Array(buckets);
  var activityScale = {dmn: 0, dmx: 0.5, rmn: 0, rmx: 1};
  var maxActivity = 0;

  var focus = new Float32Array(buckets);
  var focusScale = {dmn: -1, dmx: 3, rmn: 0, rmx: 1};
  var maxFocus = 0;

  var excitement = new Float32Array(buckets);
  var excitementScale = {dmn: 0, dmx: 6, rmn: 0, rmx: 1};
  var maxExcitement = 0;

  for (var data = head; data; data = data.next) {
    var x = Math.min(rescale(hscale, data.time.getTime()), buckets-1);
    var sample = data.sample;

    // ACTIVITY
    let avg = (sample[Low_Beta_AF3] + sample[High_Beta_AF3] + sample[Low_Beta_AF4] + sample[High_Beta_AF4] 
            + sample[Gamma_AF3] + sample[Gamma_AF4]) / (sample[Alpha_AF3] + sample[Alpha_AF4]);
    if (isNaN(avg)) avg = 0;
    // for (var j=0; j<sample.length; j++) avg += Math.log(sample[j]+1);
    // avg /= sample.length;
    lastAvg = lerp(lastAvg, avg, avgEase);
    activity[x|0] = rescale(activityScale, lastAvg);
    maxActivity = Math.max(maxActivity, activity[x|0])

    // FOCUS
    //  ((Low & High Beta Af3+ Gamma_af3)/ Alpha_af3) – ((Low & High Beta_af4 + Gamma_af4)/ Alpha_af4)
    // var bandAvg = [0,0,0,0,0];
    // for (var j=0; j<sample.length; j++) bandAvg[j%5] += .2*Math.log(sample[j]+1);
    // for (var j=0; j<5; j++) lastBandAvg[j] = lerp(lastBandAvg[j], bandAvg[j], avgEase);
    avg = ((sample[Low_Beta_AF3] + sample[High_Beta_AF3] + sample[Gamma_AF3]) / sample[Alpha_AF3])
            - ((sample[Low_Beta_AF4] + sample[High_Beta_AF4] + sample[Gamma_AF4]) / sample[Alpha_AF4])
    // if (isNaN(avg)) avg = 0;
    
    lastFocusAvg = lerp(lastFocusAvg, avg, avgEase);
    focus[x|0] = rescale(focusScale, lastFocusAvg);
    maxFocus = Math.max(maxFocus, focus[x|0])

    // EXCITEMENT
    // Theta_af3+Theta_T7+Theta_af4+Theta_T8+ Alpha_pz
    avg = sample[Theta_AF3] + sample[Theta_T7] + sample[Theta_AF4] +  sample[Theta_T8] + sample[Alpha_Pz];
    
    lastExciteAvg = lerp(lastExciteAvg, avg, avgEase);
    // var value = 0;
    // for (var j=0; j<5; j++)
    //   value += Math.log(sample[5*j]+1) - Math.log(sample[5*j+4]+1);
    // if (isNaN(value)) {
    //   console.log("VALUE ERROR: value", value, j, sample[5*j], sample[5*j+4], sample);
    //   return
    // }
    // value /= 5;
    // lastMix = lerp(lastMix, value, avgEase);
    // lastVar = lerp(lastVar, Math.pow(value-lastMix,2), avgEase);
    excitement[x|0] = rescale(excitementScale, lastExciteAvg);
    maxExcitement = Math.max(maxExcitement, excitement[x|0])
  }

  // console.log(maxActivity, maxFocus, maxExcitement)
  // console.log(focus)

  postMessage({t:'result', args:[{
    activity: activity,
    maxActivity: maxActivity,
    focus: focus,
    maxFocus: maxFocus,
    excitement: excitement,
    maxExcitement: maxExcitement,
    minTime: minTime,
    maxTime: maxTime,
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
