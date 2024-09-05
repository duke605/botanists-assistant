import { useAggregatedPlannedPotions, usePlannedPotions } from '@state';
import { Button, Checkbox, Heading, ItemListingPage } from '@lib/components';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { useId, useMemo } from 'react';
import { itemsByName } from '@lib/potions';
import styles from './PlannedPotions.module.css';
import { Tooltip } from 'react-tooltip';

const singleDoseSuperDefencePotions = itemsByName.get('super defence (1)')!;

export const PlannedPotions = () => {
  const navigate = useNavigate();
  const [ recipePaths, aggregateByPage, clearPotions, setAggregateByPage ] = usePlannedPotions(
    useShallow(s => [s.settings.recipePaths, s.aggregateByPage, s.clearPotions, s.setAggregateByPage]),
  );
  const rawPotions = useAggregatedPlannedPotions();
  const potions = useMemo(() => {
    return rawPotions.map((i: typeof rawPotions[number]) => ({
      name: 'page' in i ? i.page.name : i.item.name,
      image: 'page' in i ? i.page.image : i.item.imageUrl,
      id: 'page' in i ? i.page.id : i.item.id,
      doq: 'page' in i ? i.doq : i.qty,  
      recipes: ('page' in i ? i.page : i.item).recipes.map(r => ({
        name: r.name,
        inputs: r.inputs.map(i => ({qty: i.quantity, name: i.item.name, image: i.item.imageUrl})),
        default: recipePaths['page' in i ? i.page.id : i.item.id] === r.name,
      })),
    }))
  }, [rawPotions, recipePaths]);
  const hasPotionsToMake = potions.length > 0;

  return (
    <>
      <Heading>Planned Potions</Heading>
      <ItemListingPage
        items={potions}
        description="No potions are planned. Click button above to setup a potion, and quantity of that potion, you wish to make."
        showAlternateRecipes={false}
        options={<div className={styles.options}>
          <div className={styles.option}>
            <img src={singleDoseSuperDefencePotions.imageUrl} style={{objectFit: 'contain', maxWidth: '24px', maxHeight: '24px'}}/>
            <Checkbox
              checked={aggregateByPage}
              onChange={(e) => setAggregateByPage(e.currentTarget.checked)}
              data-tooltip-id="tooltip"
              data-tooltip-html={`${aggregateByPage ? 'Disable' : 'Enable'} <span data-sepia>Dose mode</span><br />
Groups potions by type and shows the quantity to make in doses.<br /><br />
<span data-muted>Warning: Disabling this mode is computationally expensive. Enable this mode again if you experience stuttering.</span>`}
            />
          </div>
        </div>}
        buttons={<>
          {hasPotionsToMake && <Button danger onClick={clearPotions}>Clear potions</Button>}
          <Button onClick={() => navigate('/planned_potions/setup')}>Set potions</Button>
        </>}
      />
    </>
  );
};