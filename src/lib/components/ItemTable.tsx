import { Checkbox } from './Checkbox';
import { Sort, Table, TableCell, TableHead, TextField } from '.';
import styles from './ItemTable.module.css';
import { useSorting } from '@lib/hooks';
import { Fragment } from 'react/jsx-runtime';
import { ChangeEvent, useCallback, useDeferredValue, useMemo, useState } from 'react';
import Fuse from 'fuse.js';

interface ItemProps<T> {
  items: T[];
  getName: (item: T) => string;
  getDoq: (item: T) => number;
  getId: (item: T) => string | number;
  getImage: (item: T) => string;
}

export const ItemTable = <T,>(props: ItemProps<T>) => {
  const [ sortColumn, sortDirection, progressSort, setDirection ] = useSorting<'name' | 'qty'>();
  const [ search, setSearch ] = useState('');
  const [ fuzzyMatch, setFuzzyMatching ] = useState(false);
  const deferredSearch = useDeferredValue(search);

  let items = useMemo(() => {
    if (search === '') return props.items;

    if (fuzzyMatch) {
      const fuse = new Fuse(props.items, {
        getFn: props.getName,
        shouldSort: true,
      });
      
      return fuse.search(deferredSearch).map(i => i.item);
    }
    
    return props.items.filter(i => props.getName(i).toLowerCase().includes(deferredSearch.toLowerCase()));
  }, [deferredSearch, props.items, fuzzyMatch]);
  items = useMemo(() => {
    const localItems = [...items];
    sortDirection !== 0 && localItems.sort((a, b) => {
      const [ first, second ] = sortDirection === 1 ? [a,b] : [b,a];

      return sortColumn === 'name'
        ? props.getName(first).localeCompare(props.getName(second))
        : props.getDoq(first) - props.getDoq(second);
    });

    return localItems;
  }, [sortColumn, sortDirection, items]);

  const setSearchProxy = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
    setDirection(0);
  }, []);

  return (
    <Table columnWidths="51px 1fr min-content" rowHeight="1fr" firstRowHeight="38px">
      <TableHead>
        <TableCell className={styles.searchRow}>
          Search:
          <div style={{display: 'flex', width: '100%', alignItems: 'center', gap: '8px'}}>
            <TextField fullWidth value={search} type="text" onChange={setSearchProxy}/>
            <Checkbox checked={fuzzyMatch} data-tooltip-id="tooltip" data-tooltip-content="Fuzzy matching" onChange={e => setFuzzyMatching(e.currentTarget.checked)} />
          </div>
        </TableCell>
        <TableCell></TableCell>
        <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
          Name
          <Sort direction={sortColumn !== 'name' ? undefined : sortDirection} className={styles.sort} onClick={() => progressSort('name')} />
        </TableCell>
        <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
          Quantity
          <Sort direction={sortColumn !== 'qty' ? undefined : sortDirection} className={styles.sort} onClick={() => progressSort('qty')} />
        </TableCell>
      </TableHead>
      {items.map(i =>
        <Fragment key={props.getId(i)}>
          <TableCell style={{lineHeight: 0, fontSize: 0, justifyContent: 'center'}}><img src={props.getImage(i)} /></TableCell>
          <TableCell>{props.getName(i)}</TableCell>
          <TableCell style={{justifyContent: 'end'}}>{props.getDoq(i).toLocaleString()}</TableCell>
        </Fragment>
      )}
    </Table>
  );
}