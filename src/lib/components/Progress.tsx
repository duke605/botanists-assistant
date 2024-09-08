import { useEffect, useState } from 'react';
import styles from './Progress.module.css';

interface ProgressProps {
  value: number;
  text?: string;
}

export const Progress = (props: ProgressProps) => {
  const [ progress, setProgress ] = useState(0);

  useEffect(() => setProgress(props.value), [props.value]);

  return (
    <div className={styles.root}>
      <div className={styles.bar} style={{'--value': progress} as any}/>
      <span className={styles.text} children={props.text} />
    </div>
  );
}