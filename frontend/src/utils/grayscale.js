/**
 * Muscle Bros is black and white only. Calendar colours that were saved
 * before the switch (packages, coach-event categories) are still stored as
 * colours, so they are shown as the grey of the same brightness.
 */

/** The shades offered when picking a calendar colour, darkest first. */
export const GRAY_SHADES = ['#1A1A1A', '#3D3D3D', '#616161', '#858585', '#ABABAB', '#D1D1D1'];

const toLinear = (channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const toChannel = (linear) => {
  const v = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/** Returns the grey with the same relative luminance as a hex colour. Anything else is returned unchanged. */
export function toGray(color) {
  if (typeof color !== 'string') return color;
  const match = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return color;
  const hex = match[1].length === 3 ? match[1].replace(/./g, ch => ch + ch) : match[1];
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  const grey = toChannel(0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b));
  return `#${grey.toString(16).padStart(2, '0').repeat(3)}`;
}
