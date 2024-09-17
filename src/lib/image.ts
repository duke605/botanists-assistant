import { ImgRef } from 'alt1';

export const findImageWithFallback = (haystack: ImgRef, primary: ImageData, secondary: ImageData) => {
  let usedSecondary = false;
  let results = haystack.findSubimage(primary)[0];
  if (!results) {
    usedSecondary = true;
    results = haystack.findSubimage(secondary)[0];
    if (!results) return [false] as const;
  }

  return [true, results, usedSecondary] as const;
}