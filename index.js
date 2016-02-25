require('dotenv').config();
var server = require('http').createServer();
var express = require('express');
var fs = require('fs');
var concat = require('concat-stream');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ server: server });
var db = require('./db');
var port = process.env.PORT || 5000;

var SAMPLE_SIZE = 26;

var app = express();

var connections = [];

app.use(function(req, res, next){
  req.pipe(concat(function(data){
    req.body = data;
    next();
  }));
});
app.use(express.static('public'));

app.get('/recorded', function(req, res) {
  var path = './public/recordings/';
  fs.readdir(path, function (err, files) {
    if(err) throw err;
    res.send('<html><head><title>recordings</title><link rel="stylesheet" type="text/css" href="/css/recordings.css"></head>'
      +'<body><h1>Recordings</h1><ul><li>'
      + files.filter(function(f){return f.match(/\.csv$/)})
             .map(function(file) { return '<a href="/recordings/'+file+'">'+file+'</a>'; }).join('</li><li>')
      + '</li></ul></body></html>');
  });
})

function recordDeviceData(device, session, data) {
  for (var i=0; i<data.length; i+=26)
    db.saveSample(device, new Date(1000*data[i]), Array.prototype.slice.call(data, i+1, i+26));
}

app.post('/api/1.0/samples/:device/:session', function(req, res) {
  var body = req.body.toString('binary');

  var buf = new ArrayBuffer(body.length);
  var byteView = new Int8Array(buf);
  for (var i=0; i<body.length; i++)
    byteView[i] = body.charCodeAt(i);

  var samples = new Float64Array(buf);
  var start = new Date(1000*samples[0]);
  console.log('time:',start, 'user:',req.params.device, 'session:', req.params.session, 'length:',body.length / 8,
    'location:', req.headers['geo-position']);
  recordDeviceData(req.params.device, req.params.session, samples);

  var message = JSON.stringify({device:req.params.device, data:Array.prototype.slice.call(samples)});
  connections.forEach(function(connection) { connection.send(message); });

  res.sendStatus(200);
})

wss.on('connection', function connection(ws) {

  connections.push(ws);

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.on('close', function() {
    var index = connections.indexOf(ws);
    console.log('Close index', index, !~index)
    if (~index) connections.splice(index,1);
  })

  ws.send(JSON.stringify(200));
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
