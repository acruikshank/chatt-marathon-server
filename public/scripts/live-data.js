LiveData = function(devices, ready, listener) {
  var DELAY = 7500;
  var SAMPLE_SIZE = 28;
  var out = {};
  var current, tail;
  var connection;

  fetchData(parseData);

  function parseData(samplesJSON) {
    var samples = JSON.parse(samplesJSON);
    var currenTime = new Date();
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
      if (tail.time < new Date())
        current = tail;
    }

    connection = Connection(handleSamples);

    if (ready) ready();
  }

  function handleSamples(json) {
    var msg = JSON.parse(json);
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

  function Connection(handlerSamples) {
    var PING_DELAY = 10000;
    var DISCONNECT_DELAY = 30000;
    var state = 'disconnected';
    var lastStateChange = new Date();
    var ws;

    function connect() {
      var protocol = location.protocol.replace('http','ws');
      ws = new WebSocket(protocol+location.host+'/ws');
      ws.binaryType = 'arraybuffer';
      ws.addEventListener('message',  onMessage);
      ws.addEventListener('open', function() {
        ws.send(JSON.stringify({type:'connect', devices:devices}))
        setState('connected');
      })
      ws.addEventListener('close', function() {
        setState('disconnected');
      })
    }

    function setState(s) {
      state = s
      lastStateChange = new Date()
    }

    function onMessage(e) {
      if (e.data !== 'pong')
        handleSamples(e.data)
      setState('connected')
    }

    function checkState() {
      var timeSinceStateChange = new Date().getTime() - lastStateChange.getTime();
      switch (state) {
        case 'connected':
          if (timeSinceStateChange > PING_DELAY)
            ping();
          break;
        case 'pinging':
        case 'disconnected':
          if (timeSinceStateChange > DISCONNECT_DELAY)
            reconnect();
          break;
      }
    }

    function ping() {
      setState('pinging');
      ws.send(JSON.stringify({type:'ping'}));
    }

    function reconnect() {
      setState('disconnected');
      if (ws) ws.close();
      connect();
    }

    setInterval(checkState, 1000);

    connect();
  }

  return out;
}
