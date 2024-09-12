import { ReactNode, useEffect, useRef } from 'react';
import closeImage from '@assets/close.png';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  children: ReactNode;
  open?: boolean;
  onClose?: (value: string) => void;
}

export const Modal = (props: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!props.open) {
      ref.current!.open && ref.current!.close();
      return;
    } else {
      !ref.current!.open && ref.current!.showModal();
    }

    let listener: () => void;
    ref.current?.addEventListener('close', listener = () => {
      props.onClose?.(ref.current!.returnValue);
    });

    return () => {
      ref.current?.removeEventListener('close', listener);
    }
  }, [props.open, props.onClose]);

  return (
    <dialog className={styles.root} ref={ref}>
      <h2 className={styles.header}>
        {props.title}
        <button className={styles.close} onClick={() => ref.current?.close()}>
          <img src={closeImage} />
        </button>
      </h2>
      <div className={styles.body}>
        {props.children}
      </div>
    </dialog>
  );
}