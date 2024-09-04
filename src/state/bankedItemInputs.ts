import { Item, items, itemsById, pagesById } from '@lib/potions';
import { create } from 'zustand';
import { combine, persist, StorageValue } from 'zustand/middleware';
import { createCustomJSONStorage } from './state';

export interface BankedItemInputsState {
  entries: {item: Item; qty: number, timeAdded: number}[];
}

interface BankedItemInputsJsonState {
  entries: {itemId: number; qty: number, timeAdded: number}[];
}

export const useBankedItemInputs = create(persist(combine({
  entries: [],
} as BankedItemInputsState, (set, get) => ({
  /**
   * Adds qty of item to the state.
   */
  addItem: (itemId: number, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const entries = [...get().entries];
    const idx = entries.findIndex(e => e.item.id === item.id);
    idx === -1
      ? entries.push({item, qty, timeAdded: Date.now()})
      : entries[idx] = {item, qty: entries[idx].qty + qty, timeAdded: Date.now()};

    set({entries});
  },

  /**
   * Sets the absolute quantity of a banked item
   */
  setItemQuantity: (itemId: number, qty: number) => {
    const item = itemsById.get(itemId);
    if (!item) return;

    const entries = [...get().entries];
    const idx = entries.findIndex(e => e.item.id === item.id);
    const entry = {item, qty, timeAdded: Date.now()};
    idx === -1
      ? entries.push(entry)
      : entries[idx] = entry;

    set({entries});
  },

  /**
   * Clears all banked potion inputs from state
   */
  clearItems: () => {
    set({entries: []});
  },
})), createCustomJSONStorage({
  version: 2,
  name: 'banked-items',
  transform: (jsonState): any => {
    const typedStorageValue = jsonState as unknown as StorageValue<BankedItemInputsState>;
    typedStorageValue.state.entries = jsonState.state.entries.reduce((acc, entry) => {
      const item = itemsById.get(entry.itemId);
      if (!item) return acc;

      acc.push({item, qty: entry.qty, timeAdded: entry.timeAdded});
      return acc;
    }, [] as BankedItemInputsState['entries']);
    
    return typedStorageValue;
  },
  migrate: (storageValue: StorageValue<unknown>) => {
    const version = storageValue.version ?? 0;
  
    if (version < 1) {
      console.log('Migrating banked potions to use items instead of pages');
      interface OldBankedItemInputsJsonState {
        items: {[pageId: number]: number};
      }
      interface NewBankedItemInputsJsonState {
        items: {[itemId: number]: number};
      }
  
      const oldTypedState = storageValue.state as OldBankedItemInputsJsonState;
      const newTypedState = storageValue.state as NewBankedItemInputsJsonState;
      newTypedState.items = Object.entries(oldTypedState.items).reduce((acc, [ pageId, doq ]) => {
        const page = pagesById.get(+pageId);
        if (!page) return acc;
  
        const singleDoseItem = page.items.find(i => (!i.doses || i.doses === 1) && !i.isFlask())!;
        acc[singleDoseItem.id] = doq;
  
        return acc;
      }, {} as NewBankedItemInputsJsonState['items']);
    }
  
     // Adding timeAdded to items and moving items to _items
    if (version < 2) {
      console.log('Migrating banked potions use timestamps');
      interface OldBankedItemInputsState {
        items: {[itemId: number]: number};
      }
  
      const oldTypedState = storageValue.state as OldBankedItemInputsState;
      const newTypedState = storageValue.state as BankedItemInputsJsonState;
      newTypedState.entries = Object.entries(oldTypedState.items).map(([ itemId, qty ]) => ({
        itemId: +itemId, qty, timeAdded: Date.now(),
      }));
  
      delete (newTypedState as any).items;
    }
  
    return storageValue as StorageValue<BankedItemInputsJsonState>;
  },
  beforeSave: (value): StorageValue<BankedItemInputsJsonState> => {
    return {
      ...value,
      state: {
        ...value.state,
        entries: value.state.entries.map(e => ({
          itemId: e.item.id,
          qty: e.qty,
          timeAdded: e.timeAdded,
        })),
      },
    };
  },
})));