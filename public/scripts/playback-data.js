PlaybackData = function(devices, start, end, ready, listener) {
  var DELAY = 7500;
  var SAMPLE_SIZE = 26;
  var out = {};
  var current, tail;
  var connection;
  var offset = new Date().getTime() - start.getTime();

  fetchData(parseData);

  function parseData(samplesJSON) {
    var samples = JSON.parse(samplesJSON);
    var currenTime = start;
    for (var i=0, data; data = samples[i]; i++) {
      var sample = {
        lat: data.lat,
        lon: data.lon,
        time: new Date(data.time),
        sample: data.sample
      }
      if (listener)
        listener(sample);
      if (tail) tail.next = tail = sample;
      else tail = sample;
      if (!current)
        current = sample;
    }

    if (ready) ready();
  }

  function currentSample() {
    if (!current) return null;

    out.currentTime = new Date(new Date().getTime() - offset);
    while (current.next && (out.currentTime.getTime() - DELAY > current.next.time.getTime()))
      current = current.next;

    return current;
  }

  out.getSample = function getSample() {
    var current = currentSample();
    if (!current) return new Float32Array(25);
    return new Float32Array(current.sample);
  }

  out.getLocation = function getSample() {
    var current = currentSample();
    if (!current) return {lat:0, lon:0};
    return {lat:current.lat, lon:current.lon};
  }

  out.setListener = function setListener(l) {
    listener = l;
  }

  function fetchData(uploadComplete) {
    var request = new XMLHttpRequest();
    var range = 'start='+encodeURIComponent(start.toString())+'&end='+encodeURIComponent(end.toString())
    var deviceIds = devices.map(function(d){return 'device_ids='+encodeURIComponent(d)}).join('&');
    request.open("GET", '/api/1.0/history?'+range+'&'+deviceIds, true);

    request.onreadystatechange = function() {
      if (request.readyState > 3) {
        if (request.status != 200)
          console.error(request.responseText);
        else
          uploadComplete(request.response);
      }
    }
    request.send();
  }

  return out;
}
