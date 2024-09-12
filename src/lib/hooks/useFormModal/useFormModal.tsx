import { Button, Modal } from '@lib/components';
import { FormEvent, Fragment, ReactNode, useCallback, useState } from 'react';
import styles from './useFormModal.module.css';

interface Input {
  label: string;
  startingValue?: string;
  placeholder?: string;
  name: string;
  required?: boolean;
}

interface SelectInput extends Input {
  type: 'select';
  options: {value: string; label: string}[];
}

interface TextInput extends Input {
  type: 'text' | 'number';
}

interface FormConfig {
  title: string;
  inputs: (SelectInput | TextInput)[]
}

export const useFormModal = () => {
  const [ model, setModal ] = useState<ReactNode>();

  const showForm = useCallback((config: FormConfig) => {
    let reject: () => void = () => {};
    let resolve: (data: FormData) => void = () => {};
    const promise = new Promise<FormData>((res, rej) => {resolve = res; reject = rej});
    const onClose = () => {
      setModal(undefined);
      reject();
    };

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      const data = new FormData(e.currentTarget);
      resolve(data);
    };

    setModal(
      <Modal title={config.title} open={true} onClose={onClose}>
        <form method="dialog" onSubmitCapture={onSubmit} className={styles.form}>
          {config.inputs.map(input => <Fragment key={input.label}>
            <label>{input.label}</label>
            {input.type === 'select' ? (
              <select
                defaultValue={input.startingValue}
                name={input.name}
                required={input.required}
              >
                {input.placeholder && <option value="">{input.placeholder}</option>}
                {input.options.map(o =>
                  <option key={o.value} value={o.value}>{o.label}</option>
                )}
              </select>
            ) : (
              <input
                type={input.type}
                name={input.name}
                defaultValue={input.startingValue}
                required={input.required}
                placeholder={input.placeholder}
              />
            )}
          </Fragment>)}
          <div style={{gridColumn: 'span 2', justifySelf: 'center'}}>
            <Button type="submit">Done</Button>
          </div>
        </form>
      </Modal>
    );

    return promise;
  }, []);

  return [model, showForm] as const;
}