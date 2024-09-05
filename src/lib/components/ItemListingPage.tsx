import { ReactNode } from 'react';
import { ItemTable, ItemTableItem, ItemTableProps } from '.';
import classNames from 'classnames';
import styles from './ItemListingPage.module.css';

interface ItemListingPageProps<T extends ItemTableItem> extends ItemTableProps<T> {
  buttons: ReactNode;
  description: ReactNode;
}

export const ItemListingPage = <T extends ItemTableItem,>(props: ItemListingPageProps<T>) => {
  return <>
    <div className={classNames(styles.buttonRow, {[styles.noItems]: !props.items.length})}>
      {props.buttons}
    </div>
    {!props.items.length && <p className={styles.noItemsDesc} children={props.description} />}
    {!!props.items.length && (
      <ItemTable
        items={props.items}
        showAlternateRecipes={props.showAlternateRecipes}
        options={props.options}
      />)}
  </>
}