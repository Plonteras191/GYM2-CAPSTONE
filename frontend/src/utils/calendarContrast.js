const parseColor = (color) => {
  const hex = color?.trim().match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const value = hex[1];
    if (value.length === 3 || value.length === 4) {
      return value.slice(0, 3).split('').map(channel => parseInt(channel + channel, 16));
    }
    if (value.length === 6 || value.length === 8) {
      return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
    }
  }

  const rgb = color?.trim().match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return rgb.slice(1, 4).map(Number);

  return null;
};

const relativeLuminance = (channels) => {
  const [red, green, blue] = channels.map(channel => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const getCalendarEventTextColor = (backgroundColor) => {
  const channels = parseColor(backgroundColor);
  if (!channels) return '#111827';

  const luminance = relativeLuminance(channels);
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? '#111827' : '#ffffff';
};
