import { useAggregatedPlannedPotions, usePlannedPotions, usePlannedPotionsProgress } from '@state';
import { Button, Heading, ItemListingPage, DoseModeOption, Progress, Stack } from '@lib/components';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react';
import styles from './PlannedPotions.module.css';


export const PlannedPotions = () => {
  const navigate = useNavigate();
  const [ recipePaths, aggregateByPage, clearPotions, setAggregateByPage ] = usePlannedPotions(
    useShallow(s => [s.settings.recipePaths, s.aggregateByPage, s.clearPotions, s.setAggregateByPage]),
  );
  const rawPotions = useAggregatedPlannedPotions();
  const progress = usePlannedPotionsProgress();
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
      {hasPotionsToMake && <Stack spacing="loose" direction="horizontal" alignItems="center">
        <span style={{position: 'relative', top: '-3px'}}>Progress:</span>
        <Progress value={progress} text={`${Math.round(progress * 1000) / 10}%`} />
      </Stack>}
      <ItemListingPage
        items={potions}
        description="No potions are planned. Click button above to setup a potion, and quantity of that potion, you wish to make."
        showAlternateRecipes={false}
        options={<div className={styles.options}>
          <DoseModeOption checked={aggregateByPage} onChange={setAggregateByPage} />
        </div>}
        buttons={<>
          {hasPotionsToMake && <Button danger onClick={clearPotions}>Clear potions</Button>}
          <Button onClick={() => navigate('/planned_potions/setup')}>Set potions</Button>
        </>}
      />
    </>
  );
};