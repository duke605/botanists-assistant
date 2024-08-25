import { useBankedPotionInputs } from '@state/potions';
import { Button, Table } from '@lib/components';
import { useCallback } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';
import styles from './BankedItems.module.css';

export const BankedItems = () => {
  const potionInputs = useBankedPotionInputs(s => s.getResolvedItems());
  const { findItems, cancelSearching, isSearching } = useItemFinder();
  const headers = [
    {element: '', align: 'center'},
    {element: 'Name', align: 'center'},
    {element: 'Quantity/Doses', align: 'center'},
  ];
  const rows = potionInputs.map(input => [
    {element: <img src={input.page.image} />, align: 'center'},
    {element: input.page.name},
    {element: input.doq.toLocaleString(), align: 'right'},
  ]);

  const importItems = useCallback(async () => {
    const haystack = captureHoldFullRs();
    await findItems(haystack);
  }, [findItems]);

  return <>
    <div className={styles.buttonRow}>
      {!isSearching && <Button onClick={importItems}>Import potions from bank</Button>}
      {isSearching && <Button danger onClick={cancelSearching}>Cancel import</Button>}
    </div>
    <Table headers={headers as any} rows={rows as any} />
  </>
}