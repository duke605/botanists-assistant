declare global {
  interface alt1 extends import('alt1') {}
}

declare module '*?alt1' {
  const src: Promise<ImageData>;
  export default src;
}

declare module '*?alt1font' {
  const src: import('alt1/ocr').FontDefinition;
  export default src;
}

declare module 'virtual:item-images' {
  const src: {[id: number]: string};
  export default src;
}

declare module 'virtual:changelog' {
  import { Dayjs } from 'dayjs';
  export default [] as {
    date: Dayjs;
    changes: string[];
  }[];
}

interface Iterator<T> {
  map<R>(callbackFn: (element: T, index: number) => R): Iterator<R>;
  reduce(callbackFn: (accumulator: T, element: T, index: number) => T): T;
  reduce<R>(callbackFn: (accumulator: R, element: T, index: number) => R, initialValue: R): R;
  forEach(callbackFn: (element: T, index: number) => void): void;
  some(pred: (element: T, index: number) => boolean): boolean;
  every(pred: (element: T, index: number) => boolean): boolean;
  filter(pred: (element: T, index: number) => boolean): Iterator<T>;
  find(pred: (element: T, index: number) => boolean): T | undefined;
  toArray(): T[];
}