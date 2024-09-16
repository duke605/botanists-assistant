import { create } from 'zustand';
import { combine, persist, StorageValue } from 'zustand/middleware';
import { createCustomJSONStorage } from './state';
import { Item } from '@lib/potions';

export interface ItemPricesState {
  itemPrices: Map<string, number>;
  pinnedItems: Set<string>;
  lastUpdated: number;
  fetching: boolean;
}

interface ItemPricesJsonState {
  itemPrices: {[itemName: string]: number};
  pinnedItems: string[];
  lastUpdated: number;
}

/**
 * Converts the object to a map where the item name is the key. Ignores items
 * that start and end with % (These are metadata entries). Names of items are
 * lower cased
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
  pinnedItems: new Set(),
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
      const oldItemPrices = get().itemPrices;

      const itemPrices = convertToMap(response);

      // Setting the price of the pinned items to the old values
      let reinitializedPinnedItems = false;
      let pinnedItems = get().pinnedItems;
      for (const pinnedItem of pinnedItems) {
        const oldPrice = oldItemPrices.get(pinnedItem);

        // Deleting the pin if there is no price for the item. Should never happen but just in case
        if (oldPrice === undefined) {
          pinnedItems = !reinitializedPinnedItems ? new Set(pinnedItem) : pinnedItems;
          reinitializedPinnedItems = true;
          pinnedItems.delete(pinnedItem);
          continue;
        }

        itemPrices.set(pinnedItem, oldPrice);
      }

      set({lastUpdated, itemPrices, pinnedItems});

      return itemPrices;
    } finally {
      set({fetching: false});
    }
  },

  /**
   * Sets the price of an item. Pin indicates if the price should be updated or not when
   * item prices are fetched. If pin is true, the price of the item will not be updated.
   */
  setItemPrice(itemName: string, price: number, pin = false) {
    itemName = itemName.toLowerCase();
    let { pinnedItems, itemPrices } = get();

    if (pinnedItems.has(itemName) !== pin) {
      pinnedItems = new Set(pinnedItems);
      pin ? pinnedItems.add(itemName) : pinnedItems.delete(itemName);
    }

    if (itemPrices.get(itemName) !== price) {
      itemPrices = new Map(itemPrices);
      itemPrices.set(itemName, price);
    }

    set({pinnedItems, itemPrices}); 
  },

  /**
   * @returns true if the item's price is pinned, false otherwise
   */
  isItemPinned(item: Item) {
    const itemName = item.name.toLowerCase();

    return get().pinnedItems.has(itemName);
  },

  /**
   * Gets the price of an item. If there is no GE price for the item then undefined is returned
   */
  getPriceForItem(item: Item) {
    const { itemPrices } = get();
    return itemPrices.get(item.name.toLowerCase());
  },
})), createCustomJSONStorage({
  version: 1,
  name: 'item-prices',
  transform: (jsonState: StorageValue<ItemPricesJsonState>): any => {
    const typedStorageValue = jsonState as unknown as StorageValue<ItemPricesState>;
    typedStorageValue.state.itemPrices = convertToMap(jsonState.state.itemPrices);
    typedStorageValue.state.pinnedItems = new Set(jsonState.state.pinnedItems ?? []);
    
    return typedStorageValue;
  },
  beforeSave: (value): StorageValue<ItemPricesJsonState> => {
    return {
      ...value,
      state: {
        ...value.state,
        ...{fetching: undefined},
        itemPrices: convertToObject(value.state.itemPrices),
        pinnedItems: value.state.pinnedItems.values().toArray(),
      },
    };
  },
})));