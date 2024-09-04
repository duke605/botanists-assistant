import { create } from 'zustand';
import { persist, createJSONStorage, combine, StorageValue } from 'zustand/middleware';
import { Item, itemsById, itemsByName, Page, pagesById } from '@lib/potions';

export interface PlannedPotionsState {
  potions: Map<number, {page: Page, doq: number}>;
  rawPotions: Map<number, {item: Item, qty: number}>;
  madePotions: Map<number, {page: Page, doq: number}>;
  settings: {recipePaths: {[pageId: number]: string}},
  aggregateByPage: boolean,
}

export const usePlannedPotions = create(persist(combine({
  potions: new Map(),
  rawPotions: new Map(),
  madePotions: new Map(),
  settings: {recipePaths: {}},
  aggregateByPage: true,
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
      rawPotions: potions,
      settings,
      madePotions: new Map(),
    });
  },

  /**
   * Returns the planned potions resolved into their pages. If results are aggregated
   * by page, potions with dosages are all summed up by page and added to the results.
   * 
   * Eg. If aggregate by page is true and there are 2 Super antifire (4) and 1 Super Antifire (3)
   * planned to be made, then the results will show that there are 11 Super antifire doses to be made
   */
  // getResolvedItems: (aggregateByPage?: boolean) => {
  //   aggregateByPage ??= get().aggregateByPage;
  //   if (aggregateByPage) return Object.entries(get().potions).map(([ pageId, doq ]) => {
  //     const page = pagesById.get(+pageId);
  //     if (!page) return;

  //     return {page, doq};
  //   }).filter(p => p) as {page: Page, doq: number}[];

  //   const doqInventory = {...get().madePotions};
  //   return Object.entries(get().rawPotions).map(([ itemId, qty ]) => {
  //     const item = itemsById.get(+itemId);
  //     if (!item) return;

  //     doqInventory[item.pageId] ??= 0;
  //     const madeDoq = doqInventory[item.pageId];
  //     const doqToMake = (item.doses ?? 1) * qty;
  //     const remainingDoqToMake = Math.max(0, doqToMake - madeDoq);

  //     doqInventory[item.id] = Math.max(madeDoq - doqToMake, 0);
  //     qty = remainingDoqToMake / (item.doses ?? 1);

  //     return {item, qty};
  //   }).filter(p => p) as {item: Item, qty: number}[];
  // },

  /**
   * Sets the aggregate by page setting
   */
  setAggregateByPage: (flag: boolean) => {
    set({aggregateByPage: flag})
  }
})), {
  name: 'planned-potions',
  version: 1,
  migrate: s => s as any,
  storage: {
    removeItem: name => localStorage.removeItem(name),
    setItem: (name, value: StorageValue<PlannedPotionsState>) => {
      const state = {
        ...value.state,
        potions: Array.from(value.state.potions.values()).reduce((acc, potion) => {
          acc[potion.page.id] = potion.doq;
          return acc;
        }, {}),
        rawPotions: Array.from(value.state.rawPotions.values()).reduce((acc, potion) => {
          acc[potion.item.id] = potion.qty;
          return acc;
        }, {}),
        madePotions: Array.from(value.state.madePotions.values()).reduce((acc, potion) => {
          acc[potion.page.id] = potion.doq;
          return acc;
        }, {}),
      }

      localStorage.setItem(name, JSON.stringify({...value, state}));
    },
    getItem: name => {
      const item = localStorage.getItem(name);
      if (!item) return null;

      const storageValue = JSON.parse(item) as StorageValue<any>; 
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
        },
      };
    }
  },
}));

const initialPotionPlannerState = {
  targetPotion: -1,
  recipePaths: {} as {[pageId: number]: string},
  useInventory: false,
  well: false,
  modifiedBotanistMask: false,
  botanistsNecklace: false,
  envenomed: false,
  factoryOutfit: false,
  underworldGrimoire: 0,
  broochOfTheGods: false,
  desertAmulet: false,
  scrollOfCleansing: false,
  morytaniaLegs: false,
};
type SetOptionsKeys = Exclude<keyof typeof initialPotionPlannerState, 'recipePaths'>;
export type PotionPlannerState = typeof initialPotionPlannerState;
export const usePotionPlanner = create(persist(combine(initialPotionPlannerState, (set, get) => ({
  clear: () => set(initialPotionPlannerState),
  setOption: <T extends SetOptionsKeys,>(option: T, value: typeof initialPotionPlannerState[T]) => {
    const otherOptions = {} as Partial<typeof initialPotionPlannerState>;
    const newOptions = {...otherOptions, [option]: value};

    // Turning off BotG when well is turned off
    if (option === 'well' && !value) {
      newOptions['broochOfTheGods'] = false;
    }

    set(newOptions);
  },
  setRecipePath: (pageId: number, recipeName: string) => {
    set({
      recipePaths: {
        ...get().recipePaths,
        [pageId]: recipeName,
      },
    });
  }
})), {
  name: 'potions-planner',
  storage: createJSONStorage(() => localStorage),
}));