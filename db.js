var pg = require('pg');

exports.saveSample = function saveSample(deviceId, time, data) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err) return console.log(err);
    if (data.length < 25) return console.log("ERROR: sample size too small", data.length)

    client.query({
      text:  "INSERT INTO emote_samples("+
        "device_id, time,"+
        "theta_af3,alpha_af3,low_beta_af3,high_beta_af3,gamma_af3,"+
        "theta_af4,alpha_af4,low_beta_af4,high_beta_af4,gamma_af4,"+
        "theta_t7,alpha_t7,low_beta_t7,high_beta_t7,gamma_t7,"+
        "theta_t8,alpha_t8,low_beta_t8,high_beta_t8,gamma_t8,"+
        "theta_pz,alpha_pz,low_beta_pz,high_beta_pz,gamma_pz"+
        ") VALUES ("+
        "$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)",
      name: "insert-emote-sample",
      values: [deviceId,time].concat(data)
    }, done);
  });
}
