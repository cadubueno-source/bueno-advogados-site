(function () {
  "use strict";

  /* Se qualquer etapa falhar, garante que o skyline estático volte a
     aparecer (removendo a classe que o esconde) em vez de deixar a
     página num estado quebrado (nem animação, nem fundo). */
  function fallbackToStaticBackground() {
    document.documentElement.classList.remove("vortex-pending");
  }

  try {
    var canvas = document.getElementById("vortex-canvas");
    if (!canvas) return;

    if (!document.documentElement.classList.contains("vortex-pending")) {
      // O script inline no <head> já decidiu que este dispositivo não é
      // elegível (mobile, touch, reduced-motion) — nada a fazer aqui.
      return;
    }

    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      fallbackToStaticBackground();
      return;
    }

    var heroSection = canvas.closest(".page-hero");
    if (!heroSection) {
      fallbackToStaticBackground();
      return;
    }

    var vsSource =
      "precision mediump float;" +
      "attribute vec2 a_position;" +
      "varying vec2 vUv;" +
      "void main() {" +
      "  vUv = .5 * (a_position + 1.);" +
      "  gl_Position = vec4(a_position, 0.0, 1.0);" +
      "}";

    var fsSource =
      "precision mediump float;" +
      "varying vec2 vUv;" +
      "uniform float u_time;" +
      "uniform float u_ratio;" +
      "uniform vec2 u_pointer_position;" +
      "vec2 rotate(vec2 uv, float th) {" +
      "  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;" +
      "}" +
      "float neuro_shape(vec2 uv, float t, float p) {" +
      "  vec2 sine_acc = vec2(0.);" +
      "  vec2 res = vec2(0.);" +
      "  float scale = 8.;" +
      "  for (int j = 0; j < 15; j++) {" +
      "    uv = rotate(uv, 1.);" +
      "    sine_acc = rotate(sine_acc, 1.);" +
      "    vec2 layer = uv * scale + float(j) + sine_acc - t;" +
      "    sine_acc += sin(layer) + 2.4 * p;" +
      "    res += (.5 + .5 * cos(layer)) / scale;" +
      "    scale *= 1.2;" +
      "  }" +
      "  return res.x + res.y;" +
      "}" +
      "void main() {" +
      "  vec2 uv = .5 * vUv;" +
      "  uv.x *= u_ratio;" +
      "  vec2 pointer = vUv - u_pointer_position;" +
      "  pointer.x *= u_ratio;" +
      "  float p = clamp(length(pointer), 0., 1.);" +
      "  p = .5 * pow(1. - p, 2.);" +
      "  float t = .0006 * u_time;" +
      "  float noise = neuro_shape(uv, t, p);" +
      "  noise = 1.2 * pow(noise, 3.);" +
      "  noise += pow(noise, 10.);" +
      "  noise = max(.0, noise - .5);" +
      "  noise *= (1. - length(vUv - .5));" +
      "  vec3 navy = vec3(0.06, 0.14, 0.25);" +
      "  vec3 gold = vec3(0.78, 0.60, 0.31);" +
      "  vec3 color = mix(navy, gold, 0.28 + 0.18 * sin(t * 2.5));" +
      "  color = color * noise;" +
      "  gl_FragColor = vec4(color, noise * 0.85);" +
      "}";

    function compileShader(source, type) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    var fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      fallbackToStaticBackground();
      return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      fallbackToStaticBackground();
      return;
    }
    gl.useProgram(program);

    var vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(program, "u_time");
    var uRatio = gl.getUniformLocation(program, "u_ratio");
    var uPointerPosition = gl.getUniformLocation(program, "u_pointer_position");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var pointer = { x: 0, y: 0, tX: 0, tY: 0 };
    var animationId = null;
    var isVisible = true;
    var lostContext = false;

    function resizeCanvas() {
      var rect = heroSection.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uRatio, canvas.width / canvas.height);
    }

    function render(time) {
      if (!isVisible || lostContext) return;
      try {
        pointer.x += (pointer.tX - pointer.x) * 0.18;
        pointer.y += (pointer.tY - pointer.y) * 0.18;

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, time);
        gl.uniform2f(uPointerPosition, pointer.x / canvas.clientWidth, 1 - pointer.y / canvas.clientHeight);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationId = requestAnimationFrame(render);
      } catch (renderError) {
        lostContext = true;
        fallbackToStaticBackground();
      }
    }

    function handlePointerMove(e) {
      var rect = heroSection.getBoundingClientRect();
      pointer.tX = e.clientX - rect.left;
      pointer.tY = e.clientY - rect.top;
    }

    canvas.addEventListener(
      "webglcontextlost",
      function (e) {
        e.preventDefault();
        lostContext = true;
        if (animationId) cancelAnimationFrame(animationId);
        fallbackToStaticBackground();
      },
      false
    );

    resizeCanvas();
    pointer.x = pointer.tX = canvas.clientWidth / 2;
    pointer.y = pointer.tY = canvas.clientHeight / 2;

    window.addEventListener("resize", resizeCanvas);
    heroSection.addEventListener("pointermove", handlePointerMove);

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationId && !lostContext) {
            animationId = requestAnimationFrame(render);
          }
        });
      });
      io.observe(heroSection);
    }

    animationId = requestAnimationFrame(render);
  } catch (setupError) {
    fallbackToStaticBackground();
  }
})();
