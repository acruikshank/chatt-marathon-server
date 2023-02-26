/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('emote_samples', {
    rr0: {type:'double precision'},
    rr1: {type:'double precision'},
    rr2: {type:'double precision'},
    rr3: {type:'double precision'}
});
};

exports.down = pgm => {
  pgm.dropColumns('emote_samples', ['rr0', 'rr1', 'rr2', 'rr3']);
};
