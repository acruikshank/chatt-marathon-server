LiveData = function(ready) {
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
      if (!current)
        current = tail = sample;
      else if (tail.time < sample.time)
        tail = (tail.next = sample);
    }
  }

  out.getSample = function getSample() {
    if (!current) return {sample:new Float32Array(25)};

    out.currentTime = new Date();
    while (current.next && (out.currentTime.getTime() - DELAY > current.next.time.getTime()))
      current = current.next;

    return new Float32Array(current.sample);
  }

  out.historyBuffer = function() {
    // TODO: prune out-of-date samples from buffer here
    return head;
  }

  function fetchData(uploadComplete) {
    var request = new XMLHttpRequest();
    request.open("GET", '/api/1.0/samples?device_ids=596849CA', true);

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
