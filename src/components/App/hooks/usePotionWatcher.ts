import chatReader from '@lib/chatReader';
import { itemsByName } from '@lib/potions';
import { readTitle } from '@lib/progressDialogReader';
import { useMisc, usePlannedPotions } from '@state';
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

export const usePotionWatcher = () => {
  const setCannotFindChatbox = useMisc(s => s.setCannotFindChatbox);
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
  const processLine = useCallback(async (lineOrError: ChatLine | Error) => {
    if (lineOrError instanceof Error) {
      let handled = false;
      if (lineOrError.message === 'chatbox_not_found') {
        setCannotFindChatbox(true);
        handled = true;
      }

      !handled && console.log(lineOrError);
      return;
    }

    // Resetting error when message is successfully received
    setCannotFindChatbox(false);

    const ambiguousMixing = lineOrError.text.match(ambiguousMixingRegex);
    if (ambiguousMixing) {
      // Using tesseract to read the potion from the progress dialog if we haven't
      // made a potion in the last 2 seconds
      if (Date.now() - lastDetect.current > 2000) {
        const result = await readTitle().catch(e => {
          let logError = true;
          if (e instanceof Error && e.message === 'progress_dialog_not_found') {
            toast.error('Potion name could not be detected cause the mixing progress window could not be found.', {icon: false, autoClose: 5000});
            logError = false;
          }

          logError && console.error(e);
          return {data: {confidence: -1}} as any as RecognizeResult;
        });
        if (result.data.confidence === -1) return;

        // Checking if the potion name is at least found in the list of potions
        const text = result.data.text.trim();
        const potion = itemsByName.get(text.toLowerCase());

        if (!potion) {
          toast.error('Detected potion name could not be found in known item names.', {icon: false, autoClose: 5000});
          console.log('Detected name', text);
          return;
        }

        activePotion.current = result.data.text.trim();
      }
      
      lastDetect.current = Date.now();
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