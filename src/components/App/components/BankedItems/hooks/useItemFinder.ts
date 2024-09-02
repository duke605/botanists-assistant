import { getMousePosition, ImgRef, mixColor, Rect, RectLike } from 'alt1';
import { useCallback, useEffect, useState } from 'react';
import bankTopLeft from '@assets/bankTopLeft.png?alt1';
import bankBottomRight from '@assets/bankBottomRight.png?alt1';
import blank from '@assets/blank.png?alt1';
import { getQuantity } from '@lib/quantity';
import TooltipReader from 'alt1/tooltip';
import Signal from '@lib/classes/Signal';
import { itemsByName } from '@lib/potions';
import { useBankedItemsInputs } from '@state/potions';

export const useItemFinder = () => {
  const [ signal, setSignal ] = useState<Signal>();
  const [ progress, setProgress ] = useState<{slots: Number, scanned: number}>();
  const [ addItem, clearItems ] = useBankedItemsInputs(p => [p.addItem, p.clearItems]);

  /**
   * Looks for the bank interface and highlights the non-empty ban slots. When the user mouses over a slot
   * the tooltip is read to determine what item is in that slot. If it is a potion, it is added to the the banked
   * potions, otherwise it is ignore.
   * 
   * What is a potion and what is not is determined by the `POTION_REGEX` regular expression. If the name of the
   * item in the slot matches the regular express AND the potion name is found in the list of registered potions
   * then it is added to the banked potions
   */
  const findItems = useCallback(async (haystack: ImgRef) => {
    // If we are already searching for potions we exit immediately. Should never happen but just in case
    if (signal) return;
    const localSignal = new Signal();
    
    try {
      setSignal(localSignal);
      clearItems();

      const fullImage = haystack.read();

      // The pixel offset from the top left of the image used to find the top left of the bank UI
      // to the top left of the interior of the bank UI
      const TOP_LEFT_OFFSET_X = 7;
      const TOP_LEFT_OFFSET_Y = 76;

      // The pixel offset from the top left of the image used to find the bottom right of the bank UI
      // to the bottom right of the interior of the bank UI
      const BOTTOM_RIGHT_OFFSET_X = -175;
      const BOTTOM_RIGHT_OFFSET_Y = -5;

      // The padding to the first slot of the bank UI
      const X_PADDING = 11;
      const TOP_PADDING = 8;

      // The gaps between bank slots
      const COLUMN_GAP = 6;
      const ROW_GAP = 10;

      // The dimensions of a bank slot
      const SLOT_WIDTH = 38;
      const SLOT_HEIGHT = 34;

      const [ btl, bbr, bl ] = await Promise.all([bankTopLeft, bankBottomRight, blank]);
      const bank: RectLike = {x: 0, y: 0, height: 0, width: 0};

      const bbrAreas = haystack.findSubimage(bbr);
      if (!bbrAreas.length) throw new Error('bank_ui_not_found');

      const btlAreas = haystack.findSubimage(btl);
      if (!btlAreas.length) throw new Error('bank_ui_not_found');
      bank.x = btlAreas[0].x + TOP_LEFT_OFFSET_X;
      bank.y = btlAreas[0].y + TOP_LEFT_OFFSET_Y;
      bank.width = bbrAreas[0].x + BOTTOM_RIGHT_OFFSET_X - bank.x;
      bank.height = bbrAreas[0].y + BOTTOM_RIGHT_OFFSET_Y - bank.y;
      const xSlots = Math.floor((bank.width - X_PADDING * 2 - COLUMN_GAP) / (SLOT_WIDTH + COLUMN_GAP));
      const ySlots = Math.floor((bank.height - TOP_PADDING - ROW_GAP) / (SLOT_HEIGHT + ROW_GAP));
      const slots = [] as {rect: Rect, item: string}[];

      outer: for (let y = 0; y < ySlots; y++) {
        for (let x = 0; x < xSlots; x++) {
          const xCord = X_PADDING + bank.x + (SLOT_WIDTH + COLUMN_GAP) * x;
          const yCord = TOP_PADDING + bank.y + (SLOT_HEIGHT + ROW_GAP) * y;
          if (haystack.findSubimage(bl, xCord, yCord, SLOT_WIDTH, SLOT_HEIGHT)?.length) break outer;

          slots[y * xSlots + x] = {rect: new Rect(xCord, yCord, SLOT_WIDTH, SLOT_HEIGHT), item: ''};
        }
      }

      const GROUP_NAME = 'bankPotions';
      alt1.overLaySetGroup(GROUP_NAME);
      alt1.overLayFreezeGroup(GROUP_NAME);
      alt1.overLayContinueGroup(GROUP_NAME);
      try {
        let lastItem;
        while (slots.find(s => !s.item)) {
          alt1.overLayContinueGroup(GROUP_NAME);
          for (const slot of slots) {
            const colour = slot.item === '' ? mixColor(0xff, 0, 0, 0xff) : mixColor(0x32, 0xCD, 0x32, 0xff);
            alt1.overLayRect(colour, slot.rect.x, slot.rect.y, slot.rect.width, slot.rect.height, 200, 1);
          }
          
          alt1.overLayFreezeGroup(GROUP_NAME);
          const op = await Promise.race([
            localSignal.promise.catch(() => 'CANCELLED') as Promise<'CANCELLED'>,
            new Promise(r => setTimeout(() => r(), alt1.captureInterval)) as Promise<void>,
          ]);
          if (op === 'CANCELLED') break;

          const mousePos = getMousePosition();
          if (mousePos === null) continue;

          // Determining which slot is hovered over
          let hoveredSlot: typeof slots[0] | undefined;
          for (const slot of slots) {
            if (slot.rect.containsPoint(mousePos.x, mousePos.y)) {
              hoveredSlot = slot;
              break;
            }
          }
          if (!hoveredSlot || hoveredSlot.item) continue;

          setProgress({slots: slots.length, scanned: slots.reduce((a, s) => a + +!!s.item, 0)});
          const itemName = TooltipReader.read()?.readBankItem() as string | null;
          if (itemName && itemName !== lastItem) {
            lastItem = itemName;
            hoveredSlot.item = itemName;
            const item = itemsByName.get(itemName.trim().toLowerCase());
            if (!item) continue;

            let qty = await getQuantity(fullImage.clone(hoveredSlot.rect));
            if (qty === 0) continue;
            
            addItem(item.id, qty);
          }
        }
      } finally {
        alt1.overLayContinueGroup(GROUP_NAME);
        alt1.overLayClearGroup(GROUP_NAME);
      }
    } finally {
      localSignal.reject();
      setSignal(undefined);
    }
  }, [signal]);

  const cancelSearching = useCallback(() => {
    signal?.reject();
  }, [signal]);

  // Cancelling the signal when component is unmounted or signal changes
  useEffect(() => cancelSearching, [cancelSearching]);

  return {
    findItems,
    cancelSearching,
    progress,
    isSearching: !!signal,
  }
};