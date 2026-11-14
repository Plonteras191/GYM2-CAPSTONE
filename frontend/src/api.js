import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Automatically attach the Sanctum token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_token');
      localStorage.removeItem('admin_name');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

/*
 * Shared GET requests.
 *
 * Several parts of a page often ask for the same list at the same moment
 * (the Overview, its calendar and the notification bell all want
 * /coach-events; three pages want /members). The local PHP server answers
 * one request at a time, so every duplicate makes the page wait longer.
 * While a plain GET for a URL is still on its way, another call for the same
 * URL waits for that answer instead of sending its own. Each caller gets its
 * own copy of the data, so one caller changing it cannot affect another.
 * Calls with extra options (downloads, params) are sent as usual.
 * A save (any POST, PUT or DELETE) ends the sharing, so a reload after a
 * save always sends a fresh request instead of joining one sent before it.
 */
const inFlightGets = new Map();
const sendGet = api.get.bind(api);
const copyResponse = (response) => ({ ...response, data: structuredClone(response.data) });

api.get = (url, config) => {
  if (config) return sendGet(url, config);
  let request = inFlightGets.get(url);
  if (!request) {
    request = sendGet(url).finally(() => inFlightGets.delete(url));
    inFlightGets.set(url, request);
  }
  return request.then(copyResponse);
};

/*
 * Resolves once no API request has been running for `quietMs`, so background
 * work (the prefetcher) can wait for the current page to finish loading
 * before it queues more requests on the server.
 */
let pendingRequests = 0;
let idleWaiters = [];
const settleIdleWaiters = () => {
  if (pendingRequests > 0) return;
  idleWaiters.forEach((wake) => wake());
  idleWaiters = [];
};

api.interceptors.request.use((config) => {
  pendingRequests += 1;
  if ((config.method || 'get').toLowerCase() !== 'get') inFlightGets.clear();
  return config;
});
api.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    settleIdleWaiters();
    return response;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    settleIdleWaiters();
    return Promise.reject(error);
  }
);

export function whenApiIdle(quietMs = 600) {
  return new Promise((resolve) => {
    const check = () => {
      if (pendingRequests > 0) {
        idleWaiters.push(check);
        return;
      }
      setTimeout(() => (pendingRequests > 0 ? idleWaiters.push(check) : resolve()), quietMs);
    };
    check();
  });
}

/**
 * Resolves after the page has loaded and its API requests have gone quiet,
 * at a moment the browser is idle. Used for work that can wait (the
 * notification bell, prefetching other pages) so it does not queue in front
 * of what the person is looking at. Never waits longer than `maxWaitMs`,
 * so a page that keeps polling cannot hold that work back for good.
 */
export function whenPageSettled(quietMs = 600, maxWaitMs = 10000) {
  const loaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((done) => window.addEventListener('load', done, { once: true }));
  const settled = loaded
    .then(() => whenApiIdle(quietMs))
    .then(() => new Promise((resolve) => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
      else setTimeout(resolve, 0);
    }));
  const limit = new Promise((resolve) => setTimeout(resolve, maxWaitMs));
  return Promise.race([settled, limit]);
}

export default api;