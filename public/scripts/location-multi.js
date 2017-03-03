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
  var arcWidth = 2*Math.PI * .8;/// runners.length;
  var arcCap = arcWidth - 2*Math.PI*.05;

  var activeIndex = 0;
  var transition = 0;

  setInterval(fetchLocation, 1000);
  render();
  // var offsets = [1,1,1,1,1,1,1,1,1,1,1,1].map(function() {return {x:-200*Math.random(), y:200*Math.random()}})

  function render() {
    ctx.clearRect(0,0,cw,ch);

    for (var index=0, runner; runner=runners[index]; index++) {
      if (runner.location && index != activeIndex) {
        renderRunner(runner, index, false);
      }
    }
    if (runners[activeIndex].location)
      renderRunner(runners[activeIndex], activeIndex, runners[activeIndex].color, true)

    theta += dTheta;
    requestAnimationFrame(render);
  }

  function renderRunner(runner, index, active) {
    var x = (X_SLOPE*runner.location.lon + X_INTERCEPT) * X_SCALE * .929 + 31;
    var y = (Y_SLOPE*runner.location.lat + Y_INTERCEPT) * Y_SCALE * .929 + 21;
    // x += offsets[index].x;
    // y += offsets[index].y;

    ctx.fillStyle = 'rgba(3, 110, 156, 1)'; //active ? 'rgba(3, 110, 156, 1)' : 'rgba(100,100,100,.75)';
    ctx.strokeStyle = 'rgba(3, 110, 156, 1)'; //active ? 'rgba(3, 110, 156, 1)' : 'rgba(100,100,100, 0.75)';
    if(active) {
      ctx.beginPath();
      ctx.arc(x,y,active?10 + transition:8,0,2*Math.PI,true);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x,y, active?(25 + transition):6,theta + index*arcWidth, theta+index*arcWidth+arcCap,false);
    ctx.lineCap = 'round';
    ctx.lineWidth = active ? 10 : 4;
    ctx.stroke();

    transition = Math.pow(transition,.9975);
  }

  function fetchLocation() {
    runners.forEach(function(runner) { runner.location = runner.sampler.getLocation() })
  }

  function setActive(index) {
    activeIndex = index;
    transition = 250;
  }

  return {setActive:setActive}
}
