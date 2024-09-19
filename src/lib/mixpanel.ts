let batchedTrack: Track[] = [];
let batchedEngage: Engage[] = [];
let trackTimeout = 0;
let engageTimeout = 0;

interface Track {
  event: string;
  properties: {
    distinct_id: string;
    token: string;
    [property: string]: any;
  };
}

interface Engage {
  $distinct_id: string;
  $token: string;
  $set_once?: Record<string, any>;
  $set?: Record<string, any>;
  $add?: Record<string, number>;
}

/**
 * Gets the distinct ID from localStorage. If there is not a distinct ID in localStorage,
 * an ID will be created, saved to localStorage, then returned. Subsequent calls to this function
 * will return the same ID
 */
export const getDistinctId = () => {
  let id = localStorage.getItem('mixpanelDistinctId');

  if (!id) {
    id = makeId(64);
    localStorage.setItem('mixpanelDistinctId', id);
  }

  return id;
}

/**
 * Makes a pseudo-random id of the provided length 
 */
const makeId = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}

/**
 * Sends an event to mixpanel
 */
export const track = (event: string, properties?: Record<string, any>) => {
  if (!__MIXPANEL_API_HOST__ || !__MIXPANEL_TOKEN__) return;

  batchedTrack.push({
    event,
    properties: {
      ...properties,
      distinct_id: getDistinctId(),
      token: __MIXPANEL_TOKEN__,
    }
  });

  const flush = () => {
    window.clearTimeout(trackTimeout);
    const data = new Blob([JSON.stringify(batchedTrack)]);
    navigator.sendBeacon(`https://${__MIXPANEL_API_HOST__}/track`, data);
    batchedTrack = [];
  };
  window.clearTimeout(trackTimeout);
  trackTimeout = window.setTimeout(flush, 2000);

  // Flushing if batched events is >= 100
  if (batchedTrack.length >= 100) {
    flush();
    return {flush: () => {}};
  }

  return {flush};
}

/**
 * Sends an engage event to mixpanel
 */
export const engage = (type: 'add' | 'set' | 'set_once', properties?: Record<string, any>) => {
  if (!__MIXPANEL_API_HOST__ || !__MIXPANEL_TOKEN__) return;

  batchedEngage.push({
    $distinct_id: getDistinctId(),
    $token: __MIXPANEL_TOKEN__,
    [`$${type}`]: properties,
  });

  const flush = () => {
    window.clearTimeout(engageTimeout);
    const data = new Blob([JSON.stringify(batchedEngage)]);
    navigator.sendBeacon(`https://${__MIXPANEL_API_HOST__}/engage`, data);
    batchedEngage = [];
  };
  window.clearTimeout(engageTimeout);
  engageTimeout = window.setTimeout(flush, 2000);

  // Flushing if batched events is >= 100
  if (batchedEngage.length >= 100) {
    flush();
    return {flush: () => {}};
  }

  return {flush};
}