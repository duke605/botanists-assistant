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

declare module 'virtual:potions' {
  const src: {name: string, image: string}[];
  export default src;
}

declare module 'virtual:item-images' {
  const src: {[id: number]: string};
  export default src;
}