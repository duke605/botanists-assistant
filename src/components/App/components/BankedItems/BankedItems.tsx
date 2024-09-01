import { useBankedPotionInputs } from '@state/potions';
import { Button, Heading, Table, TableCell, TableHead } from '@lib/components';
import { Fragment, useCallback, useMemo } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';
import styles from './BankedItems.module.css';
import { create } from 'zustand';
import { combine, createJSONStorage, persist } from 'zustand/middleware';

export const useBankedItemSettings = create(persist(combine({
  qtySortAsc: true,
  nameSortAsc: true,
  splitPotions: false,
}, (set) => ({
  toggleSetting: (setting: 'qtySortAsc' | 'nameSortAsc') => {
    set(ps => ({[setting]: !ps[setting]}));
  }
})), {
  name: 'banked-items-settings',
  storage: createJSONStorage(() => localStorage),
}));

export const BankedItems = () => {
  const [ nameSortAsc, toggleSetting ] = useBankedItemSettings(s => [s.nameSortAsc, s.toggleSetting]);
  const [ resolveItems, rawItemPages ] = useBankedPotionInputs(s => [s.getResolvedItems, s.items]);
  const { findItems, cancelSearching, isSearching } = useItemFinder();
  const itemPages = useMemo(() => {
    const items = resolveItems();
    items.sort((a, b) => {
      const [ first, second ] = nameSortAsc ? [a,b] : [b,a];
      return first.page.name.localeCompare(second.page.name);
    });

    return items;
  }, [rawItemPages, nameSortAsc]);

  const importItems = useCallback(async () => {
    const haystack = captureHoldFullRs();
    await findItems(haystack);
  }, [findItems]);

  return <>
    <Heading>Inventory</Heading>
    <div className={styles.buttonRow}>
      {!isSearching && <Button onClick={importItems}>Import potions from bank</Button>}
      {isSearching && <Button danger onClick={cancelSearching}>Cancel import</Button>}
    </div>
    <Table columnWidths="min-content 1fr min-content" rowHeight="1fr" firstRowHeight="38px">
      <TableHead>
        <TableCell></TableCell>
        <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
          Name
          <span style={{rotate: nameSortAsc ? '0deg' : '180deg', cursor: 'pointer', transition: 'rotate 200ms linear', userSelect: 'none'}} onClick={() => toggleSetting('nameSortAsc')}>^</span>
        </TableCell>
        <TableCell>Dose/Quantity</TableCell>
      </TableHead>
      {itemPages.map(i =>
        <Fragment key={i.page.id}>
          <TableCell style={{lineHeight: 0, fontSize: 0, justifyContent: 'center'}}><img src={i.page.image} /></TableCell>
          <TableCell>{i.page.name}</TableCell>
          <TableCell style={{justifyContent: 'end'}}>{i.doq.toLocaleString()}</TableCell>
        </Fragment>
      )}
    </Table>
  </>
}