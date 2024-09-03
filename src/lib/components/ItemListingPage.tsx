import { ReactNode } from 'react';
import { ItemTable } from '.';
import classNames from 'classnames';
import styles from './ItemListingPage.module.css';

type ItemTableProps<T,> = Parameters<typeof ItemTable<T>>[0];
interface ItemListingPageProps<T> extends ItemTableProps<T> {
  buttons: ReactNode;
  description: ReactNode;
}

export const ItemListingPage = <T,>(props: ItemListingPageProps<T>) => {
  return <>
    <div className={classNames(styles.buttonRow, {[styles.noItems]: !props.items.length})}>
      {props.buttons}
    </div>
    {!props.items.length && <p className={styles.noItemsDesc} children={props.description} />}
    {!!props.items.length && (
      <ItemTable
        items={props.items}
        getId={props.getId}
        getImage={props.getImage}
        getDoq={props.getDoq}
        getName={props.getName}
        getRecipes={props.getRecipes}
      />
    )}
  </>
}