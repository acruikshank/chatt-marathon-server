LiveData = function(devices, ready, listener) {
  var DELAY = 7500;
  var SAMPLE_SIZE = 26;
  var out = {};
  var head, current, tail;

  fetchData(parseData);

  function parseData(samplesJSON) {
    var samples = JSON.parse(samplesJSON);
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
      else head = tail = sample;
    }
    current = tail;
    startWebsocket(ready);
  }

  function startWebsocket(cb) {
    var protocol = location.protocol.replace('http','ws');
    var ws = new WebSocket(protocol+location.host);
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('message',  handleSamples);
    ws.addEventListener('open', function() {
      ws.send(JSON.stringify({type:'connect', devices:devices}))
    })


    if (cb) cb();
    // TODO: on close reload, ping timer
  }

  function handleSamples(json) {
    var msg = JSON.parse(json.data);
    if (!msg.data) return;
    for (var i=0; i<msg.data.length; i+=SAMPLE_SIZE) {
      var sample = {
        lat: msg.lat,
        lon: msg.lon,
        time: new Date(msg.data[i]*1000),
        sample: msg.data.slice(i+1,i+SAMPLE_SIZE)
      }
      if (listener)
        listener(sample);
      if (!current)
        current = tail = sample;
      else if (tail.time < sample.time)
        tail = (tail.next = sample);
    }
  }

  function currentSample() {
    if (!current) return null;

    out.currentTime = new Date();
    while (current.next && (out.currentTime.getTime() - DELAY > current.next.time.getTime()))
      current = current.next;

    return current;
  }

  out.getSample = function getSample() {
    var current = currentSample();
    if (!current) return {sample:new Float32Array(25)};
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

  out.historyBuffer = function() {
    // TODO: prune out-of-date samples from buffer here
    return head;
  }

  function fetchData(uploadComplete) {
    var request = new XMLHttpRequest();
    var deviceIds = devices.map(function(d){return 'device_ids='+encodeURIComponent(d)}).join('&');
    request.open("GET", '/api/1.0/samples?'+deviceIds, true);

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
