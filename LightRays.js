// LightRays – vanilla WebGL, zero dependencies, plain script (no ES module)
(function () {
  var hexToRgb = function (hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
  };

  var getAnchorAndDir = function (origin, w, h) {
    var o = 0.2;
    switch (origin) {
      case 'top-left': return { anchor: [0, -o * h], dir: [0, 1] };
      case 'top-right': return { anchor: [w, -o * h], dir: [0, 1] };
      case 'left': return { anchor: [-o * w, 0.5 * h], dir: [1, 0] };
      case 'right': return { anchor: [(1 + o) * w, 0.5 * h], dir: [-1, 0] };
      case 'bottom-left': return { anchor: [0, (1 + o) * h], dir: [0, -1] };
      case 'bottom-center': return { anchor: [0.5 * w, (1 + o) * h], dir: [0, -1] };
      case 'bottom-right': return { anchor: [w, (1 + o) * h], dir: [0, -1] };
      default: return { anchor: [0.5 * w, -o * h], dir: [0, 1] };
    }
  };

  var VERT = [
    'attribute vec2 position;',
    'void main(){gl_Position=vec4(position,0.0,1.0);}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform float iTime;',
    'uniform vec2  iResolution;',
    'uniform vec2  rayPos;',
    'uniform vec2  rayDir;',
    'uniform vec3  raysColor;',
    'uniform float raysSpeed;',
    'uniform float lightSpread;',
    'uniform float rayLength;',
    'uniform float pulsating;',
    'uniform float fadeDistance;',
    'uniform float saturation;',
    'uniform vec2  mousePos;',
    'uniform float mouseInfluence;',
    'uniform float noiseAmount;',
    'uniform float distortion;',

    'float noise(vec2 st){',
    '  return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453123);',
    '}',

    'float rayStr(vec2 src,vec2 refDir,vec2 coord,float sA,float sB,float spd){',
    '  vec2  d=coord-src;',
    '  float cosA=dot(normalize(d),refDir);',
    '  float da=cosA+distortion*sin(iTime*2.0+length(d)*0.01)*0.2;',
    '  float spread=pow(max(da,0.0),1.0/max(lightSpread,0.001));',
    '  float dist=length(d);',
    '  float maxD=iResolution.x*rayLength;',
    '  float lf=clamp((maxD-dist)/maxD,0.0,1.0);',
    '  float ff=clamp((iResolution.x*fadeDistance-dist)/(iResolution.x*fadeDistance),0.5,1.0);',
    '  float pulse=pulsating>0.5?(0.8+0.2*sin(iTime*spd*3.0)):1.0;',
    '  float base=clamp((0.45+0.15*sin(da*sA+iTime*spd))+(0.30+0.20*cos(-da*sB+iTime*spd)),0.0,1.0);',
    '  return base*lf*ff*spread*pulse;',
    '}',

    'void main(){',
    '  vec2 coord=vec2(gl_FragCoord.x,iResolution.y-gl_FragCoord.y);',
    '  vec2 finalDir=rayDir;',
    '  if(mouseInfluence>0.0){',
    '    vec2 ms=mousePos*iResolution.xy;',
    '    finalDir=normalize(mix(rayDir,normalize(ms-rayPos),mouseInfluence));',
    '  }',
    '  float r1=rayStr(rayPos,finalDir,coord,36.2214,21.11349,1.5*raysSpeed);',
    '  float r2=rayStr(rayPos,finalDir,coord,22.3991,18.02340,1.1*raysSpeed);',
    '  vec4 col=vec4(1.0)*r1*0.5+vec4(1.0)*r2*0.4;',
    '  if(noiseAmount>0.0){float n=noise(coord*0.01+iTime*0.1);col.rgb*=(1.0-noiseAmount+noiseAmount*n);}',
    '  float brightness=1.0-(coord.y/iResolution.y);',
    '  col.x*=0.1+brightness*0.8;',
    '  col.y*=0.3+brightness*0.6;',
    '  col.z*=0.5+brightness*0.5;',
    '  if(saturation!=1.0){float g=dot(col.rgb,vec3(0.299,0.587,0.114));col.rgb=mix(vec3(g),col.rgb,saturation);}',
    '  col.rgb*=raysColor;',
    '  gl_FragColor=col;',
    '}'
  ].join('\n');

  function makeShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('LightRays shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  window.initLightRays = function (container, opts) {
    opts = opts || {};
    var raysOrigin = opts.raysOrigin || 'top-center';
    var raysColor = opts.raysColor || '#0be6faff';
    var raysSpeed = opts.raysSpeed !== undefined ? opts.raysSpeed : 1;
    var lightSpread = opts.lightSpread !== undefined ? opts.lightSpread : 1;
    var rayLength = opts.rayLength !== undefined ? opts.rayLength : 2;
    var pulsating = opts.pulsating || false;
    var fadeDistance = opts.fadeDistance !== undefined ? opts.fadeDistance : 1;
    var saturation = opts.saturation !== undefined ? opts.saturation : 1;
    var followMouse = opts.followMouse !== false;
    var mouseInfluence = opts.mouseInfluence !== undefined ? opts.mouseInfluence : 0.1;
    var noiseAmount = opts.noiseAmount !== undefined ? opts.noiseAmount : 0;
    var distortion = opts.distortion !== undefined ? opts.distortion : 0;

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;display:block;';
    container.insertBefore(canvas, container.firstChild);

    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
      || canvas.getContext('experimental-webgl', { alpha: true });
    if (!gl) { canvas.remove(); return function () { }; }

    var vs = makeShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = makeShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); return function () { }; }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('LightRays link:', gl.getProgramInfoLog(prog));
      canvas.remove(); return function () { };
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(prog, 'iTime');
    var uRes = gl.getUniformLocation(prog, 'iResolution');
    var uRayPos = gl.getUniformLocation(prog, 'rayPos');
    var uRayDir = gl.getUniformLocation(prog, 'rayDir');
    var uColor = gl.getUniformLocation(prog, 'raysColor');
    var uSpeed = gl.getUniformLocation(prog, 'raysSpeed');
    var uSpread = gl.getUniformLocation(prog, 'lightSpread');
    var uLength = gl.getUniformLocation(prog, 'rayLength');
    var uPulse = gl.getUniformLocation(prog, 'pulsating');
    var uFade = gl.getUniformLocation(prog, 'fadeDistance');
    var uSat = gl.getUniformLocation(prog, 'saturation');
    var uMouse = gl.getUniformLocation(prog, 'mousePos');
    var uMInf = gl.getUniformLocation(prog, 'mouseInfluence');
    var uNoise = gl.getUniformLocation(prog, 'noiseAmount');
    var uDist = gl.getUniformLocation(prog, 'distortion');

    var rgb = hexToRgb(raysColor);
    gl.uniform3f(uColor, 0.4, 0.7, 1.0);
    gl.uniform1f(uSpeed, raysSpeed);
    gl.uniform1f(uSpread, lightSpread);
    gl.uniform1f(uLength, rayLength);
    gl.uniform1f(uPulse, pulsating ? 1 : 0);
    gl.uniform1f(uFade, fadeDistance);
    gl.uniform1f(uSat, saturation);
    gl.uniform2f(uMouse, 0.5, 0.5);
    gl.uniform1f(uMInf, mouseInfluence);
    gl.uniform1f(uNoise, noiseAmount);
    gl.uniform1f(uDist, distortion);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var w = container.clientWidth || window.innerWidth;
      var h = container.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      var ad = getAnchorAndDir(raysOrigin, canvas.width, canvas.height);
      gl.uniform2f(uRayPos, ad.anchor[0], ad.anchor[1]);
      gl.uniform2f(uRayDir, ad.dir[0], ad.dir[1]);
    }
    window.addEventListener('resize', resize);
    resize();

    var mouse = { x: 0.5, y: 0.5 };
    var smooth = { x: 0.5, y: 0.5 };
    function onMove(e) {
      var r = container.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width;
      mouse.y = (e.clientY - r.top) / r.height;
    }
    if (followMouse) window.addEventListener('mousemove', onMove);

    var rafId = null;
    function loop(t) {
      gl.uniform1f(uTime, t * 0.001);
      if (followMouse && mouseInfluence > 0) {
        var s = 0.92;
        smooth.x = smooth.x * s + mouse.x * (1 - s);
        smooth.y = smooth.y * s + mouse.y * (1 - s);
        gl.uniform2f(uMouse, smooth.x, smooth.y);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return function cleanup() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      window.removeEventListener('resize', resize);
      if (followMouse) window.removeEventListener('mousemove', onMove);
      try { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) { }
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  };
}());
