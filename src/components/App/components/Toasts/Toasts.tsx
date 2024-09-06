import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cssTransition, ToastContainer } from 'react-toastify';
import styles from './Toasts.module.css';

export const Toasts = () => {
  const toastRoot = useMemo(() => document.querySelector('#toast-root')!, []);

  return createPortal(
    <ToastContainer
      position="bottom-center"
      stacked
      autoClose={5000}
      closeOnClick
      closeButton={false}
      hideProgressBar
      style={{textAlign: 'center'}}
      toastClassName={styles.toast}
      transition={cssTransition({
        enter: styles.enter,
        exit: styles.exit,
        collapse: false,
      })}
    />,
    toastRoot,
  )
}