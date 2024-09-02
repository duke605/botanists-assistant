import { useCallback, useLayoutEffect, useState } from 'react';
import classNames from 'classnames';
import styles from './TextField.module.css';

type TextFieldProps = Omit<JSX.IntrinsicElements['input'], 'type'> & {
  type: 'number' | 'text';
  fullWidth?: boolean;
};

export const TextField = (props: TextFieldProps) => {
  const [ localValue, setLocalValue ] = useState(props.value ?? '');

  useLayoutEffect(() => {
    if (props.type === 'text') return;

    setLocalValue(props.value ?? '');
  }, [props.type, props.value]);

  const onChangeProxy = useCallback(e => {
    const value = e.currentTarget.value as string;

    if (props.type === 'text') {
      setLocalValue(value);
      props.onChange?.(e);
      return;
    }

    if (value.length === 0) {
      setLocalValue('');
      return;
    }
    
    const allNumbers = value.split('').every(e => !isNaN(e as any));
    if (!allNumbers) return;

    setLocalValue(value);
    props.onChange?.(e);
  }, [props.onChange, props.type]);

  const onBlurProxy = useCallback(e => {
    const value = e.currentTarget.value;

    if (props.type === 'text') {
      props.onBlur?.(e);
      return;
    }

    if (value.length === 0) {
      setLocalValue(props.value ?? '');
      return;
    }

    props.onBlur?.(e);
  }, [props.value, props.onBlur, props.type]);


  return <input
    {...props}
    type="text"
    value={localValue}
    onChange={onChangeProxy}
    onBlur={onBlurProxy}
    className={classNames(
      props.className,
      styles.textField,
      {[styles.fullWidth]: props.fullWidth},
    )}
  />
};