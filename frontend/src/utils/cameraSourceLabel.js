export function getCameraSourceLabel(source) {
  if (source === 'cctv') return 'CCTV 1';
  if (source.startsWith('cctv_')) return `CCTV ${source.slice(5)}`;
  return source.toUpperCase();
}
