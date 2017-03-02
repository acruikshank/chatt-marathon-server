Location = function(canvas, runners) {
  var ctx = canvas.getContext('2d');
  var cw = canvas.width;
  var ch = canvas.height;
  var theta = 0;
  var dTheta = .1;

  var X_SLOPE = 6862.369479;
  var X_INTERCEPT = 585575.4356;
  var Y_SLOPE = -8375.461681;
  var Y_INTERCEPT = 293759.1721;
  var X_SCALE = cw / 412;
  var Y_SCALE = ch / 655;
  var arcWidth = 2*Math.PI/ runners.length;
  var arcCap = arcWidth - 2*Math.PI*.05;

  var activeIndex = 0;

  setInterval(fetchLocation, 1000);
  render();

  function render() {
    ctx.clearRect(0,0,cw,ch);

    for (var index=0, runner; runner=runners[index]; index++) {
      if (runner.location && index != activeIndex) {
        renderRunner(runner, index, 'rgba(100,100,100,.75)');
      }
    }
    if (runners[activeIndex].location)
      renderRunner(runners[activeIndex], activeIndex, runners[activeIndex].color)

    theta += dTheta;
    requestAnimationFrame(render);
  }

  function renderRunner(runner, index, color) {
    var x = (X_SLOPE*runner.location.lon + X_INTERCEPT) * X_SCALE * .929 + 31;
    var y = (Y_SLOPE*runner.location.lat + Y_INTERCEPT) * Y_SCALE * .929 + 21;

    ctx.fillStyle = ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,10,0,2*Math.PI,true);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x,y,20,theta + index*arcWidth, theta+index*arcWidth+arcCap,false);
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  function fetchLocation() {
    runners.forEach(function(runner) { runner.location = runner.sampler.getLocation() })
  }

  function setActive(index) {
    activeIndex = index;
  }

  return {setActive:setActive}
}
