import { create } from 'zustand';
import { combine, persist, StorageValue } from 'zustand/middleware';
import { createCustomJSONStorage } from './state';
import { Item } from '@lib/potions';

export interface ItemPricesState {
  itemPrices: Map<string, number>;
  lastUpdated: number;
  fetching: boolean;
}

interface ItemPricesJsonState {
  itemPrices: {[itemName: string]: number};
  lastUpdated: number;
}

/**
 * Converts the object to a map where the item name is the key. Ignores items
 * that start and end with % (These are metadata entries). Names of items are
 * lower cased
 * 
 * @param json 
 */
const convertToMap = (json: {[itemName: string]: number}) => {
  const map = new Map<string, number>();

  for (const [ name, value ] of Object.entries(json)) {
    if (name.startsWith('%') && name.endsWith('%')) continue;
    if (isNaN(value)) continue;

    map.set(name.toLowerCase(), value);
  }

  return map;
}

/**
 * Converts a map of item prices to an object
 */
const convertToObject = (map: Map<string, number>) => {
  const obj = {} as Record<string, number>;

  for (const [ name, value ] of map.entries()) {
    obj[name] = value;
  }

  return obj;
}

export const useItemPrices = create(persist(combine({
  itemPrices: new Map(),
  lastUpdated: 0,
  fetching: false,
} as ItemPricesState, (set, get) => ({
  /**
   * Fetches the GE prices of items. If item prices have not been updated since last
   * fetch the state will not be updated.
   * 
   * @returns item prices
   */
  async fetchPrices() {
    set({fetching: true});
    const url = new URL('https://runescape.wiki');
    url.search = new URLSearchParams({
      title: 'Module:GEPrices/data.json',
      action: 'raw',
      ctype: 'application/json',
    }).toString();

    try {
      const response = await fetch(url).then(r => r.json());
      const lastUpdated = response['%LAST_UPDATE%'];

      // Checking if there has been an update since last time. If not returning to save compute
      console.log(lastUpdated);
      if (lastUpdated === get().lastUpdated) return get().itemPrices;

      const itemPrices = convertToMap(response);
      console.log(itemPrices);
      set({lastUpdated, itemPrices});

      return itemPrices;
    } finally {
      set({fetching: false});
    }
  },

  /**
   * Gets the price of an item. If the item is not found undefined is returned
   */
  getPriceForItem(item: Item) {
    return get().itemPrices.get(item.name.toLowerCase());
  }
})), createCustomJSONStorage({
  version: 1,
  name: 'item-prices',
  transform: (jsonState: StorageValue<ItemPricesJsonState>): any => {
    const typedStorageValue = jsonState as unknown as StorageValue<ItemPricesState>;
    typedStorageValue.state.itemPrices = convertToMap(jsonState.state.itemPrices);
    
    return typedStorageValue;
  },
  beforeSave: (value): StorageValue<ItemPricesJsonState> => {
    return {
      ...value,
      state: {
        ...value.state,
        ...{fetching: undefined},
        itemPrices: convertToObject(value.state.itemPrices),
      },
    };
  },
})));