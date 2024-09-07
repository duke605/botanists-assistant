import { create } from 'zustand';
import { persist, createJSONStorage, combine } from 'zustand/middleware';

export interface PotionPlannerState {
  targetPotion: number;
  recipePaths: {
      [pageId: number]: string;
  };
  useInventory: boolean;
  well: boolean;
  modifiedBotanistMask: boolean;
  botanistsNecklace: boolean;
  envenomed: boolean;
  factoryOutfit: boolean;
  underworldGrimoire: number;
  morytaniaLegs: boolean;
  botanistsOutfit: number;
  broochOfTheGods: boolean;
  desertAmulet: boolean;
  meilyrHour: boolean;
  torstolIncense: number;
  scrollOfCleansing: boolean;
  perfectJujuHerblorePotion: boolean;
  arbitraryXp: number;
}

type SetOptionsKeys = Exclude<keyof PotionPlannerState, 'recipePaths'>;
export const usePotionPlanner = create(persist(combine({
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
  botanistsOutfit: 0,
  meilyrHour: false,
  perfectJujuHerblorePotion: false,
  torstolIncense: 0,
  arbitraryXp: 0,
}, (set, get, api) => ({
  clear: () => set(api.getInitialState()),
  setOption: <T extends SetOptionsKeys,>(option: T, value: PotionPlannerState[T]) => {
    const otherOptions = {} as Partial<PotionPlannerState>;
    const newOptions = {...otherOptions, [option]: value};
  
    // Turning off BotG when well is turned off
    if (option === 'well' && !value) {
      newOptions['broochOfTheGods'] = false;
    }

    // Forcing botanist's outfit to be at least 1 if modified botanist's mask is enabled
    if (option === 'modifiedBotanistMask' && value) {
      newOptions['botanistsOutfit'] = Math.max(get().botanistsOutfit, 1);
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