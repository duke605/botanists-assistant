import itemImages from 'virtual:item-images';
import herbloreData from '@data/herbloreItems.json';

const INVENTORY_SIZE = 28;

type PageId = number;
type ItemId = number;
type RecipeName = string;
type DoseOrQty = number;
type Quantity = number;

interface JSONInput {
  itemId: number;
  isSecondary: boolean;
  isSavable?: boolean;
  quantity: number;
}

interface JSONRecipe {
  name: string;
  outputId: number;
  exp: number;
  herbLevel: number;
  quantity: number;
  ticks: number[];
  inputs: JSONInput[];
  categories: string[];
}

interface CalculationOptions {
  botanistsNecklace?: boolean;
  well?: boolean;
  broochOfTheGods?: boolean;
  underworldGrimoire?: number;
  desertAmulet?: boolean;
  modifiedBotanistMask?: boolean;
  factoryOutfit?: boolean;
  envenomed?: boolean;
  scrollOfCleansing?: boolean;
  morytaniaLegs?: boolean;
  recipePaths?: Record<PageId, RecipeName>;
  botanistsOutfit?: number;
  meilyrHour?: boolean;
  torstolIncense?: number;
  perfectJujuHerblorePotion?: boolean;
  arbitraryXp?: number;
}

interface CalculateInputOptionsWithInventory extends CalculationOptions {
  inventory?: Record<ItemId, DoseOrQty>;
}

interface CalculateInputsContext {
  inputs: Counter<ItemId>;
  exp: number;
  ticks: number;
  inventories: number;
}

class Counter<T> extends Map<T, number> {
  add = (key: T, delta: number) => {
    const curr = this.get(key) ?? 0;
    return this.set(key, curr + delta);
  }

  sub = (key: T, delta: number) => {
    return this.add(key, -delta);
  }

  get = (key: T) => {
    return super.get(key) ?? 0;
  }
}

class Inventory {
  private inventory = new Counter<PageId>();

  constructor(inventory: Record<ItemId, number>) {
    for (const [ itemId, qty ] of Object.entries(inventory)) {
      const item = itemsById.get(+itemId);
      if (!item) continue;
  
      this.inventory.add(item.pageId, (item.doses ?? 1) * qty);
    }
  }

  /**
   * Takes `n` of `pageId` from the inventory. Returns the number of `n` remaining
   * after taking `pageId` from the inventory. If the amount in inventory could completely
   * cover `n` then the returned number will be 0
   */
  take = (pageId: number, n: DoseOrQty) => {
    const amountInInventory = this.inventory.get(pageId)
    const maxToTake = Math.min(n, amountInInventory);

    this.inventory.sub(pageId, maxToTake);

    return n - maxToTake;
  }

  /**
   * Takes quantity of item from inventory. If the item is a potion with doses, the
   * item will be converted to doses and the doses will be taken from the inventory. The number
   * return is the quantity (not doses) that could not be satisfied by the inventory. 
   * 
   * Eg. If the item is a Super attack (3) and the quantity is 2 and there are 5 doses of
   * Super attack in the inventory, then then 5 doses will be taken from the inventory and
   * 0.333... will be returned
   */
  takeItem = (item: Item, n: Quantity) => {
    const doses = item.doses ?? 1;
    const doq = doses * n;

    return this.take(item.pageId, doq) / doses;
  }

  /**
   * Sets an item's dose or quantity
   */
  setItemDoq = (pageId: number, doq: number) => {
    this.inventory.set(pageId, doq);
  }
}

export class Page {
  public readonly recipes: Recipe[];
  public readonly categories: Set<string>;
  private _items?: Item[];
  private _image?: string;

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly content: string,
    categories: string[],
    recipes?: JSONRecipe[],
  ) {
    this.recipes = recipes?.map(r => new Recipe(r.name, r.exp, r.ticks, r.herbLevel, r.outputId, r.quantity, this, r.inputs)) ?? [];
    this.categories = new Set(categories);
  }

  get items() {
    return this._items ??= items.filter(i => i.pageId === this.id);
  }

  get image() {
    return this._image ??= this.recipes[0]?.output?.item?.imageUrl ?? this.items[0].imageUrl;
  }

  isCombinationPotion = () => {
    return this.categories.has('Category:Combination potions');
  }

  isPotion = () => {
    return this.id !== 10523 // vial of water
      && this.categories.has('Category:Potions');
  }

  calculateInputs = (needed: number, options?: CalculateInputOptionsWithInventory) => {
    let startingRecipe = this.recipes[0];

    // Getting the specific recipe to use if the potion has more than one recipe
    if (this.recipes.length > 1) {
      const startingRecipeName = options?.recipePaths?.[this.id];
      if (!startingRecipeName) throw new Error('unresolved_recipe_path');

      startingRecipe = this.recipes.find(r => r.name === startingRecipeName)!;
      if (!startingRecipe) throw new Error('recipe_not_found');
    }

    const inventory = new Inventory(options?.inventory ?? {});
    const context = {
      inputs: new Counter<ItemId>(),
      exp: 0,
      ticks: 0,
      inventories: 0,
    };

    // Setting the target potion's quantity/dose to 0 since that's what we want to make
    // on top of the potions we already have banked
    inventory.setItemDoq(this.id, 0);

    startingRecipe.calculateInputs(needed, context, {
      ...options,
      inventory,
    });

    return {
      exp: context.exp,
      ticks: context.ticks,
      inputs: context.inputs.entries().map(([ itemId, quantity ]) => ({
        item: itemsById.get(+itemId)!,
        quantity,
      })).toArray(),
    };
  }
}

export class Item {
  public imageUrl: string;

  constructor (
    public readonly id: number,
    public readonly name: string,
    public readonly update: string,
    public readonly release: string,
    public readonly weight: number,
    public readonly examime: string,
    public readonly tradable: 'yes' | 'no' | 'restricted',
    public readonly noteable: boolean,
    public readonly equipable: boolean,
    public readonly stackable: boolean,
    public readonly quest: boolean,
    public readonly members: boolean,
    public readonly pageName: string,
    public readonly pageId: number,
    public readonly wikiImageUrl: string,
    public readonly doses?: number,
    public readonly relatedItemIds?: number[],
    public readonly version?: string,
    public readonly flask?: true,
  ) {
    this.imageUrl = itemImages[id]!
  }

  get page() {
    return pagesById.get(this.pageId)!;
  }

  get recipes() {
    return this.page.recipes;
  }

  get relatedItems() {
    return this.relatedItemIds?.map(id => itemsById.get(id)!) ?? [];
  }

  isFlask = () => {
    return !!this.flask;
  }

  isCombinationPotion () {
    return this.page.isCombinationPotion();
  }

  isPotion = () => {
    return this.page.isPotion();
  }

  calculateInputs = (needed: number, options?: CalculateInputOptionsWithInventory) => {
    return this.page.calculateInputs(needed, options);
  }
}

export class Input {
  constructor(
    public readonly itemId: number,
    public readonly quantity: number,
    public readonly isSecondary: boolean,
    public readonly isSavable: boolean,
    public readonly recipe: Recipe,
  ) {}

  get item() {
    return itemsById.get(this.itemId)!;
  }
}

export class Output {
  constructor(
    public readonly itemId: number,
    public readonly quantity: number,
    public readonly recipe: Recipe,
  ) {}

  get item() {
    return itemsById.get(this.itemId)!;
  }

  /**
   * Calculates the output quantity after factoring in all the optional buffs
   */
  calculateQuantity = (options?: Omit<CalculationOptions, 'recipePaths' | 'scrollOfCleansing'>) => {
    let quantity = this.quantity;

    if (this.canProduceExtraDose()) {
      let extraDoseChance = 0;
      const botgEffect = options?.well && options?.broochOfTheGods;
      const grimTier = options?.underworldGrimoire ?? 0;

      if (options?.desertAmulet && this.item.name.includes('super antifire')) extraDoseChance = calcExtraDoseChance(extraDoseChance, 20);
      else if (options?.botanistsNecklace) extraDoseChance = calcExtraDoseChance(extraDoseChance, 5);

      if (options?.envenomed && this.item.name.includes('poison')) extraDoseChance = calcExtraDoseChance(extraDoseChance, 10);

      if (options?.morytaniaLegs && this.item.name.includes('prayer renewal')) extraDoseChance = calcExtraDoseChance(extraDoseChance, 20);
      
      if (options?.factoryOutfit) extraDoseChance = calcExtraDoseChance(extraDoseChance, 12.5);

      if (this.item.page.name === 'necromancy potion' && (grimTier >= 4 || (!botgEffect && grimTier >= 1))) extraDoseChance = calcExtraDoseChance(extraDoseChance, 10);
      if (this.item.page.name.includes('super necromancy') && (grimTier >= 4 || (!botgEffect && grimTier >= 2))) extraDoseChance = calcExtraDoseChance(extraDoseChance, 10);
      if (this.item.page.name.includes('extreme necromancy') && (grimTier >= 4 || (!botgEffect && grimTier >= 3))) extraDoseChance = calcExtraDoseChance(extraDoseChance, 10);

      quantity += 1 / this.item.doses! * extraDoseChance;
    }

    if (options?.modifiedBotanistMask) quantity += 0.05;
    if (!this.item.isCombinationPotion()) {
      if (options?.well) quantity += 0.05;
      if (options?.broochOfTheGods && options.well) quantity += 0.05;
    }

    return quantity;
  }

  /**
   * Determines if this output is capable of producing an extra dose
   */
  canProduceExtraDose = () => {
    return this.item.doses === 3 && this.quantity === 1;
  }
}

export class Recipe {
  public readonly inputs: Input[];
  public readonly output: Output;
  public readonly secondaries: Input[];
  private _slotsUsed: number | undefined;

  constructor(
    public readonly name: string,
    public readonly exp: number,
    public readonly ticks: number[],
    public readonly herbLevel: number,
    outputItemId: number,
    outputQuantity: number,
    public readonly page: Page,
    inputs: JSONInput[],
  ) {
    this.inputs = inputs.map(i => new Input(i.itemId, i.quantity, !!i.isSecondary, i.isSavable ?? true, this));
    this.output = new Output(outputItemId, outputQuantity, this);
    this.secondaries = this.inputs.filter(i => i.isSecondary);
  }

  /**
   * The number of slots used by the inputs for one mixing/crafting operation of the recipe
   */
  get slotsUsed() {
    return this._slotsUsed ??= this.inputs.reduce((a, i) => a + (i.item.stackable ? 1 : i.quantity), 0);
  }

  /**
   * The number of mixing/crafting operations that can be done before needing to bank
   */
  get operationsPerInventory() {
    return Math.floor(INVENTORY_SIZE / this.slotsUsed); 
  }

  /**
   * Calculates the total ticks required to complete the provided number of mixing/crafting
   * operations for this recipe
   */
  calculateTicksForOperations = (n: number, options?: {scrollOfCleansing?: boolean}) => {
    const SOC_SPEED_UP_CHANCE = 0.1;
    const SOC_SPEED_UP_TICK_REDUCTION = 1;
    const SOC_SPEED_UP_AVG_TICK_REDUCTION = SOC_SPEED_UP_CHANCE * SOC_SPEED_UP_TICK_REDUCTION;

    const firstMixOfInventoryOperations = Math.ceil(n / this.operationsPerInventory);
    const contiguousMixOperations = n - firstMixOfInventoryOperations;
    const firstMixTicks = this.ticks[0] ?? 0;
    const contiguousMixTicks = !options?.scrollOfCleansing
      ? firstMixTicks
      : Math.max(0, firstMixTicks - SOC_SPEED_UP_AVG_TICK_REDUCTION);

    return firstMixOfInventoryOperations * firstMixTicks + contiguousMixOperations * contiguousMixTicks;
  }

  /**
   * Calculates the exp rewarded per craft of this recipe with the provided
   * buffs taken into account
   */
  calculateExp = (options?: CalculationOptions) => {
    const ARMOUR_SLOTS = 5;

    const morytaniaLegs = !!options?.morytaniaLegs;
    const well = !!options?.well;
    const meilyrHour = !!options?.meilyrHour;
    const perfectJujuHerblorePotion = !!options?.perfectJujuHerblorePotion;
    const arbitraryXp = options?.arbitraryXp ?? 0;
    const factoryOutfit = options?.factoryOutfit ?? 0;
    const torstolIncense = options?.torstolIncense ?? 0;
    let botanistsOutfit = options?.botanistsOutfit ?? 0;
    
    let armourSlotsUsed = 0;
    if (morytaniaLegs && this.output.item.name.includes('Prayer renewal')) armourSlotsUsed++;
    if (botanistsOutfit) armourSlotsUsed += botanistsOutfit;
    if (factoryOutfit && this.output.canProduceExtraDose()) armourSlotsUsed += 3;

    // If the number of items equipped is more than the number of armour slots we have
    // we sacrifice exp bonuses in favour of extra doses
    if (armourSlotsUsed > ARMOUR_SLOTS) {
      botanistsOutfit -= armourSlotsUsed - ARMOUR_SLOTS;
    }

    let exp = this.exp;
    if (arbitraryXp) exp += this.exp * (arbitraryXp/100);
    if (well) exp += this.exp * 0.1;
    if (botanistsOutfit > 0) exp += this.exp * (botanistsOutfit === 5 ? 0.06 : botanistsOutfit/100);
    if (this.output.item.isCombinationPotion()) {
      if (perfectJujuHerblorePotion) exp += this.exp * 0.05;
      if (meilyrHour && torstolIncense) exp += this.exp * 0.2 * (1 + torstolIncense * 0.005);
      else if (meilyrHour) exp += this.exp * 0.2;
      else if (torstolIncense) exp += this.exp * torstolIncense * 0.005;
    }

    return exp;
  }

  calculateInputs = (quantityNeeded: number, context: CalculateInputsContext, options?: CalculationOptions & {inventory?: Inventory}, itemNeeded = this.output.item) => {
    quantityNeeded = options?.inventory?.takeItem(itemNeeded, quantityNeeded) ?? quantityNeeded;
    if (quantityNeeded <= 0) return;

    const outputQuantity = this.output.calculateQuantity(options);

    // Converting output of recipe to doses
    const recipeOutputDoses = outputQuantity * (this.output.item.doses ?? 1);
    const dosesNeeded = quantityNeeded * (itemNeeded.doses ?? 1);

    const operationsNeeded = Math.ceil(dosesNeeded / recipeOutputDoses);
    
    context.exp += this.calculateExp(options) * operationsNeeded;
    context.ticks += this.calculateTicksForOperations(operationsNeeded, options);
    context.inventories += Math.ceil(operationsNeeded / this.operationsPerInventory);
    context.inputs.add(itemNeeded.id, Math.ceil(quantityNeeded));
    
    for (const input of this.inputs) {
      let inputQtyNeeded = operationsNeeded * input.quantity;
      
      // Reducing the input quantity if the input is a secondary and the scroll of cleansing
      // is being used
      if (input.isSecondary && options?.scrollOfCleansing && input.isSavable) {
        const saveChance = 0.1;
        inputQtyNeeded = Math.ceil(inputQtyNeeded * (1 - (saveChance / this.secondaries.length)));
      }
        
      // If the input has no recipe to make it then we figure out how much of the input we need
      // after accounting for the inventory, add it to the list of inputs, and continue
      if (input.item.recipes.length === 0) {
        inputQtyNeeded = options?.inventory?.takeItem(input.item, inputQtyNeeded) ?? inputQtyNeeded;

        if (inputQtyNeeded === 0) continue;

        context.inputs.add(input.itemId, Math.ceil(inputQtyNeeded));
        continue;
      }

      const recipeName = options?.recipePaths?.[input.item.pageId];
      if (!recipeName && input.item.recipes.length > 1) throw new Error('unresolved_recipe_path');

      const recipe = recipeName
        ? input.item.recipes.find(r => r.name === recipeName)
        : input.item.recipes[0];
      if (!recipe) throw new Error('recipe_not_found');

      recipe.calculateInputs(inputQtyNeeded, context, options, input.item);
    }
  }
}

/**
 * Calculates the chance to produce an extra dose with diminishing returns
 */
const calcExtraDoseChance = (currentChance: number, ...chances: number[]) => {
  for (const c of chances) currentChance += (1-currentChance) * (c/100);

  return currentChance;
}

export const items = herbloreData.items.map(i => new Item(
  i.id,
  i.name,
  i.update,
  i.release,
  i.weight,
  i.examine,
  i.tradable as 'yes' | 'no' | 'restricted',
  i.noteable,
  i.equipable,
  i.stackable,
  i.quest,
  i.members,
  i.pageName,
  i.pageId,
  i.image,
  (i as any).doses,
  (i as any).relatedIds,
  (i as any).version,
  (i as any).flask,
));

export const pages = herbloreData.pages.map(p => new Page(
  p.id,
  p.name,
  p.content,
  p.categories,
  (p as any).recipes,
));

export const itemsById = items.reduce((m, i) => m.set(i.id, i), new Map<number, Item>());
export const pagesById = pages.reduce((m, p) => m.set(p.id, p), new Map<number, Page>());
export const itemsByName = items.reduce((m, i) => m.set(i.name.toLowerCase(), i), new Map<string, Item>());
export const pagesByName = pages.reduce((m, p) => m.set(p.name.toLowerCase(), p), new Map<string, Page>());