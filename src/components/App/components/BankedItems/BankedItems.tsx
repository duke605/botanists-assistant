import { useBankedItemsInputs } from '@state/potions';
import { Button, Heading, ItemListingPage } from '@lib/components';
import { useCallback, useMemo } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';

export const BankedItems = () => {
  const [
    clearItems,
    rawItems,
  ] = useBankedItemsInputs(s => [
    s.clearItems,
    s.entries,
  ]);
  const { findItems, cancelSearching, isSearching } = useItemFinder();
  const items = useMemo(() => {
    return rawItems.map(i => ({
      ...i,
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
      getId={i => i.item.id}
      getImage={i => i.item.imageUrl}
      getDoq={i => i.qty}
      getName={i => i.item.name}
      getRecipes={i => i.recipes}
    />
  </>
}