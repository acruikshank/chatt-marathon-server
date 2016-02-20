exports.up = function(pgm) {
  pgm.createTable( 'emote_samples', {
    id: 'id',
    device_id: 'char(32)',
    time: 'timestamp',
    theta_af3: 'double precision',
    alpha_af3: 'double precision',
    low_beta_af3: 'double precision',
    high_beta_af3: 'double precision',
    gamma_af3: 'double precision',
    theta_af4: 'double precision',
    alpha_af4: 'double precision',
    low_beta_af4: 'double precision',
    high_beta_af4: 'double precision',
    gamma_af4: 'double precision',
    theta_t7: 'double precision',
    alpha_t7: 'double precision',
    low_beta_t7: 'double precision',
    high_beta_t7: 'double precision',
    gamma_t7: 'double precision',
    theta_t8: 'double precision',
    alpha_t8: 'double precision',
    low_beta_t8: 'double precision',
    high_beta_t8: 'double precision',
    gamma_t8: 'double precision',
    theta_pz: 'double precision',
    alpha_pz: 'double precision',
    low_beta_pz: 'double precision',
    high_beta_pz: 'double precision',
    gamma_pz: 'double precision'
  } );

  pgm.createIndex( 'emote_samples', ['device_id', 'time'], {name:'by_device_and_time'})
};

exports.down = function(pgm) {
  pgm.dropIndex( 'emote_samples', 'by_device_and_time' );
  
  pgm.dropTable( 'emote_samples' );
};
