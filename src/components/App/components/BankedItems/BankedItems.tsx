import { useBankedItemInputs } from '@state';
import { Button, Heading, ItemListingPage, Stack } from '@lib/components';
import { useCallback, useMemo } from 'react';
import { captureHoldFullRs } from 'alt1';
import { useItemFinder } from './hooks';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'react-toastify';
import { useFormModal } from '@lib/hooks/useFormModal';
import { Item, items } from '@lib/potions';
import plusImage from '@assets/plus.png';
import styles from './BankedItems.module.css';

const allItemsSorted = items.concat().sort((a, b) => a.name.localeCompare(b.name));

export const BankedItems = () => {
  const [ modal, showModal ] = useFormModal();
  const [ rawItems, clearItems, addItem, setItemQuantity ] = useBankedItemInputs(
    useShallow(s => [s.entries, s.clearItems, s.addItem, s.setItemQuantity]),
  );
  const { findItems, cancelSearching, isSearching } = useItemFinder();

  /**
   * Prompts the user with a modal that allows them to edit the item's banked quantity. If
   * the form is successfully submitted, the qty entered in the prompt will be persisted
   */
  const editItem = useCallback((item: Item, currentQty: number) => async () => {
    const response = await showModal({
      title: 'Edit item',
      inputs: [
        {
          label: 'Quantity',
          type: 'number',
          name: 'quantity',
          required: true,
          startingValue: `${currentQty}`,
        },
      ],
    }).catch(() => 'cancelled' as const);
    if (response === 'cancelled') return;

    const qty = +response.get('quantity')!;
    if (isNaN(qty)) return;

    setItemQuantity(item.id, qty);
  }, []);

  const items = useMemo(() => {
    return rawItems.map(i => ({
      name: i.item.name,
      id: i.item.id,
      doq: i.qty,
      image: i.item.imageUrl,
      onEdit: editItem(i.item, i.qty),
      recipes: i.item.recipes.map(r => ({
        name: r.name,
        inputs: r.inputs.map(i => ({qty: i.quantity, name: i.item.name, image: i.item.imageUrl})),
        default: false,
      })),
    }))
  }, [rawItems]);

  const importItems = useCallback(async () => {
    const haystack = captureHoldFullRs();
    try {
      await findItems(haystack);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'bank_ui_not_found') {
          toast.error('Bank UI not found. Ensure your bank is open, your UI is not in legacy mode, and nothing is overlapping the bank UI.', {icon: false, autoClose: 7000});
          return;
        }
      }
    }
  }, [findItems]);

  /**
   * Shows the modal for adding items
   */
  const onAdd = useCallback(async () => {
    const response = await showModal({
      title: 'Add item',
      inputs: [
        {
          label: 'Item',
          type: 'select',
          placeholder: 'Select an item...',
          name: 'itemId',
          options: allItemsSorted.map(i => ({value: `${i.id}`, label: i.name})),
          required: true,
        },
        {
          label: 'Quantity',
          type: 'number',
          name: 'quantity',
          required: true,
        },
      ],
    }).catch(() => 'cancelled' as const);
    if (response === 'cancelled') return;

    const itemId = +response.get('itemId')!;
    const quantity = +response.get('quantity')!;
    if (isNaN(itemId) || isNaN(quantity) || quantity === 0 || itemId === 0) return;

    addItem(itemId, quantity);
  }, []);


  return <>
    <Heading>Inventory</Heading>
    <ItemListingPage
      items={items}
      buttons={<>
        {items.length > 0 && !isSearching && <Button variation="danger" onClick={clearItems}>Clear items</Button>}
        {items.length === 0 && !isSearching && <Button onClick={onAdd}>Add item</Button>}
        {!isSearching && <Button onClick={importItems}>Import items</Button>}
        {isSearching && <Button variation="danger" onClick={cancelSearching}>Cancel import</Button>}
      </>}
      options={<Stack direction="horizontal" justifyContent="center" alignItems="center" fullWidth>
        <button className={styles.add} aria-label="Add item" data-tooltip-id="tooltip" data-tooltip-content="Add item" onClick={onAdd}><img src={plusImage} /></button>
      </Stack>}
      description={!isSearching
        ? "Import potions and potion ingredients from your bank to subtract them from the list of ingredients needed when planning potions."
        : "Slowly drag your mouse from slot to slot. When the contents of the slot is read, the slot will turn from red to green. When all slots have turned green the import will automatically stop. You can manually stop the import at any time by clicking the cancel import button."
      }
    />
    {modal}
  </>
}