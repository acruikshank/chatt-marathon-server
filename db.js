var { Client } = require('pg')
var QueryStream = require('pg-query-stream')
var es = require('event-stream');
var dateformat = require('dateformat');

var SIGNAL_COLUMNS = exports.SIGNAL_COLUMNS = [
  'theta_af3','alpha_af3','low_beta_af3','high_beta_af3','gamma_af3',
  'theta_af4','alpha_af4','low_beta_af4','high_beta_af4','gamma_af4',
  'theta_t7','alpha_t7','low_beta_t7','high_beta_t7','gamma_t7',
  'theta_t8','alpha_t8','low_beta_t8','high_beta_t8','gamma_t8',
  'theta_pz','alpha_pz','low_beta_pz','high_beta_pz','gamma_pz',
  'heart_rate', 'hrv', 'rr0', 'rr1', 'rr2', 'rr3' ];

const connect = async () => {
  const client = new Client({connectionString: process.env.DATABASE_URL});
  try {
    await client.connect();
  } catch (err) {
    console.erro(err);
    throw err;
  }
  return client;
}

exports.saveSample = async (deviceId, time, lat, lon, data) => {
  if (data.length < SIGNAL_COLUMNS.length) 
    return console.log("ERROR: sample size too small", data.length);
  console.log("HEART RATE INFO", data.slice(25).map(f=>f.toFixed(3)));

  const client = await connect();
  try {
    await client.query({
      text:  "INSERT INTO emote_samples("+
        "device_id, time, lat, lon,"+
        SIGNAL_COLUMNS.join(',') +
        ") VALUES ($1,$2,$3,$4," + parameters(SIGNAL_COLUMNS, 5) + ")",
      name: "insert-emote-sample",
      values: [deviceId,time,lat,lon].concat(data)
    });
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
}

exports.latestSampleStream = function latestSampleStream(range, deviceIds, cb) {
  var since = "timestamp '2023-02-25 14:45:00.00'"
  // var since = 'NOW()'
  var sql = "select device_id, time, lat, lon,"
    + SIGNAL_COLUMNS.join(',')
    + " from emote_samples where time + ($1 || ' second')::interval > "+since
    +" and device_id in (" + parameters(deviceIds, 2) + ") order by time";
    console.log(sql)
  sampleStream(new QueryStream(sql, [range].concat(deviceIds)), cb);
}


exports.historySampleStream = function latestSampleStream(deviceIds, start, end, cb) {
  var since = "timestamptz '"+dateformat(new Date(start),'yyyy-mm-dd HH:MM:ss Z')+"'"
  var until = end
    ? "timestamptz '"+dateformat(new Date(end),'yyyy-mm-dd HH:MM:ss Z')+"'"
    : 'NOW()'

  var sql = "select device_id, time, lat, lon,"
    + SIGNAL_COLUMNS.join(',')
    + " from emote_samples where time >= " + since
    + " and time < " + until
    +" and device_id in (" + parameters(deviceIds, 1) + ") order by time";

  console.log(sql);

  sampleStream(new QueryStream(sql, deviceIds), cb);
}

async function sampleStream(queryStream, cb) {
  let client;
  try {
    client = await connect();
  } catch (err) {
    return cb(err);
  }

  var stream = client.query(queryStream)
  stream.on('end', () => { client.end(); })
  stream.on('error', function(err) {
    client.end();
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
}

function parameters(ar, offset) {
  return ar.map(function(c,i) {return '$'+(i+offset)}).join(',')
}
