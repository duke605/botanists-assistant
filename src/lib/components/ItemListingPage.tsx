import { ReactNode } from 'react';
import { ItemTable, ItemTableProps } from '.';
import classNames from 'classnames';
import styles from './ItemListingPage.module.css';

interface ItemListingPageProps extends ItemTableProps {
  buttons: ReactNode;
  description: ReactNode;
}

export const ItemListingPage = (props: ItemListingPageProps) => {
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
        columnNameOverrides={props.columnNameOverrides}
        disabled={props.disabled}
      />)}
  </>
}