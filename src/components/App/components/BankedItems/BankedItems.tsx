import { useBankedItemsInputs } from '@state/potions';
import { Button, Heading, ItemListingPage } from '@lib/components';
import { useCallback, useMemo } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';
import styles from './BankedItems.module.css';

export const BankedItems = () => {
  const [
    resolveItems,
    clearItems,
    rawItems,
  ] = useBankedItemsInputs(s => [
    s.getResolvedItems,
    s.clearItems,
    s.items,
  ]);
  const { findItems, cancelSearching, isSearching } = useItemFinder();
  const items = useMemo(resolveItems, [rawItems]);

  const importItems = useCallback(async () => {
    const haystack = captureHoldFullRs();
    await findItems(haystack);
  }, [findItems]);

  return <>
    <Heading>Inventory</Heading>
    <ItemListingPage
      buttons={<>
        {items.length > 0 && !isSearching && <Button danger onClick={clearItems}>Clear items</Button>}
        {!isSearching && <Button onClick={importItems}>Import items</Button>}
        {isSearching && <Button danger onClick={cancelSearching}>Cancel import</Button>}
      </>}
      description="Import potions and potion ingredients from your bank to subtract them from the list of ingredients needed when planning potions."
      items={items}
      getId={i => i.item.id}
      getImage={i => i.item.imageUrl}
      getDoq={i => i.qty}
      getName={i => i.item.name}
    />
  </>
}