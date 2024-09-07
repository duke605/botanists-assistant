import { Button, Checkbox, Heading, Select, TextField } from '@lib/components';
import { PlannedPotionsState, PotionPlannerState, useBankedItemInputs, usePotionPlanner } from '@state';
import { Fragment, useCallback, useMemo, useState } from 'react';
import modifiedBotanistMaskIcon from '@assets/Modified_botanist\'s_mask.png';
import broochOfTheGodsIcon from '@assets/Brooch_of_the_Gods.png';
import botanistsNecklaceIcon from '@assets/Botanist\'s_amulet_(new).png';
import wellIcon from '@assets/Portable_well.png';
import desertAmuletIcon from '@assets/Desert_amulet_4.png';
import scrollOfCleansingIcon from '@assets/Scroll_of_cleansing.png';
import morytaniaLegsIcon from '@assets/Morytania_legs_4.png';
import envenomedIcon from '@assets/Envenomed.png';
import meilyrClanIcon from '@assets/Meilyr_Clan.png';
import factoryOutfitIcon from '@assets/Factory_top.png';
import torstolIncenseSticksIcon from '@assets/Torstol_incense_sticks.png';
import umGrimIcon from '@assets/Underworld_Grimoire_4.png';
import botanistTopIcon from '@assets/Botanist\'s_top.png';
import perfectJujuHerblorePotionIcon from '@assets/Perfect_juju_herblore_potion_(4).png';
import wiseIcon from '@assets/Wise.png';
import { useNavigate } from 'react-router';
import { Page, pagesById, Recipe, pages } from '@lib/potions';
import styles from './PlannedPotions.module.css';

const options = pages.filter(p => p.isPotion()).map(potionPage =>
  ({value: potionPage.id, label: potionPage.name})
)

interface SimpleOptionsProps {
  option: Exclude<keyof PotionPlannerState, 'recipePaths' | 'targetPotion' | 'underworldGrimoire' | 'botanistsOutfit' | 'torstolIncense' | 'arbitraryXp'>;
  label: string;
  icon: string;
  help?: string;
}

const InfoTooltip = ({ html }) => {
  return <span data-tooltip-id="tooltip" data-tooltip-html={html} className={styles.info} />;
}

const SimpleOption = (props: SimpleOptionsProps) => {
  const { option, setOption } = usePotionPlanner(p => ({option: p[props.option], setOption: p.setOption }));

  return <>
    <label className={`${styles.label} ${styles.center}`}>
      <img src={props.icon}/>
      {props.label}
      <InfoTooltip html={props.help} />
    </label>
    <div style={{lineHeight: 0}}><Checkbox checked={option} onChange={e => setOption(props.option as any, e.target.checked)} /></div>
  </>
};

export const PlannedPotionsSetup = () => {
  const navigate = useNavigate();
  const {
    setOption,
    setRecipePath,
    targetPotion: targetPotionPageId,
    recipePaths,
    underworldGrimoire,
    modifiedBotanistMask,
    botanistsNecklace,
    broochOfTheGods,
    desertAmulet,
    envenomed,
    factoryOutfit,
    morytaniaLegs,
    scrollOfCleansing,
    well,
    useInventory,
    botanistsOutfit,
    meilyrHour,
    torstolIncense,
    arbitraryXp,
    perfectJujuHerblorePotion,
  } = usePotionPlanner();
  const inventory = useBankedItemInputs(s => s.entries);
  const [ qtyToMake, setQtyToMake ] = useState(0);
  const potionPage = pagesById.get(targetPotionPageId);
  const potionChain = useMemo(() => {
    if (!potionPage) return [];
    
    const discoverRecipes = (potion: Page, potionChain = [] as {page: Page, recipes: Recipe[]}[]) => {
      const currentPotionRecipes = potion.recipes;

      // Adding to chain of recipes that need to be resolved if the potion has more than 1 recipe
      if (currentPotionRecipes.length > 1 && !potionChain.some(p => p.page.id === potion.id)) {
        potionChain.push({page: potion, recipes: currentPotionRecipes});
      }

      for (const recipe of currentPotionRecipes) {
        for (const input of recipe.inputs) {
          if (!input.item.recipes.length) continue; // Skipping if input has no recipes
          discoverRecipes(input.item.page, potionChain);
        }
      }

      return potionChain;
    };

    return discoverRecipes(potionPage);
  }, [potionPage]);
  const hasUnselectedRecipes = useMemo(() => potionChain.some(p => !recipePaths[p.page.id]), [potionChain, recipePaths]);

  const calculateInputs = useCallback(() => {
    if (!potionPage) return;
    
    const { inputs, exp, ticks } = potionPage.calculateInputs(qtyToMake, {
      modifiedBotanistMask,
      morytaniaLegs,
      botanistsNecklace,
      broochOfTheGods,
      desertAmulet,
      envenomed,
      factoryOutfit,
      scrollOfCleansing,
      underworldGrimoire,
      well,
      recipePaths,
      arbitraryXp,
      botanistsOutfit,
      meilyrHour,
      perfectJujuHerblorePotion,
      torstolIncense,
      inventory: !useInventory ? {} : inventory.reduce((acc, entry) => {
        acc[entry.item.id] = {itemId: entry.item, qty: entry.qty};
        return acc;
      }, {}),
    });

    const settings: PlannedPotionsState['settings'] = {recipePaths};
    navigate('/planned_potions/confirm', {
      state: {inputs, settings, exp, ticks},
    });
  }, [
    potionPage,
    recipePaths,
    useInventory,
    underworldGrimoire,
    modifiedBotanistMask,
    botanistsNecklace,
    broochOfTheGods,
    desertAmulet,
    envenomed,
    factoryOutfit,
    morytaniaLegs,
    scrollOfCleansing,
    well,
    qtyToMake,
    useInventory && inventory,
    arbitraryXp,
    torstolIncense,
    meilyrHour,
    perfectJujuHerblorePotion,
    arbitraryXp,
  ]);
  
  return (
    <div className={styles.root}>
      <Heading>Bonuses</Heading>
      <SimpleOption label="Botanist's Amulet" option="botanistsNecklace" icon={botanistsNecklaceIcon} help="Gives a <span data-cyan>5%</span> chance to make a 4-dose instead of a 3-dose when worn" />
      <SimpleOption label="Modified Botanist's Mask" option="modifiedBotanistMask" icon={modifiedBotanistMaskIcon} help="Gives a <span data-cyan>5%</span> chance to duplicate potions and <span data-cyan>1%</span> extra exp when worn" />
      <SimpleOption label="Portable Well" option="well" icon={wellIcon} help="Gives a <span data-cyan>5%</span> chance to duplicate potions and <span data-cyan>10%</span> extra exp when mixing potions adjacent to a portable well. Duplication effect does not work with combination potions" />
      {well && <SimpleOption label="Brooch of the Gods" option="broochOfTheGods" icon={broochOfTheGodsIcon} help="Increases the portable well potion duplication chance from <span data-cyan>5%</span> to <span data-cyan>10%</span> when worn" />}
      <SimpleOption label="Desert Amulet" option="desertAmulet" icon={desertAmuletIcon} help="Gives a <span data-cyan>20%</span> chance to make a 4-dose instead of a 3-dose when mixing a <span data-sepia>Super Antifire (3)</span> potion when worn in the desert" />
      <SimpleOption label="Scroll of Cleansing" option="scrollOfCleansing" icon={scrollOfCleansingIcon} help="Gives a <span data-cyan>10%</span> chance to save secondary ingredients"  />
      <SimpleOption label="Morytania Legs" option="morytaniaLegs" icon={morytaniaLegsIcon} help="Gives a <span data-cyan>20%</span> chance to make a 4-dose instead of a 3-dose when mixing a <span data-sepia>Prayer Renewal (3)</span> potion when worn in Morytania" />
      <SimpleOption label="Envenomed" option="envenomed" icon={envenomedIcon} help="Gives a <span data-cyan>20%</span> chance to make a 4-dose instead of a 3-dose when mixing <span data-sepia>Antipoison (3)</span>, <span data-sepia>Super Antipoison (3)</span>, <span data-sepia>Antipoison+ (3)</span>, <span data-sepia>Antipoison++ (3)</span>, <span data-sepia>Weapon Poison+ (3)</span>, <span data-sepia>Weapon Poison++ (3)</span>, and/or <span data-sepia>Weapon Poison+++ (3)</span> potions" />
      <SimpleOption label="Factory Outfit" option="factoryOutfit" icon={factoryOutfitIcon} help="Gives a <span data-cyan>12.5%</span> chance to make a 4-dose instead of a 3-dose when mixing any potion when three or more pieces are worn" />
      <SimpleOption label="Meilyr Hour" option="meilyrHour" icon={meilyrClanIcon} help="Gives <span data-cyan>20%</span> extra exp when making combination potions in the Meilyr District when the Meilyr Voice of Seren is active" />
      <SimpleOption label="Perfect juju herblore potion" option="perfectJujuHerblorePotion" icon={perfectJujuHerblorePotionIcon} help="Gives <span data-cyan>5%</span> extra exp when making combination potions" />
      <label className={`${styles.label} ${styles.center}`}>
        <img src={torstolIncenseSticksIcon} />
        Torstol incense sticks
        <InfoTooltip html="Gives <span data-cyan>0.5%</span> extra exp per stack. Stacks multiplicatively with Meilyr hour" />
      </label>
      <Select
        isSearchable={false}
        value={{label: `${torstolIncense}`}}
        options={[
          {value: 0, label: '0'},
          {value: 1, label: '1'},
          {value: 2, label: '2'},
          {value: 3, label: '3'},
          {value: 4, label: '4'},
        ]}
        onChange={(e: any) => setOption('torstolIncense', e.value)}
      />
      <label className={`${styles.label} ${styles.center}`}>
        <img src={botanistTopIcon} />
        Botanist's Outfit
        <InfoTooltip html="Gives <span data-cyan>1%</span> extra exp per piece worn with an additional <span data-cyan>1%</span> if the whole set is worn. This option will not be able to go lower than 1 if the modified botanist's mask option is checked" />
      </label>
      <Select
        isSearchable={false}
        value={{label: `${botanistsOutfit}`}}
        isOptionDisabled={(o: any) => o.disabled}
        options={[
          {value: 0, label: '0', disabled: modifiedBotanistMask},
          {value: 1, label: '1'},
          {value: 2, label: '2'},
          {value: 3, label: '3'},
          {value: 4, label: '4'},
          {value: 5, label: '5'},
        ]}
        onChange={(e: any) => setOption('botanistsOutfit', e.value)}
      />
      <label className={`${styles.label} ${styles.center}`}>
        <img src={umGrimIcon} />
        Underworld Grimoire
        <InfoTooltip html={`<span style="white-space: pre-wrap">1 - Gives a <span data-cyan>10%</span> chance to make a 4-dose instead of a 3-dose when mixing a <span data-sepia>Necromancy potion (3)</span> when worn in the City of Um

2 - Gives the previous tier's benefits and a <span data-cyan>10%</span> chance to make a 4-dose instead of a 3-dose when mixing a <span data-sepia>Super Necromancy (3)</span> potion when worn in the City of Um

3 - Gives the previous tiers' benefits and a <span data-cyan>10%</span> chance to make a 4-dose instead of a 3-dose when mixing an <span data-sepia>Extreme Necromancy (3)</span> potion when worn in the City of Um

4 - Gives the previous tiers' benefits everywhere without needing to be worn</span>`} />
      </label>
      <Select
        isSearchable={false}
        value={{label: `${underworldGrimoire}`}}
        options={[
          {value: 0, label: '0'},
          {value: 1, label: '1'},
          {value: 2, label: '2'},
          {value: 3, label: '3'},
          {value: 4, label: '4'},
        ]}
        onChange={(e: any) => setOption('underworldGrimoire', e.value)}
      />
      <label className={`${styles.label} ${styles.center}`}>
        <img src={wiseIcon} />
        Other exp boost percentage
      </label>
      <TextField
        value={arbitraryXp}
        onChange={e => setOption('arbitraryXp', +e.currentTarget.value)}
        type="number"
        min={0}
      />

      <Heading>Potions & Recipes</Heading>
      <label className={styles.label}>
        Target Potion
        <InfoTooltip html="The potion you want to make" />
      </label>
      <Select
        value={options.find(option => +option.value === potionPage?.id)}
        options={options}
        onChange={(v: any) => setOption('targetPotion', +v.value)}
      />
      {potionChain.map(potion =>
        <Fragment key={potion.page.id}>
          <label className={styles.label}>{potion.page.name} recipe</label>
          <Select
            value={recipePaths[potion.page.id] ? {label: recipePaths[potion.page.id]} : undefined}
            options={potion.recipes.map(r => ({value: r.name, label: r.name}))}
            onChange={(e: any) => setRecipePath(potion.page.id, e.value)}
          />
        </Fragment>
      )}
      {potionPage && <>
        <label className={styles.label}>Quantity to make<InfoTooltip html={`The number of <span data-sepia>${potionPage.name}</span> to make`} /></label>
        <TextField type="number" value={qtyToMake.toString()} onChange={e => setQtyToMake(+e.currentTarget.value)}/>
      </>}
      <label className={styles.label}>Subtract potions from inventory <InfoTooltip html="Subtract potions you have in your bank from the list needed to make the number of desired doses of the target potion" /></label>
      <Checkbox checked={useInventory} onChange={e => setOption('useInventory', e.currentTarget.checked)} />
      {+!!morytaniaLegs + botanistsOutfit + (factoryOutfit ? 3 : 0) > 5 && (
        <p className={styles.armourWarning}>
          Your selected bonuses are using more armour slots than are available. XP only armour bonuses will be sacrificed when in favour of extra potion/doses bonuses when applicable.{' '}
          <InfoTooltip html={'Eg. When making potions that benefit from the factory outfit\'s extra dose chance, three pieces of botanist\'s outfit will be removed (modified botanist\'s mask will never be removed)'} />
        </p>
      )}
      <div style={{gridColumn: 'span 2', textAlign: 'center'}}>
        <Button
          onClick={calculateInputs}
          disabled={hasUnselectedRecipes || qtyToMake <= 0 || !potionPage}
          children="Calculate potions"
        />
      </div>
    </div>
  )
}