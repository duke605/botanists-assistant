import { ReactNode } from 'react';
import classNames from 'classnames';
import styles from './Heading.module.css';

interface Heading {
  children: ReactNode;
  className?: string;
  noMargin?: boolean;
}

export const Heading = (props: Heading) => {
  return <h2
    className={classNames(
      styles.root,
      props.className,
      {[styles.noMargin]: props.noMargin},
    )}
    children={props.children}
  />
};