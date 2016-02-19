LiveData = function() {
  var DELAY = 7.5;
  var out = {};
  var head, tail;
  var protocol = location.protocol.replace('http','ws');
  var ws = new WebSocket(protocol+location.host);
  ws.binaryType = 'arraybuffer';
  ws.addEventListener('message',  handleSamples);

  function handleSamples(json) {
    var msg = JSON.parse(json.data);
    if (!msg.data) return;
    for (var i=0; i<msg.data.length; i+=26) {
      var sample = msg.data.slice(i,i+26);
      if (!head)
        head = tail = sample;
      else if (tail[0] < sample[0])
        tail = (tail.next = sample);
    }
  }

  out.getSample = function getSample() {
    if (!head) return new Float32Array(25);

    out.currentTime = new Date();
    var time = (out.currentTime.getTime() / 1000) - DELAY;
    while (head.next && head.next[0] < time)
      head = head.next;

    return new Float32Array(head.slice(1));
  }

  return out;
}
