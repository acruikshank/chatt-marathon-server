var pg = require('pg')
var QueryStream = require('pg-query-stream')
var es = require('event-stream');

var SIGNAL_COLUMNS = exports.SIGNAL_COLUMNS = [
  'theta_af3','alpha_af3','low_beta_af3','high_beta_af3','gamma_af3',
  'theta_af4','alpha_af4','low_beta_af4','high_beta_af4','gamma_af4',
  'theta_t7','alpha_t7','low_beta_t7','high_beta_t7','gamma_t7',
  'theta_t8','alpha_t8','low_beta_t8','high_beta_t8','gamma_t8',
  'theta_pz','alpha_pz','low_beta_pz','high_beta_pz','gamma_pz' ]

exports.saveSample = function saveSample(deviceId, time, lat, lon, data) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err) return console.log(err);
    if (data.length < 25) return console.log("ERROR: sample size too small", data.length)

    client.query({
      text:  "INSERT INTO emote_samples("+
        "device_id, time, lat, lon,"+
        SIGNAL_COLUMNS.join(',') +
        ") VALUES ($1,$2,$3,$4," + parameters(SIGNAL_COLUMNS, 5) + ")",
      name: "insert-emote-sample",
      values: [deviceId,time,lat,lon].concat(data)
    }, done);
  });
}

exports.latestSampleStream = function latestSampleStream(range, deviceIds, cb) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err) return cb(err);

    // var since = "timestamp '2016-02-28 18:37:29.44'"
    var since = 'NOW()'
    var sql = "select device_id, time, lat, lon,"
      + SIGNAL_COLUMNS.join(',')
      + " from emote_samples where time + ($1 || ' second')::interval > "+since
      +" and device_id in (" + parameters(deviceIds, 2) + ") order by time";

    var stream = client.query(new QueryStream(sql, [range].concat(deviceIds)))
    stream.on('end', done)
    stream.on('error', function(err) {
      done()
      console.log(err);
      cb(err)
    })
    cb(null, stream.pipe(es.map(function(row, next) {
        next( null, {
          device_id: row.device_id.replace(/\s*$/,''),
          time: row.time,
          lat: row.lat,
          lon: row.lon,
          sample: SIGNAL_COLUMNS.map(function(name) { return row[name]; })
        } );
      })));
  })
}

function parameters(ar, offset) {
  return ar.map(function(c,i) {return '$'+(i+offset)}).join(',')
}
