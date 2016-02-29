exports.up = function(pgm) {
  pgm.addColumns('emote_samples', {
    lat: {type:'double precision', default:35.0456},
    lon: {type:'double precision', default:-85.2672}
  })
};

exports.down = function(pgm) {
  pgm.dropColumns('emote_samples', ['lat','lon'])
};
