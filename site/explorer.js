// The numerical points are frozen solver output. The resonance view evaluates
// the exact analytic profile using one fixed endpoint normalization.
const NS = 'http://www.w3.org/2000/svg';
const REVISION = '00bc6243983dfdc3bae3a15345bf73f9db3e6bc2';
const COLORS = {
  text: '#aababa', grid: 'rgba(169,203,194,.13)',
  mint: '#a8e6cb', cyan: '#88b7cc', sand: '#dfcba7', pink: '#c58d88',
};
const DESKTOP_FRAME = { left: 90, right: 730, top: 56, bottom: 270 };
const MOBILE_FRAME = { left: 90, right: 382, top: 78, bottom: 270 };
const FREQUENCIES = [1e-5, 3e-5, 1e-4, 3e-4, 1e-3, 3e-3, .01, .03, .1, .3];

function node(tag, attributes = {}, text) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (text !== undefined) el.textContent = text;
  return el;
}

function scientific(value, digits = 2) {
  if (value === 0) return '0';
  return value.toExponential(digits).replace('e+', 'e');
}

function frequency(value) {
  if (value < .001) return value.toExponential().replace('e-', ' × 10⁻').replace(/(10⁻)(\d+)/, (_, a, b) => a + [...b].map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join(''));
  return String(value);
}

function percent(value) {
  const p = value * 100;
  if (p !== 0 && p < .0001) return `${scientific(p, 2)}%`;
  return `${p.toFixed(4)}%`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function show(id, visible) {
  const el = document.getElementById(id);
  if (el) el.hidden = !visible;
}

function validateDataset(data) {
  if (data?.provenance?.revision !== REVISION || !Array.isArray(data.records) || data.records.length !== 90) {
    throw new Error('The saved dataset does not match the expected research revision.');
  }
  const numeric = ['ell', 'M', 'k', 'Tneutral', 'T', 'R', 'transmitted_conversion', 'reflected_conversion', 'flux_error', 'T_match'];
  for (const r of data.records) {
    if (!numeric.every(key => Number.isFinite(r[key])) || r.k <= 0) throw new Error('The saved dataset contains an invalid numerical record.');
  }
  for (const ell of [2, 3, 5]) {
    for (const M of [1, 10, 100]) {
      const rows = data.records.filter(r => r.ell === ell && r.M === M).sort((a, b) => a.k - b.k);
      if (rows.length !== 10 || rows.some((r, i) => r.k !== FREQUENCIES[i])) throw new Error('A saved parameter series is incomplete.');
    }
  }
  return data;
}

export async function initExplorer() {
  const svg = document.getElementById('research-chart');
  const ellSelect = document.getElementById('ell-select');
  const screeningSelect = document.getElementById('screening-select');
  const frequencyInput = document.getElementById('frequency-index');
  const radiusInput = document.getElementById('radius-index');
  const buttons = [...document.querySelectorAll('button[data-view]')];
  if (!svg || !ellSelect || !screeningSelect || !frequencyInput || !radiusInput) {
    throw new Error('The research explorer is missing a required control.');
  }
  let dataset = null;
  let view = 'scattering';
  let loadError = '';
  const mobile = window.matchMedia('(max-width: 640px)');
  let FRAME = DESKTOP_FRAME;
  let viewportWidth = 760;
  const disposers = [];
  const listen = (el, event, fn) => {
    el.addEventListener(event, fn);
    disposers.push(() => el.removeEventListener(event, fn));
  };

  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-roledescription', 'interactive chart');
  svg.setAttribute('aria-labelledby', 'explorer-chart-title explorer-chart-desc');
  frequencyInput.min = '0';
  frequencyInput.max = '9';
  frequencyInput.step = '1';
  radiusInput.min = '0';
  radiusInput.max = '100';
  radiusInput.step = '1';

  function startChart(title, description) {
    svg.replaceChildren(
      node('title', { id: 'explorer-chart-title' }, title),
      node('desc', { id: 'explorer-chart-desc' }, description),
    );
    svg.dataset.chartView = view;
  }

  function label(x, y, text, extra = {}) {
    const t = node('text', {
      x, y, fill: COLORS.text, 'font-family': 'inherit',
      'font-size': mobile.matches ? 14 : 13, ...extra,
    }, text);
    svg.append(t);
    return t;
  }

  function line(x1, y1, x2, y2, extra = {}) {
    const l = node('line', { x1, y1, x2, y2, stroke: COLORS.grid, 'stroke-width': 1, ...extra });
    svg.append(l);
    return l;
  }

  function axes({ xTicks, yTicks, x, y, xTitle, yTitle, yFormat }) {
    for (const value of yTicks) {
      line(FRAME.left, y(value), FRAME.right, y(value));
      label(FRAME.left - 12, y(value) + 4, yFormat(value), { 'text-anchor': 'end' });
    }
    for (const [value, text] of xTicks) {
      line(x(value), FRAME.top, x(value), FRAME.bottom);
      label(x(value), FRAME.bottom + 24, text, { 'text-anchor': 'middle' });
    }
    line(FRAME.left, FRAME.bottom, FRAME.right, FRAME.bottom, { stroke: 'rgba(169,203,194,.3)' });
    label((FRAME.left + FRAME.right) / 2, 328, xTitle, { 'text-anchor': 'middle' });
    label(FRAME.left, 19, yTitle);
  }

  function path(points, color, extra = {}) {
    const d = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(3)} ${y.toFixed(3)}`).join(' ');
    svg.append(node('path', {
      d, fill: 'none', stroke: color, 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra,
    }));
  }

  function renderScattering(restorePointFocus = false) {
    if (!dataset) {
      startChart('Numerical scattering data unavailable', loadError || 'Loading the saved numerical scattering data.');
      label(viewportWidth / 2, 156, loadError ? 'Numerical data could not be loaded.' : 'Loading saved solver results…', { 'text-anchor': 'middle' });
      label(viewportWidth / 2, 184, loadError ? 'Reload the page to try again.' : '90 records · frozen research revision', { 'text-anchor': 'middle', 'font-size': mobile.matches ? 14 : 13 });
      setText('metric-main', '—');
      setText('metric-label', 'Saved numerical results');
      setText('metric-detail', loadError || 'Loading…');
      setText('chart-caption', loadError ? 'The numerical chart is unavailable. No substitute values are shown.' : 'Loading the archived scattering dataset.');
      setText('chart-note', 'The exact resonance view remains available independently of the numerical data.');
      show('flux-breakdown', false);
      return;
    }
    const ell = Number(ellSelect.value);
    const M = Number(screeningSelect.value);
    const rows = dataset.records.filter(r => r.ell === ell && r.M === M).sort((a, b) => a.k - b.k);
    const index = Math.min(9, Math.max(0, Number(frequencyInput.value)));
    const selected = rows[index];
    const values = [...rows.map(r => r.Tneutral), rows[0].T_match];
    const min = Math.min(...values), max = Math.max(...values);
    const spread = Math.max(max - min, 1e-6);
    const lo = Math.max(0, min - spread * .16);
    const hi = Math.min(1, max + spread * .16);
    const decimals = Math.min(7, Math.max(2, Math.ceil(-Math.log10(hi - lo)) + 1));
    const x = k => FRAME.left + (Math.log10(k) + 5) / (Math.log10(.3) + 5) * (FRAME.right - FRAME.left);
    const y = v => FRAME.bottom - (v - lo) / (hi - lo) * (FRAME.bottom - FRAME.top);
    const yTicks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4);
    startChart(
      `Neutral-channel transmission, ell ${ell}, screening M ${M}`,
      `Ten saved solver points on a logarithmic frequency axis. The vertical fraction axis is zoomed. A dotted line shows the unproved threshold matching prediction. Selected k ${selected.k}: neutral transmission ${percent(selected.Tneutral)}. Use the frequency slider or select a point.`,
    );
    axes({
      xTicks: mobile.matches
        ? [[1e-5, '10⁻⁵'], [1e-3, '10⁻³'], [.01, '.01'], [.3, '.3']]
        : [[1e-5, '10⁻⁵'], [1e-4, '10⁻⁴'], [1e-3, '10⁻³'], [.01, '.01'], [.1, '.1'], [.3, '.3']],
      yTicks, x, y, yFormat: v => v.toFixed(decimals),
      xTitle: mobile.matches ? 'Dimensionless k · log scale' : 'Dimensionless frequency k · logarithmic scale',
      yTitle: mobile.matches ? 'Neutral flux · zoomed axis' : 'Neutral flux fraction · zoomed axis',
    });
    line(FRAME.left, y(rows[0].T_match), FRAME.right, y(rows[0].T_match), {
      stroke: COLORS.sand, 'stroke-width': 1.6, 'stroke-dasharray': '3 6',
    });
    const legendX = mobile.matches ? FRAME.left : 448;
    const legendY = mobile.matches ? 45 : 16;
    line(legendX, legendY, legendX + 29, legendY, { stroke: COLORS.sand, 'stroke-width': 1.6, 'stroke-dasharray': '3 6' });
    label(legendX + 37, legendY + 4, 'T_match · prediction', { fill: COLORS.sand });
    path(rows.map(r => [x(r.k), y(r.Tneutral)]), COLORS.mint, { 'stroke-width': 1.5, opacity: .68 });
    line(x(selected.k), FRAME.top, x(selected.k), FRAME.bottom, {
      stroke: 'rgba(168,230,203,.35)', 'stroke-dasharray': '4 5',
    });
    rows.forEach((r, i) => {
      const point = node('g', {
        class: `chart-point${i === index ? ' selected' : ''}`, role: 'button', tabindex: '0',
        'data-point-index': i, 'aria-label': `k ${r.k}, neutral transmission ${percent(r.Tneutral)}`,
        'aria-pressed': String(i === index), cursor: 'pointer',
      });
      point.append(node('circle', { cx: x(r.k), cy: y(r.Tneutral), r: 13, fill: 'transparent' }));
      if (i === index) point.append(node('circle', { cx: x(r.k), cy: y(r.Tneutral), r: 10, fill: 'none', stroke: COLORS.mint, 'stroke-opacity': .28, 'stroke-width': 5 }));
      const dot = node('circle', { cx: x(r.k), cy: y(r.Tneutral), r: i === index ? 5 : 3.7, fill: COLORS.mint, stroke: '#14201e', 'stroke-width': 1.5 });
      point.append(dot);
      point.addEventListener('click', () => { frequencyInput.value = String(i); render(); });
      point.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); frequencyInput.value = String(i); render(true);
        }
      });
      point.addEventListener('focus', () => { dot.setAttribute('stroke', '#ffffff'); dot.setAttribute('stroke-width', '2.5'); });
      point.addEventListener('blur', () => { dot.setAttribute('stroke', '#14201e'); dot.setAttribute('stroke-width', '1.5'); });
      svg.append(point);
    });
    setText('frequency-value', `k = ${frequency(selected.k)}`);
    frequencyInput.setAttribute('aria-valuetext', `Frequency ${selected.k}; neutral transmitted flux ${percent(selected.Tneutral)}`);
    setText('metric-main', percent(selected.Tneutral));
    setText('metric-label', 'Neutral transmitted master flux');
    setText('metric-detail', `ℓ = ${ell} · M = ${M} · saved sample ${index + 1} of 10`);
    setText('chart-caption', 'Dots are computed samples. Thin connecting lines guide the eye; the dotted line is a threshold matching prediction, not a proved limit.');
    setText('chart-note', `The vertical axis is zoomed. Selected flux-closure residual |R + T − 1| = ${scientific(Math.abs(selected.flux_error))}. This diagnostic is not an error bar or a quantum-state fidelity.`);
    const partition = [
      ['flux-neutral-t', selected.Tneutral, COLORS.mint, 'Neutral transmitted'],
      ['flux-other-t', selected.transmitted_conversion, COLORS.cyan, 'Other channels transmitted'],
      ['flux-neutral-r', selected.R - selected.reflected_conversion, COLORS.sand, 'Neutral reflected'],
      ['flux-other-r', selected.reflected_conversion, COLORS.pink, 'Other channels reflected'],
    ];
    const bar = document.getElementById('flux-bar');
    if (bar) {
      bar.replaceChildren();
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', partition.map(([, v, , name]) => `${name}: ${percent(v)}`).join('; '));
    }
    for (const [id, value, color, name] of partition) {
      setText(id, percent(value));
      if (bar) {
        const segment = document.createElement('span');
        segment.style.width = `${Math.max(0, value) * 100}%`;
        segment.style.backgroundColor = color;
        segment.style.flexShrink = '0';
        segment.title = `${name}: ${percent(value)}`;
        segment.setAttribute('aria-hidden', 'true');
        bar.append(segment);
      }
    }
    if (restorePointFocus) svg.querySelector(`[data-point-index="${index}"]`)?.focus();
  }

  function renderResonance() {
    const ell = Number(ellSelect.value), M = Number(screeningSelect.value);
    const L = ell * (ell + 1), mu = Math.sqrt(L - 2);
    const a = Math.sqrt(L + M + 4 * M / (L - 2));
    const valuesAt = z => {
      const r = 1 + Math.exp(z);
      return [-2 * Math.sqrt(M) / (mu * r * a), -Math.sqrt(M) / a, Math.sqrt(L) / a];
    };
    const position = Math.max(0, Math.min(100, Number(radiusInput.value)));
    const z = -6 + 11 * position / 100;
    const r = 1 + Math.exp(z), values = valuesAt(z);
    const x = value => FRAME.left + (value + 6) / 11 * (FRAME.right - FRAME.left);
    const y = value => FRAME.bottom - (value + 1) / 2 * (FRAME.bottom - FRAME.top);
    startChart(
      `Exact zero-energy resonance, ell ${ell}, screening M ${M}`,
      `The three components of u zero divided by the fixed left-endpoint norm a, plotted against log of r minus one. The first component decays as one over r; the second and third are constant. At r ${r.toFixed(4)}, the components are ${values.map(v => v.toFixed(4)).join(', ')}. This bounded solution is not square integrable.`,
    );
    axes({
      xTicks: [[-6, '−6'], [-3, '−3'], [0, '0'], [3, '3'], [5, '5']],
      yTicks: [-1, -.5, 0, .5, 1], x, y, yFormat: v => v.toFixed(1),
      xTitle: mobile.matches ? 'z = log(r − 1) · radius r > 1' : 'z = log(r − 1) · dimensionless radius r > 1',
      yTitle: mobile.matches ? 'Profile u₀(r) / a' : 'Symmetrized profile · u₀(r) / a',
    });
    const colors = [COLORS.mint, COLORS.cyan, COLORS.sand];
    const labels = ['Y₁', 'Y₂', 'Y₃'];
    const samples = Array.from({ length: 221 }, (_, i) => -6 + i * 11 / 220);
    colors.forEach((color, c) => {
      path(samples.map(s => [x(s), y(valuesAt(s)[c])]), color, { 'stroke-width': 2.2 });
      const legendX = (mobile.matches ? FRAME.left : 500) + c * 75;
      const legendY = mobile.matches ? 45 : 16;
      line(legendX, legendY, legendX + 21, legendY, { stroke: color, 'stroke-width': 2 });
      label(legendX + 28, legendY + 4, labels[c], { fill: color });
    });
    line(x(z), FRAME.top, x(z), FRAME.bottom, { stroke: 'rgba(168,230,203,.45)', 'stroke-dasharray': '4 5' });
    values.forEach((value, i) => svg.append(node('circle', { cx: x(z), cy: y(value), r: 4.5, fill: colors[i], stroke: '#14201e', 'stroke-width': 1.5 })));
    setText('radius-value', `r = ${r.toFixed(r < 10 ? 4 : 2)}`);
    radiusInput.setAttribute('aria-valuetext', `Radius ${r.toFixed(4)}, log of r minus one ${z.toFixed(2)}`);
    setText('metric-main', Math.hypot(...values).toFixed(4));
    setText('metric-label', 'Profile norm ‖u₀(r)‖ / a');
    setText('metric-detail', `One fixed normalization: a = ‖u₀(−∞)‖ = ${a.toFixed(4)}`);
    setText('chart-caption', 'Exact profile in the symmetrized Y basis: u₀(r) = (−2√M / (√(L − 2) r), −√M, √L), with L = ℓ(ℓ + 1). Every component uses the same fixed normalization a.');
    setText('chart-note', 'Bounded does not mean localized: two components remain nonzero at infinity. This is a zero-energy resonance, not a normalizable bound state.');
    setText('resonance-g', values[0].toFixed(4));
    setText('resonance-d', values[1].toFixed(4));
    setText('resonance-x', values[2].toFixed(4));
  }

  function render(restorePointFocus = false) {
    FRAME = mobile.matches ? MOBILE_FRAME : DESKTOP_FRAME;
    viewportWidth = mobile.matches ? 400 : 760;
    svg.setAttribute('viewBox', `0 0 ${viewportWidth} 340`);
    frequencyInput.disabled = !dataset;
    svg.setAttribute('aria-busy', String(view === 'scattering' && !dataset && !loadError));
    for (const button of buttons) {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    }
    show('frequency-control', view === 'scattering');
    show('radius-control', view === 'resonance');
    show('flux-breakdown', view === 'scattering' && !!dataset);
    show('resonance-breakdown', view === 'resonance');
    if (view === 'resonance') renderResonance();
    else renderScattering(restorePointFocus);
  }

  listen(ellSelect, 'change', () => render());
  listen(screeningSelect, 'change', () => render());
  listen(frequencyInput, 'input', () => render());
  listen(radiusInput, 'input', () => render());
  for (const button of buttons) {
    listen(button, 'click', () => {
      if (button.dataset.view === 'scattering' || button.dataset.view === 'resonance') {
        view = button.dataset.view;
        render();
      }
    });
    listen(button, 'keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = buttons.indexOf(button);
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[target].focus();
      buttons[target].click();
    });
  }
  listen(mobile, 'change', () => render());
  render();
  try {
    const response = await fetch(new URL('./data/scattering.json', import.meta.url));
    if (!response.ok) throw new Error(`Saved data request failed (HTTP ${response.status}).`);
    dataset = validateDataset(await response.json());
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'The saved dataset could not be read.';
  }
  render();
  return { loaded: !!dataset, recordCount: dataset?.records.length ?? 0, destroy: () => disposers.forEach(dispose => dispose()) };
}
