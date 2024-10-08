import { Checkbox } from './Checkbox';
import { Sort, Table, TableCell, TableHead, TextField } from '.';
import { useSorting } from '@lib/hooks';
import { Fragment } from 'react/jsx-runtime';
import { ChangeEvent, ReactNode, useCallback, useDeferredValue, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Tooltip } from 'react-tooltip';
import classNames from 'classnames';
import quillImage from '@assets/quill.png';
import styles from './ItemTable.module.css';

interface RecipeResult {
  inputs: {qty: number; image: string; name: string}[];
  name: string;
  default: boolean;
}

export interface ItemTableItem {
  name: string;
  doq: number;
  id: number;
  image: string;
  onEdit?: () => void;
  recipes?: RecipeResult[];

  doqDisplay?: ReactNode;
  nameDisplay?: ReactNode;
}

export interface ItemTableProps {
  items: ItemTableItem[];
  showAlternateRecipes?: boolean;
  options?: ReactNode;
  columnNameOverrides?: readonly [string | undefined, string | undefined];
  disabled?: boolean;
}

interface ItemTooltipProps {
  id: string;
  recipes: RecipeResult[];
  showAlternateRecipes?: boolean;
}

const ItemTooltip = (props: ItemTooltipProps) => {
  const [ recipeIdx, setRecipeIdx ] = useState(() => props.recipes.findIndex(r => r.default) ?? 0);
  const recipe = props.recipes[recipeIdx] ?? props.recipes[0];

  return (
    <Tooltip className={`tooltip ${styles.tooltip}`} id={props.id} float place="bottom" clickable={props.recipes.length > 1 && props.showAlternateRecipes} noArrow>
      {props.recipes.length > 1 && (props.showAlternateRecipes ?? true) && (
        <div className={styles.recipeNames}>
          {props.recipes.map((r, i) =>
            <span
              key={r.name}
              className={classNames(styles.recipeName, {[styles.recipeNameActive]: i === recipeIdx})}
              onClick={() => setRecipeIdx(i)}
              children={i+1}
            />
          )}
        </div>
      )}
      {recipe?.inputs.map(i =>
        <div className={styles.inputRow} key={i.name}>
          <span className={styles.inputQty}>{i.qty.toLocaleString()}</span>
          <span className={styles.inputX}>x</span>
          <img className={styles.inputImage} src={i.image} />
          <span className={styles.inputName}>{i.name}</span>
        </div>
      )}
    </Tooltip>
  );
}

export const ItemTable = (props: ItemTableProps) => {
  const [ sortColumn, sortDirection, progressSort, setDirection ] = useSorting<'name' | 'qty'>();
  const [ search, setSearch ] = useState('');
  const [ fuzzyMatch, setFuzzyMatching ] = useState(false);
  const deferredSearch = useDeferredValue(search);

  let items = useMemo(() => {
    if (search === '') return props.items;

    if (fuzzyMatch) {
      const fuse = new Fuse(props.items, {
        keys: ['name'],
        shouldSort: true,
      });
      
      return fuse.search(deferredSearch).map(i => i.item);
    }
    
    return props.items.filter(i => i.name.toLowerCase().includes(deferredSearch.toLowerCase()));
  }, [deferredSearch, props.items, fuzzyMatch]);
  items = useMemo(() => {
    const localItems = [...items];
    sortDirection !== 0 && localItems.sort((a, b) => {
      const [ first, second ] = sortDirection === 1 ? [a,b] : [b,a];

      return sortColumn === 'name'
        ? first.name.localeCompare(second.name)
        : first.doq - second.doq;
    });

    return localItems;
  }, [sortColumn, sortDirection, items]);

  const setSearchProxy = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
    setDirection(0);
  }, []);

  return (
    <Table columnWidths="51px 1fr min-content" rowHeight="1fr" firstRowHeight={classNames('min-content', props.options && 'min-content','42px')}>
      <TableHead>
        <TableCell className={styles.searchRow}>
          Search:
          <div style={{display: 'flex', width: '100%', alignItems: 'center', gap: '8px'}}>
            <TextField fullWidth value={search} type="text" onChange={setSearchProxy}/>
            <Checkbox checked={fuzzyMatch} data-tooltip-id="tooltip" data-tooltip-content="Fuzzy matching" onChange={e => setFuzzyMatching(e.currentTarget.checked)} />
          </div>
        </TableCell>
        {props.options && <TableCell className={styles.optionsRow} children={props.options} />}
        <TableCell></TableCell>
        <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
          {props.columnNameOverrides?.[0] ?? 'Name'}
          <Sort direction={sortColumn !== 'name' ? undefined : sortDirection} className={styles.sort} onClick={() => progressSort('name')} />
        </TableCell>
        <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
          {props.columnNameOverrides?.[1] ?? 'Quantity'}
          <Sort direction={sortColumn !== 'qty' ? undefined : sortDirection} className={styles.sort} onClick={() => progressSort('qty')} />
        </TableCell>
      </TableHead>
        {items.map(i =>
          <Fragment key={i.id}>
            <TableCell style={{lineHeight: 0, fontSize: 0, justifyContent: 'center'}}><img src={i.image} /></TableCell>
            <TableCell style={{display: 'flex', justifyContent: 'space-between'}}>
              {(i.recipes?.length ?? 0) >= 1 ? <>
                <span data-tooltip-id={`itemToolip-${i.id}`} className={styles.linkLike}>{i.nameDisplay ?? i.name}</span>
                <ItemTooltip recipes={i.recipes!} id={`itemToolip-${i.id}`} showAlternateRecipes={props.showAlternateRecipes} />
              </> : (
                <span>{i.nameDisplay ?? i.name}</span>
              )}
              {!!i.onEdit && (
                <button
                  onClick={i.onEdit}
                  data-tooltip-id='tooltip'
                  data-tooltip-content="Edit"
                  className={styles.edit}
                  children={<img src={quillImage} />}
                  disabled={props.disabled}
                />
              )}
            </TableCell>
            <TableCell style={{justifyContent: 'end'}}>{i.doqDisplay ?? i.doq.toLocaleString()}</TableCell>
          </Fragment>
        )}
    </Table>
  );
}