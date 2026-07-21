// Particles – vanilla WebGL port of React Bits Particles component
// Zero dependencies, plain IIFE script, works on file:// and any server.
(function () {
  'use strict';

  var defaultColors = ['#ffffff'];

  var hexToRgb = function (hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(function (c) { return c + c; }).join('');
    }
    var int = parseInt(hex, 16);
    return [(int >> 16 & 255) / 255, (int >> 8 & 255) / 255, (int & 255) / 255];
  };

  // ── Minimal matrix math (column-major, WebGL convention) ─────────────────
  function perspective(fovDeg, aspect, near, far) {
    var f = 1 / Math.tan(fovDeg * Math.PI / 360);
    var nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  // Camera at (0, 0, dist) looking at origin
  function viewMatrix(dist) {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, -dist, 1
    ]);
  }

  // Euler rotation matrix (XYZ order: Rz * Ry * Rx)
  function rotationMatrix(rx, ry, rz) {
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var cz = Math.cos(rz), sz = Math.sin(rz);
    return new Float32Array([
      cy * cz, cy * sz, -sy, 0,
      sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0,
      cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0,
      0, 0, 0, 1
    ]);
  }

  function translateMatrix(m, tx, ty, tz) {
    var out = new Float32Array(m);
    out[12] = m[0] * tx + m[4] * ty + m[8] * tz + m[12];
    out[13] = m[1] * tx + m[5] * ty + m[9] * tz + m[13];
    out[14] = m[2] * tx + m[6] * ty + m[10] * tz + m[14];
    out[15] = m[3] * tx + m[7] * ty + m[11] * tz + m[15];
    return out;
  }

  // ── Shaders (exact React Bits source) ─────────────────────────────────────
  var VERT = [
    'attribute vec3 position;',
    'attribute vec4 random;',
    'attribute vec3 color;',
    'uniform mat4 modelMatrix;',
    'uniform mat4 viewMatrix;',
    'uniform mat4 projectionMatrix;',
    'uniform float uTime;',
    'uniform float uSpread;',
    'uniform float uBaseSize;',
    'uniform float uSizeRandomness;',
    'varying vec4 vRandom;',
    'varying vec3 vColor;',
    'void main() {',
    '  vRandom = random;',
    '  vColor  = color;',
    '  vec3 pos = position * uSpread;',
    '  pos.z *= 10.0;',
    '  vec4 mPos = modelMatrix * vec4(pos, 1.0);',
    '  float t = uTime;',
    '  mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);',
    '  mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);',
    '  mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);',
    '  vec4 mvPos = viewMatrix * mPos;',
    '  ',
    '  // FORCE A FIXED, MASSIVE SIZE (Ignores distance shrinking)',
    '  gl_PointSize = uBaseSize;',
    '  ',
    '  gl_Position = projectionMatrix * mvPos;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform float uTime;',
    'uniform float uAlphaParticles;',
    'varying vec4 vRandom;',
    'varying vec3 vColor;',
    'void main() {',
    '  vec2 uv = gl_PointCoord.xy;',
    '  float d = length(uv - vec2(0.5));',
    '  ',
    '  // Sharp cut-off: if it is outside the circle radius, discard it',
    '  if (d > 0.5) discard;',
    '  ',
    '  // Solid, highly visible color',
    '  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);',
    '}'
  ].join('\n');

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Particles shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.initParticles = function (container, opts) {
    opts = opts || {};
    var particleCount = opts.particleCount !== undefined ? opts.particleCount : 300;
    var particleSpread = opts.particleSpread !== undefined ? opts.particleSpread : 10;
    var speed = opts.speed !== undefined ? opts.speed : 0.1;
    var particleColors = (opts.particleColors && opts.particleColors.length) ? opts.particleColors : defaultColors;
    var moveParticlesOnHover = false;
    var particleHoverFactor = opts.particleHoverFactor !== undefined ? opts.particleHoverFactor : 1;
    var alphaParticles = !!opts.alphaParticles;
    var particleBaseSize = 3.0;
    var sizeRandomness = opts.sizeRandomness !== undefined ? opts.sizeRandomness : 1;
    var cameraDistance = opts.cameraDistance !== undefined ? opts.cameraDistance : 20;
    var disableRotation = !!opts.disableRotation;
    var pixelRatio = opts.pixelRatio !== undefined ? opts.pixelRatio : Math.min(window.devicePixelRatio || 1, 2);

    if (!container) return function () { };

    // ── Canvas ──────────────────────────────────────────────────────────────
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';
    document.body.insertBefore(canvas, document.body.firstChild);

    var gl = canvas.getContext('webgl', { alpha: true, depth: false })
      || canvas.getContext('experimental-webgl', { alpha: true, depth: false });
    if (!gl) { canvas.remove(); return function () { }; }
    gl.clearColor(0, 0, 0, 0);

    // ── Program ─────────────────────────────────────────────────────────────
    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); return function () { }; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Particles link:', gl.getProgramInfoLog(prog));
      canvas.remove(); return function () { };
    }
    gl.useProgram(prog);

    // ── Geometry ─────────────────────────────────────────────────────────────
    var count = particleCount;
    var positions = new Float32Array(count * 3);
    var randoms = new Float32Array(count * 4);
    var colors = new Float32Array(count * 3);

    for (var i = 0; i < count; i++) {
      var x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      var r = Math.cbrt(Math.random());
      positions[i * 3] = x * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = z * r;
      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
      var col = hexToRgb(particleColors[Math.floor(Math.random() * particleColors.length)]);
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
    }

    function createBuf(data) {
      var b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return b;
    }
    var posBuf = createBuf(positions);
    var randBuf = createBuf(randoms);
    var colorBuf = createBuf(colors);

    function bindAttr(buf, loc, size) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    var aPos = gl.getAttribLocation(prog, 'position');
    var aRand = gl.getAttribLocation(prog, 'random');
    var aColor = gl.getAttribLocation(prog, 'color');

    // ── Uniforms ─────────────────────────────────────────────────────────────
    var uModel = gl.getUniformLocation(prog, 'modelMatrix');
    var uView = gl.getUniformLocation(prog, 'viewMatrix');
    var uProj = gl.getUniformLocation(prog, 'projectionMatrix');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uSpread = gl.getUniformLocation(prog, 'uSpread');
    var uBase = gl.getUniformLocation(prog, 'uBaseSize');
    var uSizeR = gl.getUniformLocation(prog, 'uSizeRandomness');
    var uAlpha = gl.getUniformLocation(prog, 'uAlphaParticles');

    gl.uniform1f(uSpread, particleSpread);
    gl.uniform1f(uBase, particleBaseSize * pixelRatio);
    gl.uniform1f(uSizeR, sizeRandomness);
    gl.uniform1f(uAlpha, alphaParticles ? 1 : 0);
    gl.uniformMatrix4fv(uView, false, viewMatrix(cameraDistance));

    // ── Resize ───────────────────────────────────────────────────────────────
    function resize() {
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniformMatrix4fv(uProj, false, perspective(15, canvas.width / canvas.height, 0.1, 1000));
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Mouse ────────────────────────────────────────────────────────────────
    var mouse = { x: 0, y: 0 };
    function onMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    if (moveParticlesOnHover) window.addEventListener('mousemove', onMove);

    // ── Render loop ──────────────────────────────────────────────────────────
    var rx = 0, ry = 0, rz = 0;
    var lastT = performance.now();
    var elapsed = 0;
    var rafId = null;

    function loop(t) {
      var delta = t - lastT;
      lastT = t;
      elapsed += delta * speed;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (!disableRotation) {
        rx = Math.sin(elapsed * 0.0002) * 0.1;
        ry = Math.cos(elapsed * 0.0005) * 0.15;
        rz += 0.01 * speed;
      }

      var model = rotationMatrix(rx, ry, rz);
      if (moveParticlesOnHover) {
        model = translateMatrix(model, -mouse.x * particleHoverFactor, -mouse.y * particleHoverFactor, 0);
      }

      gl.uniformMatrix4fv(uModel, false, model);
      gl.uniform1f(uTime, elapsed * 0.001);

      bindAttr(posBuf, aPos, 3);
      bindAttr(randBuf, aRand, 4);
      bindAttr(colorBuf, aColor, 3);

      gl.drawArrays(gl.POINTS, 0, count);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return function () {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) window.removeEventListener('mousemove', onMove);
      try {
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      } catch (e) { /* ignore */ }
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  };

}());
