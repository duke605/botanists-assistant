import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export const useMisc = create(combine({
  cannotFindChatbox: false,
}, (set) => ({
  setCannotFindChatbox(f: boolean) {
    set({cannotFindChatbox: f});
  },
})));