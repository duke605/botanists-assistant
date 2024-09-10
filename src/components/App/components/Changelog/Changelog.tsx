import changelog, { Change as ChangeType } from 'virtual:changelog';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Heading } from '@lib/components';
import styles from './Changelog.module.css';

dayjs.extend(advancedFormat);

interface ChangeProps {
  change: ChangeType;
}

interface ChangesProps {
  changes: ChangeType[];
}

const getKey = (change: ChangeType) => {
  return typeof change === 'string' ? change : Object.keys(change)[0];
}

const Change = (props: ChangeProps) => {
  return (
    <li className={styles.change}>
      {typeof props.change === 'string' ? (
        props.change
      ) : <>
        {Object.keys(props.change)[0]}
        <Changes changes={Object.values(props.change)[0]} />
      </>}
    </li>
  );
}

const Changes = (props: ChangesProps) => {
  return (
    <ul className={styles.changes}>
      {props.changes.map(change => <Change key={getKey(change)} change={change} />)}
    </ul>
  )
}

export const Changelog = () => {
  return (
    <div className={styles.root}>
      {changelog.map(log => <div key={log.date.unix()}>
         <Heading>{log.date.format('MMMM Do[,] YYYY')}</Heading>
         <Changes changes={log.changes} />
      </div>)}
    </div>
  );
}