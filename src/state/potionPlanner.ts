import { create } from 'zustand';
import { persist, createJSONStorage, combine } from 'zustand/middleware';

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