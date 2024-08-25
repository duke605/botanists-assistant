import classNames from 'classnames';
import styles from './Tab.module.css';

interface TabProps {
  icon: string;
  title: string;
  active?: boolean;
}

export const Tab = (props: JSX.IntrinsicElements['button'] & TabProps) => {
  const {
    icon,
    active,
    className,
    ...rest
  } = props;

  return (
    <button
      {...rest}
      className={classNames(
        styles.button,
        className,
        {[styles.active]: active},
      )}
      children={<img className={styles.icon} src={icon} />}
    />
  )
};