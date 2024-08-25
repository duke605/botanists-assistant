import classNames from 'classnames';
import styles from './Checkbox.module.css';

export const Checkbox = (props: JSX.IntrinsicElements['input']) => {
  return <input
    {...props}
    type="checkbox"
    className={classNames(styles.checkbox, props.className)}
  />;
}