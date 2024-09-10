import { DetailedHTMLProps, ImgHTMLAttributes, useMemo } from 'react';
import coins1Image from '@assets/Coins_1.png';
import coins2Image from '@assets/Coins_2.png';
import coins3Image from '@assets/Coins_3.png';
import coins4Image from '@assets/Coins_4.png';
import coins5Image from '@assets/Coins_5.png';
import coins25Image from '@assets/Coins_25.png';
import coins250Image from '@assets/Coins_250.png';
import coins1000Image from '@assets/Coins_1000.png';
import coins10000Image from '@assets/Coins_10000.png';

interface MoneyProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  value: number;
}

export const Money = (props: MoneyProps) => {
  const {
    value,
    ...rest
  } = props;
  const image = useMemo(() => {
    const absValue = Math.abs(value);
    if (absValue >= 10_000) return coins10000Image;
    if (absValue >= 1_000) return coins1000Image;
    if (absValue >= 250) return coins250Image;
    if (absValue >= 25) return coins25Image;
    if (absValue >= 5) return coins5Image;
    if (absValue >= 4) return coins4Image;
    if (absValue >= 3) return coins3Image;
    if (absValue >= 2) return coins2Image;
    
    return coins1Image;
  }, [value]);

  return <img {...rest} src={image} />;
}