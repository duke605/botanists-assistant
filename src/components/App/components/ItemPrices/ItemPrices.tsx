import { Button, Heading, ItemListingPage, Stack } from '@lib/components';
import { items as allItems, Item } from '@lib/potions';
import { useItemPrices } from '@state/itemPrices';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFormModal } from '@lib/hooks';
import coinStack from '@assets/coinStack.png';
import lock from '@assets/lock.svg';
import styles from './ItemPrices.module.css';

const columnNameOverrides = [undefined, 'Price'] as const;

export const ItemPrices = () => {
  const [ modal, showModal ] = useFormModal();
  const [ itemPrices, pinnedItems, fetchingPrices, isItemPinned, setItemPrice, fetchPrices, getPriceForItem ] = useItemPrices(
    useShallow(s => [s.itemPrices, s.pinnedItems, s.fetching, s.isItemPinned, s.setItemPrice, s.fetchPrices, s.getPriceForItem]),
  );

  const editItem = useCallback((item: Item) => async () => {
    const response = await showModal({
      title: 'Edit price',
      inputs: [
        {
          type: 'number',
          label: 'Price',
          name: 'price',
          required: true,
          startingValue: (getPriceForItem(item) ?? 0).toString(),
        },
        {
          type: 'checkbox',
          label: 'Lock price',
          name: 'pin',
          help: 'Locking the price prevents it from being updated when prices are fetched. This is useful for items that can be bought from stores at a lower price.',
          startingValue: isItemPinned(item),
        },
      ],
    }).catch(() => 'cancelled' as const);
    if (response === 'cancelled') return;

    const price = +response.get('price')!;
    const pin = response.get('pin') === 'on';
    if (isNaN(price) || price < 0) return;

    setItemPrice(item.name, price, pin);
  }, [pinnedItems]);

  const items = useMemo(() => {
    return allItems.values()
      .filter(i => itemPrices.has(i.name.toLowerCase()))
      .map(i => {
        const itemPrice = itemPrices.get(i.name.toLowerCase())!;
        const pinned = isItemPinned(i);

        return {
          id: i.id,
          image: i.imageUrl,
          name: i.name,
          doq: itemPrice,
          doqDisplay: (
            <Stack className={styles.money} fullWidth direction="horizontal" justifyContent={pinned ? 'space-between' : 'end'} spacing="loose">
              {pinned && <img data-tooltip-content="Price locked" data-tooltip-id="tooltip" src={lock} />}
              <Stack spacing="loose" direction="horizontal" alignItems="center">
                {itemPrice.toLocaleString()}
                <img src={coinStack} />
              </Stack>
            </Stack>
          ),
          onEdit: editItem(i),
        };
      })
      .toArray();
  }, [itemPrices, editItem, pinnedItems]);

  return <>
    <Heading>Item Prices</Heading>
    <ItemListingPage
      items={items}
      buttons={<Button disabled={fetchingPrices} onClick={fetchPrices}>Fetch prices</Button>}
      description="No item prices. Use this page to fetch and manage item prices of your herblore inputs."
      disabled={fetchingPrices}
      columnNameOverrides={columnNameOverrides}
    />
    {modal}
  </>;
}