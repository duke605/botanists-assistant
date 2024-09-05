import { Button, Heading, Table, TableCell, TableHead } from '@lib/components';
import { Item, makeRecipeToolTip } from '@lib/potions';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Fragment } from 'react/jsx-runtime';
import { PlannedPotionsState, usePlannedPotions } from '@state';
import { useCallback } from 'react';
import styles from './PlannedPotionConfirmation.module.css';

interface TableProps {
  inputs: {item: Item, quantity: number}[];
  paths: Record<number, string>;
}

const LocalTable = (props: TableProps) => {
  const paths = props.paths;

  return (
    <Table columnWidths="min-content 1fr min-content" rowHeight="1fr" firstRowHeight="min-content 38px">
      <TableHead>
        <TableCell></TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Quantity</TableCell>
      </TableHead>
      {props.inputs.map(i =>
        <Fragment key={i.item.id}>
          <TableCell style={{lineHeight: 0, fontSize: 0, justifyContent: 'center'}}><img src={i.item.imageUrl} /></TableCell>
          <TableCell><span className={styles.linkLink} data-tooltip-id="tooltip" data-tooltip-html={makeRecipeToolTip(paths, i.item)}>{i.item.name}</span></TableCell>
          <TableCell style={{justifyContent: 'end'}}>{i.quantity}</TableCell>
        </Fragment>
      )}
    </Table>
  );
}

export const PlannedPotionsConfirmation = () => {
  const {
    inputs,
    settings,
  }: {
    inputs: TableProps['inputs'],
    settings: PlannedPotionsState['settings'],
  } = useLocation().state;
  const navigate = useNavigate();
  const setPotions = usePlannedPotions(s => s.setPotions);
  if (!inputs?.length) return <Navigate to=".." relative="path" />;

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
    <LocalTable inputs={inputs.filter(i => i.item.isPotion())} paths={settings!.recipePaths} />
    <Heading>Secondaries</Heading>
    <LocalTable inputs={inputs.filter(i => !i.item.isPotion())} paths={settings!.recipePaths} />
    <div className={styles.buttonRow}>
      <Button danger onClick={() => navigate(-1)}>Cancel</Button>
      <Button onClick={confirm}>Confirm</Button>
    </div>
  </>
}