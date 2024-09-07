import { Button, DoseModeOption, Heading, ItemTable, ItemTableItem } from '@lib/components';
import { Item } from '@lib/potions';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { PlannedPotionsState, usePlannedPotions } from '@state';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import herbloreImage from '@assets/herblore.png';
import timerImage from '@assets/timer.png';
import styles from './PlannedPotionConfirmation.module.css';

interface TableProps {
  inputs: {item: Item, quantity: number}[];
  paths: Record<number, string>;
}

export const PlannedPotionsConfirmation = () => {
  const {
    inputs,
    settings,
    exp,
    ticks,
  }: {
    inputs: TableProps['inputs'];
    exp: number;
    settings: PlannedPotionsState['settings'];
    ticks: number;
  } = useLocation().state;
  const navigate = useNavigate();
  const [ setPotions, setDoseMode, doseMode ] = usePlannedPotions(
    useShallow(s => [s.setPotions, s.setAggregateByPage, s.aggregateByPage]),
  );
  if (!inputs?.length) return <Navigate to=".." relative="path" />;

  const time = useMemo(() => {
    const withRem = (n1: number) => [Math.floor(n1).toString().padStart(2, '0'), n1 - Math.floor(n1)] as const;
    const s = ticks * 600 / 1000;
    const [ hours, hoursRem ] = withRem(s / (60 * 60));
    const [ minutes, minutesRem ] = withRem(hoursRem * 60);
    const [ seconds ] = withRem(minutesRem * 60);

    return `${hours}:${minutes}:${seconds}`;
  }, [ticks]);

  const potions = useMemo(() => {
    if (!doseMode) return inputs.filter(i => i.item.isPotion()).map<ItemTableItem>(i => ({
      id: i.item.id,
      image: i.item.imageUrl,
      doq: i.quantity,
      name: i.item.name,
      recipes: i.item.recipes.map(r => ({
        name: r.name,
        default: r.name === settings.recipePaths[i.item.pageId],
        inputs: r.inputs.map(i => ({name: i.item.name, image: i.item.imageUrl, qty: i.quantity})),
      })),
    }));

    return inputs.filter(i => i.item.isPotion()).reduce((m, i) => {
      if (!m.has(i.item.pageId)) {
        m.set(i.item.pageId, {
          id: i.item.pageId,
          image: i.item.page.image,
          doq: 0,
          name: i.item.page.name,
          recipes: i.item.recipes.map(r => ({
            name: r.name,
            default: r.name === settings.recipePaths[i.item.pageId],
            inputs: r.inputs.map(i => ({name: i.item.name, image: i.item.imageUrl, qty: i.quantity})),
          })),
        });
      }

      m.get(i.item.pageId)!.doq += i.quantity * (i.item.doses ?? 1);

      return m;
    }, new Map<number, ItemTableItem>()).values().toArray();
  }, [inputs, settings.recipePaths, doseMode]);

  const secondaries = useMemo(() => {
    return inputs.filter(i => !i.item.isPotion()).map(i => ({
      id: i.item.id,
      image: i.item.imageUrl,
      doq: i.quantity,
      name: i.item.name,
    }));
  }, [inputs, settings.recipePaths]);

  const confirm = useCallback(() => {
    // Filtering out non-potion inputs and converting potion inputs to doses (if they use doses)
    const potions = inputs.reduce((map, input) => {
      if (!input.item.isPotion()) return map;

      return map.set(input.item.id, {item: input.item, qty: input.quantity});
    }, new Map<number, {item: Item, qty: number}>());
    
    setPotions(potions, settings);
    navigate('/planned_potions');
  }, [inputs, settings]);

  return <>
    <Heading>Potions</Heading>
    <div className={styles.meta}>
      <span className={styles.metaItem} data-tooltip-content="Experience" data-tooltip-id="tooltip">
        <img src={herbloreImage} />
        {exp.toLocaleString()}
      </span>
      <span className={styles.metaItem} data-tooltip-content="Est. Time" data-tooltip-id="tooltip">
        <img src={timerImage} />
        {time}
      </span>
    </div>
    <ItemTable
      showAlternateRecipes={false}
      items={potions}
      options={<div className={styles.options}>
        <DoseModeOption checked={doseMode} onChange={setDoseMode} />
      </div>}
    />
    <Heading>Secondaries</Heading>
    <ItemTable
      showAlternateRecipes={false}
      items={secondaries}
    />
    <div className={styles.buttonRow}>
      <Button danger onClick={() => navigate(-1)}>Cancel</Button>
      <Button onClick={confirm}>Confirm</Button>
    </div>
  </>
}