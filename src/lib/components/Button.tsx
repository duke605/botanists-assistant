import classNames from 'classnames';
import buttonArrow from '@assets/buttonArrowLeft.svg';
import styles from './Button.module.css';

interface ButtonProps {
  variation?: 'danger' | 'info' | 'primary';
}

const colourMap = new Map([
  ['primary' as const, {
    '--top-start': '#FCE184',
    '--top-end': '#FABB34',
    '--bottom-start': '#E6A223',
    '--bottom-end': '#9A5301',
  }],
  ['info' as const, {
    '--top-start': '#5CB6CB',
    '--top-end': '#1699DC',
    '--bottom-start': '#0A83C4',
    '--bottom-end': '#034474',
  }],
  ['danger' as const, {
    '--top-start': '#D1855B',
    '--top-end': '#C2521B',
    '--bottom-start': '#AD3E14',
    '--bottom-end': '#87220B',
  }],
])

export const Button = (props: JSX.IntrinsicElements['button'] & ButtonProps) => {
  const {
    variation,
    className,
    children,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      style={{...colourMap.get(variation ?? 'primary')} as any}
      className={classNames(
        styles.button,
        className,
      )}
    >
      <img src={buttonArrow} className={styles.buttonArrow} style={{left: '-1px'}} />
      {children}
      <img src={buttonArrow} style={{scale: '-1 1', right: '-1px'}} className={styles.buttonArrow} />
    </button>
  );
};