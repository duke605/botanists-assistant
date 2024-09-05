import { useBankedItemInputs } from '@state';
import { Button, Heading, ItemListingPage } from '@lib/components';
import { useCallback, useMemo } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';
import { useShallow } from 'zustand/react/shallow';

export const BankedItems = () => {
  const [ rawItems, clearItems ] = useBankedItemInputs(
    useShallow(s => [s.entries, s.clearItems]),
  );
  const { findItems, cancelSearching, isSearching } = useItemFinder();
  const items = useMemo(() => {
    return rawItems.map(i => ({
      name: i.item.name,
      id: i.item.id,
      doq: i.qty,
      image: i.item.imageUrl,
      recipes: i.item.recipes.map(r => ({
        name: r.name,
        inputs: r.inputs.map(i => ({qty: i.quantity, name: i.item.name, image: i.item.imageUrl})),
        default: false,
      })),
    }))
  }, [rawItems]);

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
      description={!isSearching
        ? "Import potions and potion ingredients from your bank to subtract them from the list of ingredients needed when planning potions."
        : "Slowly drag your mouse from slot to slot. When the contents of the slot is read, the slot will turn from red to green. When all slots have turned green the import will automatically stop. You can manually stop the import at any time by clicking the cancel import button."
      }
      items={items}
    />
  </>
}