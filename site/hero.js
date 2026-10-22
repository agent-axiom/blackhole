/*
 * Spatial profiles of the diagonal entries of the paper's exact potential.
 * The moving cursor scans log-radius; it does not represent physical time.
 */

const DOMAIN = { min: -6, max: 5 };
const MULTIPOLE = 2;
const SCREENING = 10;
const ANGULAR = MULTIPOLE * (MULTIPOLE + 1);
const CHANNELS = [
  { name: "g", color: "#a8e6cb", rgb: "168, 230, 203", depth: -0.56 },
  { name: "D", color: "#88b7cc", rgb: "136, 183, 204", depth: 0.14 },
  { name: "Xi", color: "#dfcba7", rgb: "223, 203, 167", depth: 0.84 },
];

function diagonalPotential(z) {
  const r = 1 + Math.exp(z);
  const inverse = 1 / r;
  const inverse2 = inverse * inverse;
  const inverse3 = inverse2 * inverse;
  const inverse4 = inverse2 * inverse2;
  const f = (1 - inverse) ** 2;
  return [
    f * (ANGULAR * inverse2 - 6 * inverse3 + 4 * inverse4),
    f * (ANGULAR * inverse2 + 4 * inverse4),
    f * SCREENING * inverse2,
  ];
}

const SAMPLES = Array.from({ length: 281 }, (_, index) => {
  const t = index / 280;
  const z = DOMAIN.min + t * (DOMAIN.max - DOMAIN.min);
  return { t, values: diagonalPotential(z) };
});

// One common vertical scale preserves the relative sizes of all three entries.
const AMPLITUDE_SCALE = Math.max(...SAMPLES.flatMap((sample) => sample.values));

/**
 * Start the presentation's spatial scanning illustration.
 * The canvas needs a CSS-controlled size; no external libraries are required.
 * Returns an explicit cleanup handle for a page that replaces the illustration.
 */
export function initHero(canvas, pauseButton) {
  if (!canvas || typeof canvas.getContext !== "function") {
    throw new TypeError("initHero requires a canvas element.");
  }

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    if (pauseButton) pauseButton.disabled = true;
    return { destroy() {} };
  }

  const buffer = document.createElement("canvas");
  const bufferContext = buffer.getContext("2d", { alpha: true });
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionPreference.matches;
  let manuallyPaused = false;
  let motionOptIn = false;
  let visible = true;
  let destroyed = false;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let animationFrame = 0;
  let lastFrame = 0;
  let cursor = 0.552;

  if (!canvas.hasAttribute("role")) canvas.setAttribute("role", "img");
  if (!canvas.hasAttribute("aria-label")) {
    canvas.setAttribute(
      "aria-label",
      "Three diagonal potential profiles for multipole 2 and screening parameter 10. A cursor scans spatial log-radius, not physical time.",
    );
  }

  const paused = () => manuallyPaused || (reducedMotion && !motionOptIn);
  const active = () => !destroyed && !paused() && visible && !document.hidden && width > 0;

  function project(t, amplitude, depth) {
    return {
      x: width * (0.49 + (t - 0.5) * 0.79 + depth * 0.066),
      y: height * (0.775 + (t - 0.5) * 0.073 - depth * 0.094 - amplitude * 0.482),
    };
  }

  function line(ctx, start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  function profilePath(ctx, channel, depth, start = 0, end = SAMPLES.length - 1) {
    for (let index = start; index <= end; index += 1) {
      const sample = SAMPLES[index];
      const point = project(sample.t, sample.values[channel] / AMPLITUDE_SCALE, depth);
      if (index === start) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
  }

  function renderStatic(ctx) {
    ctx.clearRect(0, 0, width, height);
    const ambient = ctx.createRadialGradient(
      width * 0.57, height * 0.43, 0,
      width * 0.57, height * 0.43, Math.max(width, height) * 0.56,
    );
    ambient.addColorStop(0, "rgba(116, 179, 170, 0.052)");
    ambient.addColorStop(1, "rgba(116, 179, 170, 0)");
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, width, height);

    // The receding ground plane is a drawing aid, not a spacetime embedding.
    ctx.lineWidth = 1;
    for (let index = 0; index <= 12; index += 1) {
      ctx.strokeStyle = index % 3 === 0 ? "rgba(162, 192, 189, 0.14)" : "rgba(162, 192, 189, 0.065)";
      line(ctx, project(index / 12, 0, -0.92), project(index / 12, 0, 1.16));
    }
    for (let index = 0; index <= 7; index += 1) {
      const depth = -0.92 + (index / 7) * 2.08;
      ctx.strokeStyle = index === 0 || index === 7 ? "rgba(162, 192, 189, 0.14)" : "rgba(162, 192, 189, 0.065)";
      line(ctx, project(0, 0, depth), project(1, 0, depth));
    }

    // Paint from back to front, keeping a shared amplitude scale throughout.
    for (let channel = CHANNELS.length - 1; channel >= 0; channel -= 1) {
      const { depth, color, rgb } = CHANNELS[channel];
      const floorStart = project(0, 0, depth);
      const floorEnd = project(1, 0, depth);
      const fill = ctx.createLinearGradient(0, height * 0.24, 0, height * 0.84);
      fill.addColorStop(0, `rgba(${rgb}, 0.15)`);
      fill.addColorStop(0.65, `rgba(${rgb}, 0.055)`);
      fill.addColorStop(1, `rgba(${rgb}, 0.006)`);
      ctx.beginPath();
      profilePath(ctx, channel, depth);
      ctx.lineTo(floorEnd.x, floorEnd.y);
      ctx.lineTo(floorStart.x, floorStart.y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Fine ribs make the underlying sampled spatial profile readable.
      ctx.strokeStyle = `rgba(${rgb}, 0.13)`;
      ctx.lineWidth = 0.7;
      for (let index = 8; index < SAMPLES.length; index += 12) {
        const sample = SAMPLES[index];
        const amplitude = sample.values[channel] / AMPLITUDE_SCALE;
        if (amplitude < 0.008) continue;
        line(ctx, project(sample.t, 0, depth), project(sample.t, amplitude, depth));
      }

      // A narrow ribbon gives the line dimension without altering its height.
      ctx.beginPath();
      profilePath(ctx, channel, depth - 0.065);
      for (let index = SAMPLES.length - 1; index >= 0; index -= 1) {
        const sample = SAMPLES[index];
        const point = project(sample.t, sample.values[channel] / AMPLITUDE_SCALE, depth + 0.065);
        ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${rgb}, 0.13)`;
      ctx.fill();

      ctx.beginPath();
      profilePath(ctx, channel, depth);
      ctx.strokeStyle = `rgba(${rgb}, 0.065)`;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.65;
      ctx.stroke();

      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = `rgba(${rgb}, 0.22)`;
      ctx.lineWidth = 0.8;
      line(ctx, floorStart, floorEnd);
      ctx.setLineDash([]);
    }
  }

  function renderCursor() {
    const nearDepth = -0.84;
    const farDepth = 1.08;
    const corners = [
      project(cursor, 0, nearDepth),
      project(cursor, 1.07, nearDepth),
      project(cursor, 1.07, farDepth),
      project(cursor, 0, farDepth),
    ];
    context.beginPath();
    corners.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = "rgba(190, 224, 214, 0.022)";
    context.fill();
    context.strokeStyle = "rgba(190, 224, 214, 0.11)";
    context.lineWidth = 0.8;
    context.stroke();

    const values = diagonalPotential(DOMAIN.min + cursor * (DOMAIN.max - DOMAIN.min));
    for (let channel = CHANNELS.length - 1; channel >= 0; channel -= 1) {
      const { color, rgb, depth } = CHANNELS[channel];
      const point = project(cursor, values[channel] / AMPLITUDE_SCALE, depth);
      const foot = project(cursor, 0, depth);
      context.setLineDash([2, 4]);
      context.strokeStyle = `rgba(${rgb}, 0.34)`;
      context.lineWidth = 0.8;
      line(context, foot, point);
      context.setLineDash([]);

      const radius = width < 440 ? 3.1 : 3.8;
      context.beginPath();
      context.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
      context.fillStyle = `rgba(${rgb}, 0.075)`;
      context.fill();
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = "#132b2d";
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = 1.4;
      context.stroke();
      context.beginPath();
      context.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    }
  }

  function render() {
    if (!width || !height || destroyed) return;
    context.clearRect(0, 0, width, height);
    if (bufferContext) context.drawImage(buffer, 0, 0, width, height);
    else renderStatic(context);
    renderCursor();
  }

  function updateButton() {
    if (!pauseButton) return;
    const label = paused() ? "Resume scan" : "Pause scan";
    const labelElement = pauseButton.querySelector("[data-scan-label]") || pauseButton;
    labelElement.textContent = label;
    pauseButton.setAttribute("aria-pressed", String(paused()));
    pauseButton.setAttribute("aria-label", label);
  }

  function tick(now) {
    animationFrame = 0;
    if (destroyed) return;
    if (active() && lastFrame) {
      // This is a slow spatial scan. No field value changes with animation time.
      const elapsed = Math.min((now - lastFrame) / 1000, 0.1);
      cursor = (cursor + elapsed / 34) % 1;
    }
    lastFrame = now;
    render();
    if (active()) animationFrame = window.requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrame = 0;
    updateButton();
    render();
    if (active()) animationFrame = window.requestAnimationFrame(tick);
  }

  function resize() {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    width = bounds.width;
    height = bounds.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.max(1, Math.round(width * pixelRatio));
    const targetHeight = Math.max(1, Math.round(height * pixelRatio));
    if (canvas.width !== targetWidth) canvas.width = targetWidth;
    if (canvas.height !== targetHeight) canvas.height = targetHeight;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (bufferContext) {
      buffer.width = targetWidth;
      buffer.height = targetHeight;
      bufferContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      renderStatic(bufferContext);
    }
    syncPlayback();
  }

  function onToggle() {
    if (paused()) {
      manuallyPaused = false;
      motionOptIn = true;
    } else {
      manuallyPaused = true;
    }
    syncPlayback();
  }

  function onMotionPreference(event) {
    reducedMotion = event.matches;
    motionOptIn = false;
    syncPlayback();
  }

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  const visibilityObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        syncPlayback();
      }, { threshold: 0 })
    : null;

  resizeObserver?.observe(canvas);
  visibilityObserver?.observe(canvas);
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncPlayback);
  pauseButton?.addEventListener("click", onToggle);
  if (typeof motionPreference.addEventListener === "function") {
    motionPreference.addEventListener("change", onMotionPreference);
  } else {
    motionPreference.addListener(onMotionPreference);
  }
  resize();
  updateButton();

  return {
    destroy() {
      destroyed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncPlayback);
      pauseButton?.removeEventListener("click", onToggle);
      if (typeof motionPreference.removeEventListener === "function") {
        motionPreference.removeEventListener("change", onMotionPreference);
      } else {
        motionPreference.removeListener(onMotionPreference);
      }
    },
  };
}
