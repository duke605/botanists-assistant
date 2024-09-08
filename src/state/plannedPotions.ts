import { Item, itemsById, itemsByName, Page, pagesById } from '@lib/potions';
import { create } from 'zustand';
import { combine, persist, StorageValue } from 'zustand/middleware';
import { createCustomJSONStorage } from './state';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';

export interface PlannedPotionsState {
  potions: Map<number, {page: Page, doq: number}>;
  startingPotions: {page: Page, doq: number}[];
  rawPotions: Map<number, {item: Item, qty: number}>;
  madePotions: Map<number, {page: Page, doq: number}>;
  settings: {recipePaths: {[pageId: number]: string}};
  aggregateByPage: boolean;
}

export interface PlannedPotionsJsonState {
  potions: {[pageId: number]: number};
  startingPotions: {[pageId: number]: number};
  rawPotions: {[itemId: number]: number};
  madePotions: {[pageId: number]: number};
  settings: {recipePaths: {[pageId: number]: string}};
  aggregateByPage: boolean;
}

export const usePlannedPotions = create(persist(combine({
  potions: new Map(),
  rawPotions: new Map(),
  madePotions: new Map(),
  startingPotions: [],
  settings: {recipePaths: {}},
  aggregateByPage: true,
  resolvedPotions: [],
} as PlannedPotionsState, (set, get) => ({
  /**
   * Decrements a potion's dose or quantity from the store. The potion item name
   * is the full name of the potion (Eg. Super antifire (3) or Avantoe potion (unf)).
   */
  decrementPotion: (potionItemName: string, quantity: number) => {
    const item = itemsByName.get(potionItemName.toLowerCase());
    if (!item || !item.isPotion()) return;
    
    const doq = quantity * (item.doses ?? 1);
    const madePotions = new Map(get().madePotions);
    let potions = get().potions;
    
    if (madePotions.has(item.pageId)) {
      const madePotion = {...madePotions.get(item.pageId)!};
      madePotion.doq += doq;
      madePotions.set(item.pageId, madePotion);
    } else {
      const madePotion = {page: item.page, doq};
      madePotions.set(item.pageId, madePotion);
    }
    
    if (potions.has(item.pageId)) {
      potions = new Map(potions);
      const potion = {...potions.get(item.pageId)!};
      potion.doq -= doq;
      potion.doq <= 0
        ? potions.delete(item.pageId)
        : potions.set(item.pageId, potion);
    }

    set({potions, madePotions});
  },
  clearPotions: () => {
    set({potions: new Map(), madePotions: new Map(), rawPotions: new Map()});
  },
  setPotions: (potions: PlannedPotionsState['rawPotions'], settings: PlannedPotionsState['settings']) => {
    // Filtering out non-potion inputs and converting potion inputs to doses (if they use doses)
    const potionDoqs = Array.from(potions.values()).reduce((map, { qty, item }) => {
      if (!item.isPotion()) return map;

      const doq = qty * (item.doses ?? 1);
      return map.set(item.pageId, {page: item.page, doq});
    }, new Map() as PlannedPotionsState['potions']);
    
    set({
      potions: potionDoqs,
      startingPotions: potionDoqs.values().toArray(),
      rawPotions: potions,
      settings,
      madePotions: new Map(),
    });
  },

  /**
   * Sets the aggregate by page setting
   */
  setAggregateByPage: (flag: boolean) => {
    set({aggregateByPage: flag})
  }
})), createCustomJSONStorage({
  name: 'planned-potions',
  version: 2,
  transform: (storageValue: StorageValue<PlannedPotionsJsonState>): any => {
    return <StorageValue<PlannedPotionsState>> {
      ...storageValue,
      state: {
        ...storageValue.state,
        potions: Object.entries(storageValue.state.potions as Record<number, number>).reduce((acc, entry) => {
          const page = pagesById.get(+entry[0]);
          if (!page) return acc;

          return acc.set(page.id, {page, doq: entry[1]});
        }, new Map() as PlannedPotionsState['potions']),
        madePotions: Object.entries(storageValue.state.madePotions as Record<number, number>).reduce((acc, entry) => {
          const page = pagesById.get(+entry[0]);
          if (!page) return acc;

          return acc.set(page.id, {page, doq: entry[1]});
        }, new Map() as PlannedPotionsState['madePotions']),
        rawPotions: Object.entries(storageValue.state.rawPotions as Record<number, number>).reduce((acc, entry) => {
          const item = itemsById.get(+entry[0]);
          if (!item) return acc;

          return acc.set(item.id, {item, qty: entry[1]});
        }, new Map as PlannedPotionsState['rawPotions']),
        startingPotions: Object.entries(storageValue.state.startingPotions).reduce((acc, entry) => {
          const page = pagesById.get(+entry[0]);
          if (!page) return acc;

          return acc.push({page, doq: entry[1]}), acc;
        }, [] as PlannedPotionsState['startingPotions']),
      },
    }
  },
  beforeSave: (value): StorageValue<PlannedPotionsJsonState> => {
    return {
      ...value,
      state: {
        ...value.state,
        potions: value.state.potions.values().reduce((acc, potion) => {
          acc[potion.page.id] = potion.doq;
          return acc;
        }, {}),
        rawPotions: value.state.rawPotions.values().reduce((acc, potion) => {
          acc[potion.item.id] = potion.qty;
          return acc;
        }, {}),
        madePotions: value.state.madePotions.values().reduce((acc, potion) => {
          acc[potion.page.id] = potion.doq;
          return acc;
        }, {}),
        startingPotions: value.state.startingPotions.values().reduce((acc, potion) => {
          acc[potion.page.id] = potion.doq;
          return acc;
        }, {}),
      },
    };
  },
  migrate: (value) => {
    const version = value.version ?? 0;

    if (version < 2) {      
      const currentTypedState = value as StorageValue<PlannedPotionsJsonState>;
      currentTypedState.state.startingPotions = Object.entries(currentTypedState.state.potions).reduce((acc, [ pageId ]) => {
        acc[pageId] += currentTypedState.state.madePotions[pageId] ?? 0;
        return acc;
      }, {...currentTypedState.state.potions});
    }

    return value as any;
  },
})));

const calculateProgress = (
  startingPotions: PlannedPotionsState['startingPotions'],
  madePotions: PlannedPotionsState['madePotions'],
) => {
  let progress = 0;

  for (const { page, doq } of startingPotions) {
    const doqMade = madePotions.get(page.id)?.doq ?? 0;
    progress += Math.min(1, doqMade / doq);
  }

  return progress / startingPotions.length;
}

/**
 * Returns the planned potions resolved into their pages. If results are aggregated
 * by page, potions with dosages are all summed up by page and added to the results.
 * 
 * Eg. If aggregate by page is true and there are 2 Super antifire (4) and 1 Super Antifire (3)
 * planned to be made, then the results will show that there are 11 Super antifire doses to be made
 */
export const useAggregatedPlannedPotions = () => {
  const [ rawPotions, potions, madePotions, aggregateByPage ] = usePlannedPotions(
    useShallow(s => [s.rawPotions, s.potions, s.madePotions, s.aggregateByPage]),
  );

  
  return useMemo(() => {
    if (aggregateByPage) return potions.values().toArray();
    
    const doqInventory = new Map<number, number>();
    for (const { page, doq } of madePotions.values()) {
      doqInventory.set(page.id, doq);
    }

    return rawPotions.values().reduce((potions, { item, qty }) => {
      const madeDoq = doqInventory.get(item.pageId) ?? 0;
      const doqToMake = (item.doses ?? 1) * qty;
      const remainingDoqToMake = Math.max(0, doqToMake - madeDoq);
  
      doqInventory.set(item.pageId, Math.max(madeDoq - doqToMake, 0));
  
      // Adding potion to list of potions to make if the dose or quantity to make is > 0
      if (remainingDoqToMake > 0) {
        potions.push({item, qty: Math.ceil(remainingDoqToMake / (item.doses ?? 1))});
      }

      return potions;
    }, [] as {item: Item, qty: number}[]);
  }, [rawPotions, potions, madePotions, aggregateByPage]);
}

/**
 * Returns the progress of the planned potions as well as the time estimate to complete them
 */
export const usePlannedPotionsProgress = () => {
  const [ madePotions, startingPotions ] = usePlannedPotions(
    useShallow(s => [s.madePotions, s.startingPotions]),
  );

  const progress = useMemo(() => {
    return calculateProgress(startingPotions, madePotions);
  }, [madePotions, startingPotions]);

  return progress;
}