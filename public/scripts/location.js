Location = function(canvas, sampler1, sampler2) {
  var ctx = canvas.getContext('2d');
  var cw = canvas.width;
  var ch = canvas.height;
  var location1;
  var location2;
  var theta = 0;
  var dTheta = .1;

  var X_SLOPE = 6862.369479;
  var X_INTERCEPT = 585575.4356;
  var Y_SLOPE = -8375.461681;
  var Y_INTERCEPT = 293759.1721;
  var X_SCALE = cw / 412;
  var Y_SCALE = ch / 655;

  setInterval(fetchLocation, 1000);
  render();

  function render() {
    ctx.clearRect(0,0,cw,ch);

    if (location1) {
      var x = (X_SLOPE*location1.lon + X_INTERCEPT) * X_SCALE * .929 + 31;
      var y = (Y_SLOPE*location1.lat + Y_INTERCEPT) * Y_SCALE * .929 + 21;

      ctx.fillStyle = ctx.strokeStyle = 'rgba(22, 105, 128, 1)';
      // ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.arc(x,y,10,0,2*Math.PI,true);
      ctx.fill();
      // ctx.lineWidth = 5+5*Math.pow(Math.cos(theta),2);
      ctx.beginPath();
      ctx.arc(x,y,20,theta,Math.PI +theta,true);
      ctx.lineCap = 'round';
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    if (location2) {
      var x = (X_SLOPE*location2.lon + X_INTERCEPT) * X_SCALE * .929 + 31;
      var y = (Y_SLOPE*location2.lat + Y_INTERCEPT) * Y_SCALE * .929 + 21;

      ctx.fillStyle = ctx.strokeStyle = 'rgba(224, 45, 27, 0.87)';
      ctx.beginPath();
      ctx.arc(x,y,10,0,2*Math.PI,true);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x,y,20,theta-Math.PI,theta,true);
      ctx.lineCap = 'round';
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    theta += dTheta;
    requestAnimationFrame(render);
  }

  function fetchLocation() {
    location1 = sampler1.getLocation();
    location2 = sampler2.getLocation();
  }
}
