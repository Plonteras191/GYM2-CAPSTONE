import { aiEngineFetch } from '../../utils/aiEngine';

// The Python engine checks each enrollment photo with the same face detector
// it later uses to read it (face found, size, brightness, sharpness, head
// angle). If the engine cannot be reached, a basic brightness and sharpness
// check runs here instead, so enrollment is never blocked.

const ENGINE_TIMEOUT_MS = 6000;
// Same limits as Gesture Engine/enrollment_quality.py.
const BRIGHTNESS_MIN = 60;
const BRIGHTNESS_MAX = 220;
const SHARPNESS_MIN = 50;

const LOCAL_MESSAGES = {
  too_dark: 'Too dark. Face a light or a window; avoid light from behind.',
  too_bright: 'Too bright. Move away from the direct light.',
  blurry: 'Photo is blurry. Hold still and try again.',
};

/**
 * Check one face photo.
 * Returns { ok, messages: string[], turn: number|null, offline: boolean }.
 */
export async function checkFacePhoto(dataUrl, viewLabel, oppositeTurn = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
  try {
    const response = await aiEngineFetch('/check_enrollment_view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, view: viewLabel, opposite_turn: oppositeTurn }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Engine check failed (${response.status})`);
    const result = await response.json();
    return {
      ok: Boolean(result.ok),
      messages: (result.issues || []).map(issue => issue.message),
      turn: result.metrics?.turn ?? null,
      offline: false,
    };
  } catch {
    return localCheck(dataUrl);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Compare the new face photos with every enrolled member.
 * Returns { matches: [{ member_id, name, distance, level }], offline }.
 * level is 'likely_same' (the camera may mistake one for the other) or
 * 'similar'. excludeMemberId skips the member being edited.
 */
export async function findLookAlikes(photos, excludeMemberId = null) {
  const controller = new AbortController();
  // Encoding the photos takes a few seconds on the gym laptop.
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await aiEngineFetch('/check_enrollment_duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: photos, exclude_member_id: excludeMemberId }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Duplicate check failed (${response.status})`);
    const result = await response.json();
    return { matches: result.matches || [], offline: false };
  } catch {
    return { matches: [], offline: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Brightness and sharpness of the centre of the photo, measured in the browser. */
async function localCheck(dataUrl) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  }).catch(() => null);

  const base = { turn: null, offline: true };
  if (!image) return { ...base, ok: true, messages: [] };

  // The face is near the centre of the square photo: measure the middle 60%,
  // scaled to 100 px tall like the engine does.
  const size = 100;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { ...base, ok: true, messages: [] };
  const crop = Math.min(image.width, image.height) * 0.6;
  context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  const gray = new Float32Array(size * size);
  let sum = 0;
  for (let i = 0; i < gray.length; i += 1) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    sum += gray[i];
  }
  const brightness = sum / gray.length;

  // Variance of the Laplacian (higher = sharper).
  const laplacian = [];
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      const i = y * size + x;
      laplacian.push(gray[i - 1] + gray[i + 1] + gray[i - size] + gray[i + size] - 4 * gray[i]);
    }
  }
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const sharpness = laplacian.reduce((a, b) => a + (b - mean) ** 2, 0) / laplacian.length;

  const messages = [];
  if (brightness < BRIGHTNESS_MIN) messages.push(LOCAL_MESSAGES.too_dark);
  else if (brightness > BRIGHTNESS_MAX) messages.push(LOCAL_MESSAGES.too_bright);
  else if (sharpness < SHARPNESS_MIN) messages.push(LOCAL_MESSAGES.blurry);
  return { ...base, ok: messages.length === 0, messages };
}
