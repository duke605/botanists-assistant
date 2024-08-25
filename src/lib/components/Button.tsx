import classNames from 'classnames';
import styles from './Button.module.css';

interface ButtonProps {
  danger?: boolean;
}

export const Button = (props: JSX.IntrinsicElements['button'] & ButtonProps) => {
  const {
    danger,
    className,
    ...rest
  } = props;

  return <button
    {...rest}
    className={classNames(
      styles.button,
      className,
      {[styles.danger]: danger},
    )}
  />
};