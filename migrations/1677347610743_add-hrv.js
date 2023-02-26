/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.addColumns('emote_samples', {
    heart_rate: {type:'double precision'},
    hrv: {type:'double precision'}
  });
}

exports.down = function(pgm) {
  pgm.dropColumns('emote_samples', ['heart_rate','hrv'])
}
