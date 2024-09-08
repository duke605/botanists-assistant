import changelog from 'virtual:changelog';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { Heading } from '@lib/components';
import styles from './Changelog.module.css';

dayjs.extend(advancedFormat);

export const Changelog = () => {
  return (
    <div className={styles.root}>
      {changelog.map(log => <div key={log.date.unix()}>
         <Heading>{log.date.format('MMMM Do[,] YYYY')}</Heading>
         <ul className={styles.changes}>
            {log.changes.map(change => <li key={change} className={styles.change}>{change}</li>)}
         </ul>
      </div>)}
    </div>
  );
}