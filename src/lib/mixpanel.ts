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

  const data = new Blob([JSON.stringify([{
    event,
    properties: {
      ...properties,
      distinct_id: getDistinctId(),
      token: __MIXPANEL_TOKEN__,
    }
  }])]);
  
  navigator.sendBeacon(`https://${__MIXPANEL_API_HOST__}/track`, data);
}