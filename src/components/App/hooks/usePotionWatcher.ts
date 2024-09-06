import chatReader from '@lib/chatReader';
import { readTitle } from '@lib/progressDialogReader';
import { usePlannedPotions } from '@state';
import { ChatLine } from 'alt1/chatbox';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { RecognizeResult } from 'tesseract.js';
import { useShallow } from 'zustand/react/shallow';

const mixingRegex = /^\[.+?\] You mix the (?<potion>.+).$/;
const ambiguousMixingRegex = /^\[.+?\] You mix the ingredients.$/;
const extraPotionWellRegex = /^\[.+?\] You mix such a potent potion that you fill an extra vial,/;
const extraPotionMaskRegex = /^\[.+?\] Your modified botanist's mask helps you to create an extra potion./;
const potionNameRegex = /^(?<name>.+)(?: x(?<multi>\d))?/;

const check = (
  maybeError: Error | unknown,
  errorType: string,
  notificationMessage: string,
  notifyAfter: number,
  notifyBackoff: number,
  state: {
    lastNotified: number;
    lastSuccess: number;
  }
) => {
  if (!(maybeError instanceof Error) || maybeError.message !== errorType) {
    state.lastSuccess = Date.now();
    return;
  }

  const timeSinceLastSuccess = Date.now() - state.lastSuccess;
  const timeSinceLastNotification = Date.now() - state.lastNotified;

  if (timeSinceLastSuccess > notifyAfter && timeSinceLastNotification > notifyBackoff) {
    state.lastNotified = Date.now();
    toast.error(notificationMessage, {icon: false, autoClose: 5000});
  }

  throw maybeError;
}

export const usePotionWatcher = () => {
  const [ plannedPotions, decrementPotion ] = usePlannedPotions(
    useShallow(s => [s.potions, s.decrementPotion]),
  );

  /**
   * Takes in the full name of the potion (Eg. Super antipoison (3)) and decrements it from the planned
   * potions. Batch potion names may also be passed (Eg. Supreme overload potion (6) x4) and the quantity
   * (4) will be decremented from the store
   */
  const decrementPotionProxy = useCallback((potionWithDoq: string, multiOverride?: number) => {
    const match = potionWithDoq.match(potionNameRegex);
    let potionName = potionWithDoq;
    let multi = 1;

    if (match) {
      potionName = match.groups!.name.trim();
      multi = +(match.groups!.multi ?? '1');
    }


    multi = multiOverride ?? multi;
    decrementPotion(potionName, multi);
  }, []);

  const lastDetect = useRef(0);
  const activePotion = useRef('');
  const chatbox = useRef({lastSuccess: Date.now(), lastNotified: 0});
  const timestamps = useRef({lastSuccess: Date.now(), lastNotified: 0});
  const processLine = useCallback(async (lineOrError: ChatLine | Error) => {
    try {
      check(lineOrError, 'chatbox_not_found', 'Chat box could not be found', 4000, 15000, chatbox.current);
      check(lineOrError, 'timestamps_not_found', 'Chat timestamps were not detected', 4000, 15000, timestamps.current);
      if (lineOrError instanceof Error) throw lineOrError;
    } catch {
      return;
    }

    const ambiguousMixing = lineOrError.text.match(ambiguousMixingRegex);
    if (ambiguousMixing) {
      // Not using tesseract to read the potion being made from the progress box
      // if we just read if a second ago
      if (Date.now() - lastDetect.current < 1000) {
        lastDetect.current = Date.now();
      }
      
      // Using tesseract to read the potion from the progress dialog
      else {
        const result = await readTitle().catch(e => {
          console.error(e);
          return {data: {confidence: -1}} as any as RecognizeResult;
        });
        if (result.data.confidence < 90) {
          result.data.confidence !== -1 && console.warn(`Confidence of progress dialog title was ${result.data.confidence}`);
          return;
        }

        activePotion.current = result.data.text.trim();
      }
      
      decrementPotionProxy(activePotion.current);
      return;
    }
  
    const mixing = lineOrError.text.match(mixingRegex);
    if (mixing) {
      activePotion.current = mixing.groups!.potion;
      decrementPotionProxy(activePotion.current);
      return;
    }

    const extraProc = lineOrError.text.match(extraPotionWellRegex) || lineOrError.text.match(extraPotionMaskRegex);
    if (extraProc) {
      if (!activePotion) return;
      console.log(`%cAdding 1 extra ${activePotion.current}`, 'color: green');
      decrementPotionProxy(activePotion.current, 1);
    }
  }, []);

  const queue = useRef(Promise.resolve());
  useEffect(() => {
    if (plannedPotions.size === 0) return;

    return chatReader.subscribe(async (lineOrError: ChatLine | Error) => {
      queue.current = queue.current
        .catch(console.error)
        .then(() => processLine(lineOrError));
    });
  }, [plannedPotions.size === 0]);
}