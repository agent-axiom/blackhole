/*
 * A procedural, artistic black-hole illustration. The lens mapping and disc
 * shapes below are compositional approximations, not a ray-traced solution.
 * Native WebGL renders into a private canvas; the visible 2D canvas keeps a
 * complete fallback available even when shader compilation or a context fails.
 */

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}

float bell(float value, float width) {
  float d = value / width;
  return exp(-d * d);
}

vec3 stars(vec2 p, float scale, float seed) {
  vec2 cell = floor(p * scale);
  vec2 local = fract(p * scale) - 0.5;
  float random = hash(cell + seed);
  vec2 offset = vec2(hash(cell + seed + 8.1), hash(cell + seed + 31.4)) - 0.5;
  float distanceToStar = length(local - offset * 0.65);
  float star = bell(distanceToStar, mix(0.012, 0.032, random));
  float halo = bell(distanceToStar, 0.08) * 0.08;
  float present = step(0.84, random);
  vec3 tint = mix(vec3(0.53, 0.72, 0.74), vec3(0.94, 0.87, 0.70), random);
  return tint * (star + halo) * present * mix(0.35, 1.1, random);
}

// Concentric filaments advect around the disc, rather than flashing randomly.
vec3 discLight(float radius, float angle, float inner, float outer, float time) {
  float envelope = smoothstep(inner, inner + 0.07, radius)
                 * (1.0 - smoothstep(outer - 0.27, outer, radius));
  if (envelope < 0.001) return vec3(0.0);
  float orbit = angle - time * 0.11 / max(radius, 0.32);
  vec2 flow = vec2(cos(orbit), sin(orbit)) * radius;
  float wisps = noise(flow * 18.0) * 0.63 + noise(flow * 42.0) * 0.37;
  float threads = 0.5 + 0.5 * sin(radius * 185.0 + wisps * 5.0 + sin(orbit * 5.0));
  float hot = 1.0 - smoothstep(inner + 0.08, outer, radius);
  float approaching = pow(0.5 - 0.5 * cos(angle + 0.25), 2.0);
  float light = envelope * (0.36 + 0.66 * wisps + 0.38 * threads)
              * (0.65 + 1.65 * approaching) * (0.38 + 0.92 * hot);
  vec3 warm = mix(vec3(0.48, 0.22, 0.075), vec3(1.0, 0.79, 0.46), hot);
  warm = mix(warm, vec3(1.0, 0.96, 0.82), hot * approaching * 0.58);
  return warm * light;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 screen = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;
  float scale = min(1.0, aspect / 1.35);
  vec2 center = u_pointer * vec2(0.23, 0.15)
              + vec2(sin(u_time * 0.15), cos(u_time * 0.12)) * 0.022;
  vec2 p = screen / scale - center;
  float tilt = -0.12 + u_pointer.x * 0.035;
  float co = cos(tilt), si = sin(tilt);
  vec2 q = mat2(co, -si, si, co) * p;
  float radius = length(q);
  const float shadowRadius = 0.31;

  // Quiet deep-green edges blend into the page; the shadow has a darker stage.
  vec3 edge = vec3(0.062745, 0.145098, 0.133333);
  vec3 background = vec3(0.009, 0.023, 0.028);
  float edgeMix = smoothstep(0.45, 1.45, length(screen * vec2(0.74, 1.0)));
  vec3 color = mix(background, edge, edgeMix);
  color += vec3(0.020, 0.033, 0.029) * bell(length(p - vec2(-0.45, 0.15)), 0.78);

  // A bounded radial warp gives nearby stars the suggestion of lensing.
  float bend = 0.075 / max(dot(p, p), 0.11);
  vec2 sky = p * (1.0 + bend) + u_pointer * 0.024;
  float starMask = smoothstep(shadowRadius + 0.01, shadowRadius + 0.11, radius);
  color += (stars(sky, 18.0, 4.7) + stars(sky, 31.0, 29.2) * 0.45) * starMask;

  // Broad, faint light keeps the bright filaments grounded in a soft atmosphere.
  float flattened = length(vec2(q.x, q.y / 0.35));
  color += vec3(0.25, 0.12, 0.035) * bell(flattened - 0.65, 0.48) * 0.16;
  color += vec3(0.18, 0.12, 0.065) * bell(radius - 0.40, 0.19) * 0.22;

  vec2 discPlane = vec2(q.x, q.y / 0.215);
  float discRadius = length(discPlane);
  float discAngle = atan(discPlane.y, discPlane.x);
  vec3 disc = discLight(discRadius, discAngle, 0.36, 1.20, u_time);
  float foreground = 1.0 - smoothstep(-0.018, 0.024, q.y);
  color += disc * (1.0 - foreground);

  // The far side of the disc appears above and, more faintly, below the shadow.
  vec2 upper = vec2(q.x, q.y / 0.88);
  float upperRadius = length(upper);
  float upperAngle = atan(upper.y, upper.x);
  float upperGate = smoothstep(0.015, 0.14, q.y);
  color += discLight(upperRadius, upperAngle, 0.335, 0.66, u_time * 0.72)
         * upperGate * 0.82;
  color += vec3(0.68, 0.41, 0.15) * bell(upperRadius - 0.44, 0.085)
         * upperGate * 0.16;

  vec2 lower = vec2(q.x, q.y / 0.76);
  float lowerRadius = length(lower);
  float lowerGate = 1.0 - smoothstep(-0.13, -0.02, q.y);
  color += discLight(lowerRadius, atan(lower.y, lower.x), 0.34, 0.51, u_time * 0.7)
         * lowerGate * 0.24;

  float shadow = 1.0 - smoothstep(shadowRadius - 0.002, shadowRadius + 0.006, radius);
  color = mix(color, vec3(0.0015, 0.0035, 0.004), shadow);

  // The photon rim is fine and uneven, never a uniformly bright neon ring.
  float rimAngle = atan(q.y, q.x);
  float rimBrightness = 0.30 + 0.70 * pow(0.5 - 0.5 * cos(rimAngle + 0.35), 2.0);
  float rim = bell(radius - 0.318, 0.0045) * 0.88
            + bell(radius - 0.322, 0.017) * 0.17;
  color += vec3(1.0, 0.82, 0.53) * rim * rimBrightness;

  // The near half of the disc crosses in front of the shadow.
  color += disc * foreground;
  float spine = bell(q.y + 0.035, 0.012) * bell(q.x, 0.92)
              * (1.0 - smoothstep(0.90, 1.21, abs(q.x)));
  color += vec3(0.73, 0.48, 0.23) * spine * 0.12;

  // Soft highlight compression preserves an ivory core and warm outer dust.
  color = color / (1.0 + max(color - 0.75, 0.0) * 0.55);
  vec2 edgeUV = gl_FragCoord.xy / u_resolution;
  float feather = smoothstep(0.0, 0.12, edgeUV.x) * smoothstep(0.0, 0.12, 1.0 - edgeUV.x)
                * smoothstep(0.0, 0.12, edgeUV.y) * smoothstep(0.0, 0.12, 1.0 - edgeUV.y);
  color = mix(edge, color, feather);
  gl_FragColor = vec4(color, 1.0);
}
`;

function createWebGLRenderer(onStateChange, onFailure) {
  const surface = document.createElement('canvas');
  let gl;
  try {
    gl = surface.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false,
      powerPreference: 'low-power', preserveDrawingBuffer: false,
    });
  } catch {
    onFailure('context-creation');
    return null;
  }
  if (!gl) {
    onFailure('context-unavailable');
    return null;
  }

  let program = null;
  let buffer = null;
  let uniforms = null;
  let ready = false;
  let destroyed = false;

  function disposeResources() {
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    program = null;
    buffer = null;
    uniforms = null;
    ready = false;
  }

  function initialize() {
    if (destroyed) return false;
    disposeResources();
    const shaders = [];
    let stage = 'initialization';
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX_SHADER], [gl.FRAGMENT_SHADER, FRAGMENT_SHADER]]) {
        stage = 'shader-allocation';
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Shader allocation failed');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        stage = 'shader-compilation';
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const name = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
          console.warn(`[Black-hole illustration] ${name} shader compilation failed: ${gl.getShaderInfoLog(shader) || '(no compiler log)'}`);
          throw new Error('Shader compilation failed');
        }
      }
      stage = 'program-allocation';
      program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      shaders.forEach(shader => gl.attachShader(program, shader));
      gl.linkProgram(program);
      stage = 'program-link';
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(`[Black-hole illustration] Program linking failed: ${gl.getProgramInfoLog(program) || '(no linker log)'}`);
        throw new Error('Program linking failed');
      }
      gl.useProgram(program);
      stage = 'buffer-allocation';
      buffer = gl.createBuffer();
      if (!buffer) throw new Error('Buffer allocation failed');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        pointer: gl.getUniformLocation(program, 'u_pointer'),
        time: gl.getUniformLocation(program, 'u_time'),
      };
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      ready = true;
      onFailure('');
    } catch {
      onFailure(stage);
      disposeResources();
    } finally {
      shaders.forEach(shader => gl.deleteShader(shader));
    }
    return ready;
  }

  function onLost(event) {
    event.preventDefault();
    ready = false;
    onFailure('context-lost');
    onStateChange();
  }
  function onRestored() {
    initialize();
    onStateChange();
  }

  if (!initialize()) return null;
  surface.addEventListener('webglcontextlost', onLost);
  surface.addEventListener('webglcontextrestored', onRestored);

  return {
    surface,
    resize(width, height) {
      if (surface.width !== width) surface.width = width;
      if (surface.height !== height) surface.height = height;
    },
    draw(time, pointer) {
      if (gl.isContextLost()) {
        onFailure('context-lost');
        return false;
      }
      if (!ready || destroyed) return false;
      gl.viewport(0, 0, surface.width, surface.height);
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, surface.width, surface.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.time, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    },
    destroy() {
      destroyed = true;
      surface.removeEventListener('webglcontextlost', onLost);
      surface.removeEventListener('webglcontextrestored', onRestored);
      disposeResources();
    },
  };
}

function makeStars() {
  let seed = 4079;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return Array.from({ length: 105 }, () => ({ x: random(), y: random(), radius: 0.4 + random() * 0.8, alpha: 0.16 + random() * 0.55 }));
}

function drawCanvasFallback(context, width, height, time, pointer, stars) {
  context.fillStyle = '#102522';
  context.fillRect(0, 0, width, height);
  const scale = Math.min(height * 0.5, width / 2.7);
  const centerX = width * 0.5 + (pointer.x * 0.23 + Math.sin(time * 0.15) * 0.022) * scale;
  const centerY = height * 0.5 - (pointer.y * 0.15 + Math.cos(time * 0.12) * 0.022) * scale;
  const shadow = scale * 0.31;
  const sky = context.createRadialGradient(centerX, centerY, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.55);
  sky.addColorStop(0, '#03090b');
  sky.addColorStop(0.6, '#0a1c1c');
  sky.addColorStop(1, '#102522');
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  for (const star of stars) {
    let x = star.x * width, y = star.y * height;
    const dx = x - centerX, dy = y - centerY;
    const radius = Math.hypot(dx, dy);
    const warp = Math.min(0.28, shadow * shadow * 0.14 / Math.max(radius * radius, 1));
    x += dx * warp + pointer.x * 1.6;
    y += dy * warp - pointer.y * 1.6;
    if (radius < shadow * 1.08) continue;
    context.fillStyle = `rgba(184, 210, 202, ${star.alpha})`;
    context.fillRect(x, y, star.radius, star.radius);
  }

  context.save();
  context.translate(centerX, centerY);
  context.rotate(0.12 - pointer.x * 0.035);
  const glow = context.createRadialGradient(0, 0, shadow * 0.8, 0, 0, scale * 0.95);
  glow.addColorStop(0, 'rgba(220, 174, 104, 0.08)');
  glow.addColorStop(0.45, 'rgba(193, 133, 63, 0.045)');
  glow.addColorStop(1, 'rgba(193, 133, 63, 0)');
  context.fillStyle = glow;
  context.fillRect(-scale * 1.3, -scale, scale * 2.6, scale * 2);

  function filaments(frontOnly) {
    for (let index = 0; index < 36; index += 1) {
      const r = scale * (0.38 + index / 35 * 0.78);
      const fade = Math.sin((index + 1) / 38 * Math.PI);
      const gradient = context.createLinearGradient(-r, 0, r, 0);
      gradient.addColorStop(0, `rgba(255, 231, 184, ${fade * 0.85})`);
      gradient.addColorStop(0.5, `rgba(239, 193, 125, ${fade * 0.55})`);
      gradient.addColorStop(1, `rgba(165, 102, 48, ${fade * 0.32})`);
      context.strokeStyle = gradient;
      context.lineWidth = Math.max(0.8, scale * 0.008);
      context.beginPath();
      context.ellipse(0, 0, r, r * 0.215, 0, frontOnly ? 0 : Math.PI, frontOnly ? Math.PI : Math.PI * 2);
      context.stroke();
      if (index % 5 === 0) {
        const a = time * 0.09 / (r / scale) + index * 2.17;
        const start = frontOnly ? (a % Math.PI) : Math.PI + (a % Math.PI);
        context.beginPath();
        context.ellipse(0, 0, r, r * 0.215, 0, start, Math.min(start + 0.24, frontOnly ? Math.PI : Math.PI * 2));
        context.strokeStyle = `rgba(255, 240, 206, ${fade * 0.3})`;
        context.stroke();
      }
    }
  }

  filaments(false);
  for (let index = 0; index < 22; index += 1) {
    const r = scale * (0.34 + index / 21 * 0.27);
    const alpha = Math.sin((index + 1) / 24 * Math.PI) * 0.46;
    const gradient = context.createLinearGradient(-r, 0, r, 0);
    gradient.addColorStop(0, `rgba(255, 231, 186, ${alpha})`);
    gradient.addColorStop(1, `rgba(185, 117, 53, ${alpha * 0.42})`);
    context.strokeStyle = gradient;
    context.lineWidth = Math.max(1, scale * 0.011);
    context.beginPath();
    context.ellipse(0, 0, r, r * 0.88, 0, Math.PI, Math.PI * 2);
    context.stroke();
  }
  context.beginPath();
  context.arc(0, 0, shadow, 0, Math.PI * 2);
  context.fillStyle = '#000203';
  context.fill();
  const rim = context.createLinearGradient(-shadow, -shadow, shadow, shadow);
  rim.addColorStop(0, 'rgba(255, 222, 166, 0.88)');
  rim.addColorStop(0.6, 'rgba(218, 159, 88, 0.35)');
  rim.addColorStop(1, 'rgba(193, 137, 70, 0.18)');
  context.strokeStyle = rim;
  context.lineWidth = Math.max(0.8, scale * 0.005);
  context.stroke();
  filaments(true);
  context.restore();
}

/** Initialize the decorative scene and return a complete lifecycle cleanup. */
export function initBlackHole(canvas, pauseButton, interactionElement = canvas?.parentElement) {
  if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('initBlackHole requires a canvas.');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    if (pauseButton) pauseButton.disabled = true;
    throw new Error('Canvas is unavailable; use the static illustration.');
  }

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const stars = makeStars();
  let reduced = preference.matches;
  let optedIn = false;
  let manuallyPaused = false;
  let visible = true;
  let destroyed = false;
  let frame = 0;
  let previousTime = 0;
  let lastPaint = 0;
  let time = 8;
  let width = 0;
  let height = 0;
  let ratio = 1;
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const paused = () => manuallyPaused || (reduced && !optedIn);
  const active = () => !destroyed && !paused() && visible && !document.hidden && width > 0 && height > 0;
  let gpuFailure = '';
  const gpu = createWebGLRenderer(
    () => { if (!destroyed) render(); },
    reason => { gpuFailure = reason; },
  );
  if (pauseButton) pauseButton.disabled = false;

  function render() {
    if (destroyed || !width || !height) return;
    const onGPU = gpu?.draw(time, pointer) ?? false;
    if (onGPU) {
      // Copy synchronously before WebGL's drawing buffer may be cleared.
      context.drawImage(gpu.surface, 0, 0, width, height);
    } else {
      drawCanvasFallback(context, width, height, time, pointer, stars);
    }
    const mode = onGPU ? 'webgl' : 'canvas';
    if (canvas.dataset.renderer !== mode) canvas.dataset.renderer = mode;
    if (onGPU) delete canvas.dataset.rendererFallback;
    else canvas.dataset.rendererFallback = gpuFailure || 'renderer-unavailable';
  }

  function updateButton() {
    if (!pauseButton) return;
    const label = paused() ? 'Resume motion' : 'Pause motion';
    const text = pauseButton.querySelector('[data-motion-label]') || pauseButton;
    text.textContent = label;
    pauseButton.setAttribute('aria-label', label);
    pauseButton.setAttribute('aria-pressed', String(paused()));
  }

  function tick(now) {
    frame = 0;
    if (!active()) { previousTime = 0; return; }
    const interval = coarsePointer.matches ? 1000 / 24 : 1000 / 30;
    if (!lastPaint || now - lastPaint >= interval - 1) {
      const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.09) : 0;
      previousTime = now;
      lastPaint = now;
      time += dt;
      const blend = 1 - Math.exp(-dt * 5.2);
      pointer.x += (target.x - pointer.x) * blend;
      pointer.y += (target.y - pointer.y) * blend;
      render();
    }
    if (active()) frame = window.requestAnimationFrame(tick);
  }

  function sync() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    lastPaint = 0;
    updateButton();
    // Draw a useful static frame for pause/reduced motion, but no hidden work.
    if (visible && !document.hidden) render();
    if (active()) frame = window.requestAnimationFrame(tick);
  }

  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) {
      width = 0; height = 0; sync(); return;
    }
    width = bounds.width;
    height = bounds.height;
    const pixelBudget = coarsePointer.matches ? 300000 : 720000;
    ratio = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.35 : 1.75,
      Math.sqrt(pixelBudget / (width * height)));
    const bufferWidth = Math.max(1, Math.round(width * ratio));
    const bufferHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
    if (canvas.height !== bufferHeight) canvas.height = bufferHeight;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    gpu?.resize(bufferWidth, bufferHeight);
    sync();
  }

  function onPointer(event) {
    if (paused() || event.pointerType === 'touch' || coarsePointer.matches) return;
    const bounds = interactionElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    target.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    target.y = Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / bounds.height * 2));
  }
  function onLeave() { target.x = 0; target.y = 0; }
  function onToggle() {
    if (paused()) { manuallyPaused = false; optedIn = true; }
    else manuallyPaused = true;
    sync();
  }
  function onPreference(event) {
    reduced = event.matches;
    optedIn = false;
    onLeave();
    sync();
  }

  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  const visibilityObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0 }) : null;
  resizeObserver?.observe(canvas);
  visibilityObserver?.observe(canvas);
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', sync);
  interactionElement?.addEventListener('pointermove', onPointer, { passive: true });
  interactionElement?.addEventListener('pointerleave', onLeave, { passive: true });
  pauseButton?.addEventListener('click', onToggle);
  if (typeof preference.addEventListener === 'function') preference.addEventListener('change', onPreference);
  else preference.addListener(onPreference);
  resize();

  return {
    destroy() {
      destroyed = true;
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      interactionElement?.removeEventListener('pointermove', onPointer);
      interactionElement?.removeEventListener('pointerleave', onLeave);
      pauseButton?.removeEventListener('click', onToggle);
      if (typeof preference.removeEventListener === 'function') preference.removeEventListener('change', onPreference);
      else preference.removeListener(onPreference);
      gpu?.destroy();
    },
  };
}
