import zero from '@assets/quantityFont/0.png?alt1';
import one from '@assets/quantityFont/1.png?alt1';
import two from '@assets/quantityFont/2.png?alt1';
import three from '@assets/quantityFont/3.png?alt1';
import four from '@assets/quantityFont/4.png?alt1';
import five from '@assets/quantityFont/5.png?alt1';
import six from '@assets/quantityFont/6.png?alt1';
import seven from '@assets/quantityFont/7.png?alt1';
import eight from '@assets/quantityFont/8.png?alt1';
import nine from '@assets/quantityFont/9.png?alt1';
import { ImageDetect, webpackImages } from 'alt1';

const numbers = webpackImages({
  '0': zero,
  '1': one,
  '2': two,
  '3': three,
  '4': four,
  '5': five,
  '6': six,
  '7': seven,
  '8': eight,
  '9': nine,
});

export const getQuantity = async (img: ImageData) => {
  const positions: {n: number, x: number}[] = [];

  for (const [ number, image ] of Object.entries(await numbers.promise)) {
    const areas = ImageDetect.findSubbuffer(img, image);

    for (const area of areas) {
      positions.push({n: +number, x: area.x})
    }
  }
  
  positions.sort((a, b) => b.x - a.x);
  return positions.length
    ? positions.reduce((a, p, i) => a + (p.n * Math.pow(10, i)), 0)
    : 1;
};