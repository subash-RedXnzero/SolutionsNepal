/**
 * SolutionsNepal — Weather UI renderers + icon set.
 *
 * Pure string-building functions with zero DOM access, so the SAME code renders
 * the page on the server (Astro frontmatter) and re-renders it in the browser
 * when the user switches city. Swapping in a live API later changes only
 * weather.js — these renderers stay.
 *
 * Icon colors are NOT hardcoded here: shapes carry semantic classes
 * (.wx-sun / .wx-cloud / .wx-drop) that the page stylesheet maps to CSS
 * variables, so the whole set re-themes in dark mode.
 */

/* ── Condition icons ──────────────────────────────────────────
   One coherent set: 2px rounded strokes, shared cloud shape,
   a single sun disc. Nothing cartoonish, nothing emoji.       */
const cloudPath = 'M7 18h9.5a3.7 3.7 0 0 0 .6-7.36A5.5 5.5 0 0 0 6.4 9.6 4.2 4.2 0 0 0 7 18Z';

const sunCore = (cx = 12, cy = 11, r = 3.4) =>
  `<circle class="wx-sun" cx="${cx}" cy="${cy}" r="${r}" stroke-width="2" fill="none"/>`;

const rays = (cx = 12, cy = 11, r1 = 6.2, r2 = 8.4) => {
  let out = '';
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const x1 = (cx + Math.cos(a) * r1).toFixed(2), y1 = (cy + Math.sin(a) * r1).toFixed(2);
    const x2 = (cx + Math.cos(a) * r2).toFixed(2), y2 = (cy + Math.sin(a) * r2).toFixed(2);
    out += `<line class="wx-sun" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return out;
};

const cloudShape = (dy = 0, dim = false) =>
  `<path class="wx-cloud${dim ? ' dim' : ''}" d="${cloudPath}"${dy ? ` transform="translate(0 ${dy})"` : ''} stroke-width="${dim ? 1.6 : 2}" stroke-linejoin="round" fill="none"/>`;

const drops = (n = 2, x0 = 9, dy = 0) => {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 5;
    out += `<line class="wx-drop" x1="${x}" y1="${19 + dy}" x2="${x - 1.4}" y2="${22.5 + dy}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return out;
};

const bolt = `<path class="wx-sun" d="M12.6 15.5 10.4 19h2.2l-1.2 3.2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

const ICONS = {
  clear:   () => sunCore() + rays(),
  partly:  () => sunCore(10.5, 9, 3) + rays(10.5, 9, 5.6, 7.6) + cloudShape(2),
  cloudy:  () => cloudShape() + cloudShape(-3.4, true),
  rain:    () => cloudShape() + drops(3, 8.4),
  drizzle: () => cloudShape() + drops(2, 9.6),
  storm:   () => cloudShape() + bolt,
  night:   () => `<path class="wx-sun" d="M15.5 13.5A6.2 6.2 0 0 1 9 5.4a6.4 6.4 0 1 0 6.5 8.1Z" stroke-width="2" stroke-linejoin="round" fill="none"/>`,
};

/** Icon for a condition key at a given size. */
export function wxIcon(kind, size = 28, cls = '') {
  const draw = ICONS[kind] || ICONS.cloudy;
  return `<svg class="wx-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 28" fill="none" aria-hidden="true">${draw()}</svg>`;
}

/* ── Inline stroke icons for detail cells (24×24 grid, currentColor) ── */
export const UI_ICONS = {
  thermo:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0Z"/><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none"/></svg>`,
  drop:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5S6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-6-10.5-6-10.5Z"/></svg>`,
  wind:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h9.5a2.5 2.5 0 1 0-2.4-3.2"/><path d="M3 12.5h13.5a2.7 2.7 0 1 1-2.6 3.4"/><path d="M3 17h6"/></svg>`,
  compass: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z" fill="currentColor" stroke="none"/></svg>`,
  eye:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
  cloud:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M7 18h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18Z"/></svg>`,
  sun:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>`,
  rain:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10a4 4 0 0 0 .8-7.92A6 6 0 0 0 6.1 6.2 4.5 4.5 0 0 0 7 15Z"/><path d="m9 18-1 2.5M13 18l-1 2.5M17 18l-1 2.5"/></svg>`,
  sunrise: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v3M5.6 8.6 7 10M18.4 8.6 17 10M3 15h2M19 15h2M7 15a5 5 0 0 1 10 0"/><path d="M3 19h18"/></svg>`,
  sunset:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 7V4M5.6 8.6 7 10M18.4 8.6 17 10M3 15h2M19 15h2M7 15a5 5 0 0 1 10 0"/><path d="M8 20l4-3 4 3"/></svg>`,
};

/* ── Descriptor helpers (display logic for detail subs) ── */
export function windCompass(deg) {
  const pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return pts[Math.round(deg / 22.5) % 16];
}
const humidityWord = h => h < 40 ? 'Dry air' : h < 60 ? 'Comfortable' : h < 75 ? 'Humid' : 'Very humid';
const beaufort = k => k < 2 ? 'Calm' : k < 12 ? 'Light breeze' : k < 20 ? 'Gentle breeze' : k < 29 ? 'Moderate breeze' : k < 39 ? 'Fresh breeze' : 'Strong wind';
const visWord = v => v < 4 ? 'Poor' : v < 8 ? 'Moderate' : v < 13 ? 'Good' : 'Excellent';
const cloudWord = c => c < 11 ? 'Clear sky' : c < 31 ? 'Mostly clear' : c < 61 ? 'Partly cloudy' : c < 91 ? 'Mostly cloudy' : 'Overcast';
const uvWord = u => u < 3 ? 'Low' : u < 6 ? 'Moderate' : u < 8 ? 'High' : u < 11 ? 'Very high' : 'Extreme';

/* ── Current weather panel (left identity / right compact stats) ── */
function statBlock(icon, label, value) {
  return `
  <div class="wxc-stat">
    <span class="wxc-stat-ico" aria-hidden="true">${UI_ICONS[icon]}</span>
    <span class="wxc-stat-label">${label}</span>
    <span class="wxc-stat-value">${value}</span>
  </div>`;
}

export function currentPanel(d) {
  const t = d.today;
  return `
  <div class="wxc">
    <div class="wxc-left">
      <span class="wxc-today">Today</span>
      <div class="wxc-hero-row">
        <div class="wxc-icon">${wxIcon(t.isDay ? t.cond.k : 'night', 84)}</div>
        <div class="wxc-temp">${t.temp}<span class="wxc-deg">°C</span></div>
      </div>
      <div class="wxc-cond">${t.cond.label}</div>
      <div class="wxc-feels">Feels like ${t.feels}°C</div>
    </div>
    <div class="wxc-right">
      <div class="wxc-grid">
        ${statBlock('drop', 'Humidity', t.humidity + '%')}
        ${statBlock('wind', 'Wind', t.wind + ' km/h')}
        ${statBlock('rain', 'Rain Chance', t.rain + '%')}
        ${statBlock('cloud', 'Cloud Cover', t.cloud + '%')}
      </div>
    </div>
  </div>
  ${sunArc(t.sunriseLabel, t.sunsetLabel, t.dayFrac, t.isDay)}`;
}

/* ── Weather details: 8 compact cells ── */
export function detailsGrid(d) {
  const t = d.today;
  const cells = [
    { icon: 'thermo',  label: 'Temperature',    value: t.temp + '°C',    sub: 'Feels like ' + t.feels + '°C' },
    { icon: 'drop',    label: 'Humidity',       value: t.humidity + '%', sub: humidityWord(t.humidity) },
    { icon: 'wind',    label: 'Wind Speed',     value: t.wind + ' km/h', sub: beaufort(t.wind) },
    { icon: 'compass', label: 'Wind Direction', value: windCompass(t.windDir), sub: t.windDir + '° bearing' },
    { icon: 'eye',     label: 'Visibility',     value: t.vis + ' km',    sub: visWord(t.vis) },
    { icon: 'cloud',   label: 'Cloud Cover',    value: t.cloud + '%',    sub: cloudWord(t.cloud) },
    { icon: 'sun',     label: 'UV Index',       value: String(t.uv),     sub: uvWord(t.uv) },
    { icon: 'rain',    label: 'Precipitation',  value: t.rainMm + ' mm', sub: t.rain + '% chance today' },
  ];
  return `<div class="wxd-grid">${cells.map(c => detailCell(c)).join('')}</div>`;
}

/* ── Small helper: one detail cell (label / value / sub) ── */
export function detailCell({ icon, label, value, sub }) {
  return `
  <div class="wxd-cell">
    <div class="wxd-head">
      <span class="wxd-ico" aria-hidden="true">${UI_ICONS[icon]}</span>
      <span class="wxd-label">${label}</span>
    </div>
    <div class="wxd-value">${value}</div>
    ${sub ? `<div class="wxd-sub">${sub}</div>` : ''}
  </div>`;
}

/* ── Day-name / date formatting ── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function fmtDayDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/* ── Hourly strip: drawn temperature curve through hour blocks ──
   The signature detail of the page. A single SVG polyline threads
   BEHIND the hour columns, plotting each hour's temperature.      */
export function hourlyStrip(hours) {
  const temps = hours.map(h => h.temp);
  const min = Math.min(...temps), max = Math.max(...temps);
  const range = max - min || 1;

  const COL = 92;            // column width, must match CSS
  const PAD = 34;            // top room for the curve peak
  const H = 128;             // strip height
  const width = COL * hours.length;
  const yFor = t => PAD + (1 - (t - min) / range) * 34 + 8;

  const pts = temps.map((t, i) => `${(i * COL + COL / 2).toFixed(1)},${yFor(t).toFixed(1)}`);
  const line = `M${pts.join(' L')}`;
  const area = `${line} L${width - COL / 2},${H} L${COL / 2},${H} Z`;

  const blocks = hours.map((h, i) => `
    <div class="wxh-col${h.now ? ' now' : ''}">
      <div class="wxh-hour">${h.now ? 'Now' : h.label}</div>
      <div class="wxh-icon">${wxIcon(h.cond.k, 26)}</div>
      <div class="wxh-temp">${h.temp}°</div>
      <div class="wxh-rain${h.rainPct >= 40 ? ' high' : ''}">${h.rainPct >= 15 ? h.rainPct + '%' : ''}</div>
    </div>`).join('');

  return `
  <div class="wxh">
    <svg class="wxh-curve" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" aria-hidden="true">
      <path class="wxh-area" d="${area}"></path>
      <path class="wxh-line" d="${line}"></path>
      ${temps.map((t, i) => `<circle class="wxh-dot" cx="${(i * COL + COL / 2).toFixed(1)}" cy="${yFor(t).toFixed(1)}" r="2.6"></circle>`).join('')}
    </svg>
    <div class="wxh-cols">${blocks}</div>
  </div>`;
}

/* ── 7-day rows with temperature range bars ── */
export function dailyRows(daily) {
  const lo = Math.min(...daily.map(d => d.lo));
  const hi = Math.max(...daily.map(d => d.hi));
  const span = hi - lo || 1;

  return daily.map(d => {
    const left = ((d.lo - lo) / span) * 100;
    const w = Math.max(9, ((d.hi - d.lo) / span) * 100);
    const warm = d.hi >= 28;
    return `
    <div class="wxd7-row${d.dayName === 'Today' ? ' today' : ''}">
      <span class="wxd7-day">${d.dayName}</span>
      <span class="wxd7-icon" title="${d.cond.label}">${wxIcon(d.cond.k, 24)}</span>
      <span class="wxd7-rain">${d.rainPct >= 20 ? d.rainPct + '%' : ''}</span>
      <span class="wxd7-lo">${d.lo}°</span>
      <span class="wxd7-track"><span class="wxd7-bar${warm ? ' warm' : ''}" style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}%"></span></span>
      <span class="wxd7-hi">${d.hi}°</span>
    </div>`;
  }).join('');
}

/* ── Sun-arc: daylight progress between sunrise & sunset ── */
export function sunArc(sunriseLabel, sunsetLabel, dayFrac, isDay) {
  const W = 220, H = 92, R = 78;
  const cx = W / 2, cy = H - 8;
  const a = Math.PI * (1 - dayFrac);
  const sx = cx + Math.cos(a) * R, sy = cy - Math.sin(a) * R;
  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  return `
  <div class="wxsun">
    <svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path class="wxsun-arc" d="${arc}"></path>
      ${isDay ? `<circle class="wxsun-dot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="6"></circle>
      <circle class="wxsun-halo" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="10"></circle>` : ''}
    </svg>
    <div class="wxsun-times">
      <span class="wxsun-t"><span class="wxsun-ico" aria-hidden="true">${UI_ICONS.sunrise}</span>Sunrise <b>${sunriseLabel}</b></span>
      <span class="wxsun-cap">${isDay ? 'Daylight' : 'Night'}</span>
      <span class="wxsun-t right"><span class="wxsun-ico" aria-hidden="true">${UI_ICONS.sunset}</span>Sunset <b>${sunsetLabel}</b></span>
    </div>
  </div>`;
}

/* ── AQI card: value, band, PM particles, horizontal scale ── */
export function aqiCard(a) {
  return `
  <div class="wxq">
    <div class="wxq-head">
      <div class="wxq-main">
        <span class="wxq-value">${a.value}</span>
        <div class="wxq-bandwrap">
          <span class="wxq-band b-${a.tone}">${a.label}</span>
          <span class="wxq-scale-label">Air Quality Index</span>
        </div>
      </div>
      <div class="wxq-pm">
        <span class="wxq-pm-item"><b>PM2.5</b>${a.pm25}</span>
        <span class="wxq-pm-item"><b>PM10</b>${a.pm10}</span>
      </div>
    </div>
    ${aqiScale(a.value)}
    <p class="wxq-advice">${a.advice}</p>
  </div>`;
}

/* ── AQI scale marker: 4 muted bands, pin at current value ── */
export function aqiScale(aqi) {
  const max = 200;
  const pct = Math.min(100, (aqi / max) * 100);
  return `
  <div class="wxq-scale" role="img" aria-label="Air quality index ${aqi} on a scale from 0 to 200">
    <div class="wxq-track">
      <span class="wxq-seg s0"></span><span class="wxq-seg s1"></span><span class="wxq-seg s2"></span><span class="wxq-seg s3"></span>
      <span class="wxq-pin" style="left:${pct.toFixed(1)}%"></span>
    </div>
    <div class="wxq-marks"><span>0</span><span>50</span><span>100</span><span>150</span><span>200</span></div>
  </div>`;
}

/* ── Popular cities grid ── */
export function cityGrid(snaps, activeId) {
  return snaps.map(s => `
    <a href="/weather?city=${s.city.id}" class="wxct${s.city.id === activeId ? ' active' : ''}" data-city="${s.city.id}"${s.city.id === activeId ? ' aria-current="true"' : ''}>
      <span class="wxct-top">${wxIcon(s.cond.k, 24)}<b class="wxct-temp">${s.temp}°</b></span>
      <span class="wxct-name">${s.city.name}</span>
      <span class="wxct-cond">${s.cond.label}</span>
    </a>`).join('');
}
