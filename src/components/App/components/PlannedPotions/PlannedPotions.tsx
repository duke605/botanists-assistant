import { usePlannedPotions } from '@state/potions';
import { Button, Heading, Table, TableCell, TableHead } from '@lib/components';
import { useNavigate } from 'react-router';
import { Fragment } from 'react/jsx-runtime';
import { makeRecipeToolTip } from '@lib/potions';
import { useShallow } from 'zustand/react/shallow';
import styles from './PlannedPotions.module.css';

export const PlannedPotions = () => {
  const navigate = useNavigate();
  const [ potions, recipePaths, clearPotions ] = usePlannedPotions(
    useShallow(s => [s.potions, s.settings.recipePaths, s.clearPotions]),
  );
  const hasPotionsToMake = potions.size > 0;

  return (
    <>
      <Heading>Planned Potions</Heading>
      {hasPotionsToMake && <>
        <div className={styles.buttonRow}>
          <Button onClick={() => navigate('/planned_potions/setup')}>Set potions</Button>
          <Button onClick={clearPotions}>Clear potions</Button>
        </div>
        {/* <div className={styles.aggregateSetting}>
          <span>Aggregate by potion</span>
          <Checkbox checked={aggregateByPage} onChange={(e) => setAggregateByPage(e.currentTarget.checked)} />
        </div> */}
        <Table columnWidths="min-content 1fr min-content" rowHeight="1fr" firstRowHeight="38px">
          <TableHead>
            <TableCell></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>{true ? 'Dose/Quantity' : 'Quantity'}</TableCell>
          </TableHead>
          {Array.from(potions.values()).map(pageOrItem =>
            <Fragment key={pageOrItem.page.id}>
              <TableCell style={{lineHeight: 0, fontSize: 0, justifyContent: 'center'}}><img src={pageOrItem.page.image} /></TableCell>
              <TableCell><span className={styles.linkLink} data-tooltip-id="tooltip" data-tooltip-html={makeRecipeToolTip(recipePaths!, pageOrItem.page)}>{pageOrItem.page.name}</span></TableCell>
              <TableCell style={{justifyContent: 'end'}}>{Math.ceil(pageOrItem.doq).toLocaleString()}</TableCell>
            </Fragment>
          )}
        </Table>
      </>}
      {!hasPotionsToMake && (
        <div className={styles.noPotions}>
          <div className={styles.buttonRow}><Button onClick={() => navigate('/planned_potions/setup')}>Plan potions</Button></div>
          <p className={styles.noPotionsDesc}>No potions are planned. Click button above to setup a potion, and quantity of that potion, you wish to make.</p>
        </div>
      )}
    </>
  );
};