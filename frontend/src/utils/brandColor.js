/**
 * Muscle Bros uses black, white and cyan. Calendar colours saved before the
 * switch (packages, coach-event categories) are still stored as any colour,
 * so they are shown as the cyan of the same brightness: dark colours become
 * deep cyan, light colours become pale cyan, and text contrast is unchanged.
 */

/** The shades offered when picking a calendar colour. */
export const CALENDAR_SHADES = ['#0A0A0A', '#164E63', '#0891B2', '#22D3EE', '#A5F3FC', '#D4D4D4'];
export const CALENDAR_SHADE_NAMES = ['Black', 'Deep cyan', 'Cyan', 'Bright cyan', 'Pale cyan', 'Silver'];

const CYAN_HUE = 189 / 360;
const CYAN_SATURATION = 0.9;

const toLinear = (channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

const hueToRgb = (p, q, t) => {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
};

const cyanAtLightness = (l) => {
  const q = l < 0.5 ? l * (1 + CYAN_SATURATION) : l + CYAN_SATURATION - l * CYAN_SATURATION;
  const p = 2 * l - q;
  return [hueToRgb(p, q, CYAN_HUE + 1 / 3), hueToRgb(p, q, CYAN_HUE), hueToRgb(p, q, CYAN_HUE - 1 / 3)]
    .map(v => Math.round(v * 255));
};

const toHex = (rgb) => `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;

/**
 * Returns a palette-safe version of a hex colour: shades from the palette are
 * kept as they are, anything else becomes the cyan of the same brightness.
 * Values that are not hex colours (CSS variables, undefined) pass through.
 */
export function toBrandColor(color) {
  if (typeof color !== 'string') return color;
  const match = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return color;
  const hex = match[1].length === 3 ? match[1].replace(/./g, ch => ch + ch) : match[1];
  if (CALENDAR_SHADES.some(shade => shade.slice(1).toLowerCase() === hex.toLowerCase())) return `#${hex}`;

  const target = luminance([0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)));
  let low = 0;
  let high = 1;
  for (let step = 0; step < 30; step += 1) {
    const mid = (low + high) / 2;
    if (luminance(cyanAtLightness(mid)) < target) low = mid;
    else high = mid;
  }
  return toHex(cyanAtLightness((low + high) / 2));
}
