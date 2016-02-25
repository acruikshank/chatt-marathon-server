Grid = function grid(canvas, sampler, xOffset, yOffset) {
  var gl;
  var gridShader;
  var coordAttribute;
  var gridBuffer;
  var dTheta = 1;
  var theta = 0;
  var ease = .05;
  var lastSample = new Float32Array(25);

  start()

  function start() {
    gl = canvas.getContext("experimental-webgl");

    if (gl) {
      gl.clearColor(0, 0, 0, 0.0);
      gl.enable( gl.BLEND );
      gl.blendEquation( gl.FUNC_ADD );
      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

      gridShader = SketchbookUtil.createProgram(gl, 'flat', 'grid');

      render();
    }
  }

  function render() {
    theta += dTheta;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(gridShader);

    var thetaUniform = gl.getUniformLocation(gridShader, "theta");
    gl.uniform1f(thetaUniform, theta);

    var thetaUniform = gl.getUniformLocation(gridShader, "size");
    gl.uniform2f(thetaUniform, canvas.width, canvas.height);

    var diagonalsUniform = gl.getUniformLocation(gridShader, "diagonals");
    gl.uniform4f(diagonalsUniform, -Math.PI*1/4, -Math.PI*3/4, Math.PI*1/4, Math.PI*3/4);

    var sample = sampler.getSample();
    for (var j=0; j<sample.length; j++)
      sample[j] = lerp(lastSample[j],sample[j],ease);
    lastSample = sample;

    var samplesUniform = gl.getUniformLocation(gridShader, "samples");
    gl.uniform1fv(samplesUniform, sample);

    var offsetUniform = gl.getUniformLocation(gridShader, "offset");
    gl.uniform2f(offsetUniform, xOffset, yOffset);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    SketchbookUtil.drawFlatBackground(gl, gridShader);

      requestAnimationFrame(render);
  }

  function lerp(a,b,x) { return a + x*(b-a); }
}
