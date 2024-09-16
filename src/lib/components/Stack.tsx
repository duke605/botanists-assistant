import { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Stack.module.css';

interface StackProps {
  children: ReactNode;
  spacing?: keyof typeof SPACINGS;
  direction?: keyof typeof DIRECTIONS,
  fullWidth?: boolean;
  alignItems?: CSSProperties['alignItems'];
  alignContent?: CSSProperties['alignContent'];
  justifyContent?: CSSProperties['justifyContent'];
  justifyItems?: CSSProperties['justifyItems'];
  className?: string;
}

const SPACINGS = {
  extraTight: '2px',
  tight: '4px',
  loose: '8px',
  extraLoose: '16px',
}

const DIRECTIONS = {
  horizontal: 'row',
  vertical: 'column',
};

export const Stack = (props: StackProps) => {
  const spacing = SPACINGS[props.spacing ?? 'loose'];
  const direction = DIRECTIONS[props.direction ?? 'horizontal'];

  return (
    <div
      className={classNames(styles.root, props.className)}
      children={props.children}
      style={{
        '--direction': direction,
        '--spacing': spacing,
        width: !props.fullWidth ? undefined : '100%',
        alignItems: props.alignItems,
        alignContent: props.alignContent,
        justifyItems: props.justifyItems,
        justifyContent: props.justifyContent,
      } as any}
    />
  );
}