import { create } from 'zustand';
import { persist, createJSONStorage, combine } from 'zustand/middleware';
import { Item, items, itemsById, itemsByName, Page, pagesById } from '@lib/potions';

export const useBankedItemsInputs = create(persist(combine({
  items: {} as {[itemId: number]: number},
}, (set, get) => ({
  /**
   * Adds qty of item to the state.
   */
  addItem: (itemId: number, qty: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const bankedItems = {...get().items};
    
    bankedItems[item.id] ??= 0;
    bankedItems[item.id] += qty;
    
    set({items: bankedItems});
  },

  /**
   * Sets the absolute quantity of a banked item
   */
  setItemQuantity: (itemId: number, qty: number) => {
    const bankedItems = {...get().items};

    bankedItems[itemId] = qty;

    set({items: bankedItems});
  },

  /**
   * Returns the banked potion inputs resolved into their items
   */
  getResolvedItems: () => {
    return Object.entries(get().items).map(([ itemId, qty ]) => {
      const item = itemsById.get(+itemId);
      if (!item) return;

      return {item, qty};
    }).filter(p => p) as {item: Item, qty: number}[];
  },

  /**
   * Clears all banked potion inputs from state
   */
  clearItems: () => {
    set({items: {}});
  },
})), {
  name: 'banked-items',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  migrate: (state, version) => {
    // Storing potions as their items instead of pages
    if (version < 1) {
      console.log('Migrating banked potions to use items instead of pages');
      const typedState = state as {items: {[pageId: number]: number}};
      typedState.items = Object.entries(typedState.items).reduce((acc, [ pageId, doq ]) => {
        const page = pagesById.get(+pageId);
        if (!page) return acc;

        const singleDoseItem = page.items.find(i => (!i.doses || i.doses === 1) && !i.isFlask())!;
        acc[singleDoseItem.id] = doq;

        return acc;
      }, {} as {[itemId: number]: number});
    }

    return state;
  },
}));

export interface PlannedPotionsState {
  potions: {[pageId: number]: number};
  rawPotions: {[itemId: number]: number};
  madePotions: {[pageId: number]: number};
  settings: {recipePaths: {[pageId: number]: string}},
  aggregateByPage: boolean,
}

export const usePlannedPotions = create(persist(combine({
  potions: {} as {[pageId: number]: number},
  rawPotions: {} as {[itemId: number]: number},
  madePotions: {} as {[pageId: number]: number},
  settings: {recipePaths: {}} as PlannedPotionsState['settings'],
  aggregateByPage: true,
}, (set, get) => ({
  /**
   * Decrements a potion's dose or quantity from the store. The potion item name
   * is the full name of the potion (Eg. Super antifire (3) or Avantoe potion (unf)).
   */
  decrementPotion: (potionItemName: string, quantity: number) => {
    const item = itemsByName.get(potionItemName.toLowerCase());
    if (!item || !item.isPotion()) return;
    
    const madePotions = {...get().madePotions};
    const potions = {...get().potions};
    const potionDoq = potions[item.pageId] ?? 0;
    const doq = quantity * (item.doses ?? 1);
    
    madePotions[item.pageId] ??= 0;
    madePotions[item.pageId] += (item.doses ?? 1) * quantity;
    potions[item.pageId] = Math.max(0, potionDoq - doq);
    potions[item.pageId] === 0 && delete potions[item.pageId];
    
    set({potions, madePotions});
  },
  clearPotions: () => {
    set({potions: {}, madePotions: {}});
  },
  setPotions: (potions: {[itemId: number]: number}, settings: PlannedPotionsState['settings']) => {
    // Filtering out non-potion inputs and converting potion inputs to doses (if they use doses)
    const potionDoqs = Object.entries(potions).reduce((map, [ id, qty ]) => {
      const potion = itemsById.get(+id);
      if (!potion || !potion.isPotion()) return map;

      map[potion.pageId] = qty * (potion.doses ?? 1);

      return map;
    }, {} as Record<number, number>);
    
    set({
      potions: potionDoqs,
      rawPotions: potions,
      settings,
      madePotions: {},
    });
  },

  /**
   * Returns the planned potions resolved into their pages. If results are aggregated
   * by page, potions with dosages are all summed up by page and added to the results.
   * 
   * Eg. If aggregate by page is true and there are 2 Super antifire (4) and 1 Super Antifire (3)
   * planned to be made, then the results will show that there are 11 Super antifire doses to be made
   */
  getResolvedItems: (aggregateByPage?: boolean) => {
    aggregateByPage ??= get().aggregateByPage;
    if (aggregateByPage) return Object.entries(get().potions).map(([ pageId, doq ]) => {
      const page = pagesById.get(+pageId);
      if (!page) return;

      return {page, doq};
    }).filter(p => p) as {page: Page, doq: number}[];

    const doqInventory = {...get().madePotions};
    return Object.entries(get().rawPotions).map(([ itemId, qty ]) => {
      const item = itemsById.get(+itemId);
      if (!item) return;

      doqInventory[item.pageId] ??= 0;
      const madeDoq = doqInventory[item.pageId];
      const doqToMake = (item.doses ?? 1) * qty;
      const remainingDoqToMake = Math.max(0, doqToMake - madeDoq);

      doqInventory[item.id] = Math.max(madeDoq - doqToMake, 0);
      qty = remainingDoqToMake / (item.doses ?? 1);

      return {item, qty};
    }).filter(p => p) as {item: Item, qty: number}[];
  },

  /**
   * Sets the aggregate by page setting
   */
  setAggregateByPage: (flag: boolean) => {
    set({aggregateByPage: flag})
  }
})), {
    name: 'planned-potions',
    version: 1,
    storage: createJSONStorage(() => localStorage),
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